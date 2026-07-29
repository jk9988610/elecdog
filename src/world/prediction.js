// W3 场态–寄存器预测误差 — 可观察记录层（非「知道」语义）

export function predictionEnabled(profile) {
  return profile?.predictionEnabled === true;
}

export function predictionFeedbackEnabled(profile) {
  return predictionEnabled(profile) && profile?.predictionFeedbackEnabled === true;
}

export function initPrediction(being) {
  being.prdSubPred = null;
  being.prdRegPred = null;
  being.prdErrorSum = 0;
  being.prdErrorCount = 0;
  being.prdLastError = 0;
  being.prdHighErrorTicks = 0;
  being.prdLogCount = 0;
  being.prdLateErrorSum = 0;
  being.prdLateErrorCount = 0;
  being.prdLateEarlySum = 0;
  being.prdLateEarlyCount = 0;
  being.prdLateLateSum = 0;
  being.prdLateLateCount = 0;
}

function blend(prev, next, alpha) {
  return prev * (1 - alpha) + next * alpha;
}

/** 上一 tick 预测 vs 当前场态/寄存器 → 误差；再更新 EMA 预测 */
export function updatePrediction(being, substrate, profile) {
  const alpha = profile?.predictionAlpha ?? 0.35;
  const channels = substrate ?? being.registers;
  const regs = being.registers;
  const n = Math.min(channels.length, regs.length);

  if (!being.prdSubPred || being.prdSubPred.length !== n) {
    being.prdSubPred = channels.slice(0, n);
    being.prdRegPred = regs.slice(0, n);
    return { error: 0, first: true };
  }

  let errSum = 0;
  for (let i = 0; i < n; i++) {
    errSum += Math.abs((being.prdSubPred[i] ?? 0) - channels[i]);
    errSum += Math.abs((being.prdRegPred[i] ?? 0) - regs[i]) * 0.5;
  }
  const error = errSum / (n * 1.5);

  for (let i = 0; i < n; i++) {
    being.prdSubPred[i] = blend(being.prdSubPred[i], channels[i], alpha);
    being.prdRegPred[i] = blend(being.prdRegPred[i], regs[i], alpha);
  }

  being.prdLastError = +error.toFixed(4);
  being.prdErrorSum += error;
  being.prdErrorCount += 1;

  const highThreshold = profile?.predictionHighThreshold ?? 0.12;
  if (error >= highThreshold) {
    being.prdHighErrorTicks = (being.prdHighErrorTicks ?? 0) + 1;
  }

  return { error: being.prdLastError, first: false };
}

/** 预测误差 → 行为微调（Phase 74；非「知道」语义） */
export function predictionActBias(being, profile) {
  if (!predictionFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, prdLoad: 0 };
  }
  const err = being.prdLastError ?? 0;
  const meanErr = being.prdErrorCount ? being.prdErrorSum / being.prdErrorCount : err;
  const prdLoad = +(err + meanErr * 0.3).toFixed(4);
  return {
    actBoost: +(meanErr * 0.05 - err * 0.04).toFixed(4),
    thresholdDelta: +(-err * 0.03 + meanErr * 0.012).toFixed(4),
    prdLoad,
  };
}

export function processPredictionTick(
  world,
  recorder,
  being,
  profile,
  substrate,
  { fieldStat = false } = {}
) {
  if (!predictionEnabled(profile)) return null;

  const result = updatePrediction(being, substrate, profile);
  if (result.first) return result;

  const lateStart = profile?.predictionLateStart ?? 960;
  const lateMid = profile?.predictionLateMid ?? 1440;
  if (world.tick >= lateStart && world.tick < lateMid) {
    being.prdLateEarlySum = (being.prdLateEarlySum ?? 0) + result.error;
    being.prdLateEarlyCount = (being.prdLateEarlyCount ?? 0) + 1;
  } else if (world.tick >= lateMid) {
    being.prdLateLateSum = (being.prdLateLateSum ?? 0) + result.error;
    being.prdLateLateCount = (being.prdLateLateCount ?? 0) + 1;
  }
  if (world.tick >= lateStart) {
    being.prdLateErrorSum = (being.prdLateErrorSum ?? 0) + result.error;
    being.prdLateErrorCount = (being.prdLateErrorCount ?? 0) + 1;
  }

  const logThreshold = profile?.predictionLogThreshold ?? 0.06;
  const meanError = being.prdErrorCount
    ? +(being.prdErrorSum / being.prdErrorCount).toFixed(4)
    : 0;
  const shouldLog =
    result.error >= logThreshold ||
    (world.tick % 160 === 0 && result.error >= logThreshold * 0.5);

  if (!shouldLog) return { ...result, logged: false };

  being.prdLogCount = (being.prdLogCount ?? 0) + 1;
  const payload = {
    kind: 'PRD',
    error: result.error,
    meanError,
    highTicks: being.prdHighErrorTicks ?? 0,
    domReg: being.regDomReg ?? 0,
    domSub: being.regDomSub ?? 0,
  };

  if (!fieldStat) {
    recorder.register(
      world.tick,
      being.id,
      `[PRD] err ${payload.error} mean ${payload.meanError}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[PRD] err ${payload.error}`, payload);
  }

  return { ...result, logged: true, meanError };
}

export function predictionSnapshot(being) {
  const meanError = being.prdErrorCount
    ? +(being.prdErrorSum / being.prdErrorCount).toFixed(4)
    : 0;
  const lateMean =
    being.prdLateErrorCount > 0
      ? +(being.prdLateErrorSum / being.prdLateErrorCount).toFixed(4)
      : null;
  const lateEarly =
    being.prdLateEarlyCount > 0
      ? +(being.prdLateEarlySum / being.prdLateEarlyCount).toFixed(4)
      : null;
  const lateLate =
    being.prdLateLateCount > 0
      ? +(being.prdLateLateSum / being.prdLateLateCount).toFixed(4)
      : null;
  const lateTrend =
    lateEarly != null && lateLate != null ? +(lateLate - lateEarly).toFixed(4) : null;
  return {
    lastError: +(being.prdLastError ?? 0).toFixed(4),
    meanError,
    lateMeanError: lateMean,
    lateEarlyError: lateEarly,
    lateLateError: lateLate,
    lateTrend,
    highErrorTicks: being.prdHighErrorTicks ?? 0,
    logCount: being.prdLogCount ?? 0,
    samples: being.prdErrorCount ?? 0,
  };
}
