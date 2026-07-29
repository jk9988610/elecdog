// W1 记忆→行为闭环 — 经历负载调制对外行为（非地球式「记忆」语义）

export function memoryFeedbackEnabled(profile) {
  return profile?.memoryFeedbackEnabled === true;
}

export function initMemoryFeedback(being) {
  being.memRxLoad = 0;
  being.memTxLoad = 0;
  being.memActLoad = 0;
}

/** 每 tick 衰减，避免无限累积 */
export function decayMemoryLoads(being, decay = 0.96) {
  being.memRxLoad = (being.memRxLoad ?? 0) * decay;
  being.memTxLoad = (being.memTxLoad ?? 0) * decay;
  being.memActLoad = (being.memActLoad ?? 0) * decay;
}

export function accumulateMemoryLoads(being, { hadRx = false, hadTx = false, hadAct = false } = {}) {
  if (hadRx) being.memRxLoad = Math.min(1, (being.memRxLoad ?? 0) + 0.08);
  if (hadTx) being.memTxLoad = Math.min(1, (being.memTxLoad ?? 0) + 0.06);
  if (hadAct) being.memActLoad = Math.min(1, (being.memActLoad ?? 0) + 0.1);
}

/** 记忆负载 → 对外行为偏置（可观察，非感受映射） */
export function memoryActBias(being, profile) {
  if (!memoryFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, memLoad: 0 };
  }
  const social = (being.memRxLoad ?? 0) + (being.memTxLoad ?? 0) * 0.5;
  const actMem = being.memActLoad ?? 0;
  const memLoad = +(social + actMem).toFixed(4);
  return {
    actBoost: +(actMem * 0.12 - social * 0.04).toFixed(4),
    thresholdDelta: +(-social * 0.03 + actMem * 0.02).toFixed(4),
    memLoad,
  };
}

export function memoryFeedbackSnapshot(being) {
  return {
    memRxLoad: +(being.memRxLoad ?? 0).toFixed(3),
    memTxLoad: +(being.memTxLoad ?? 0).toFixed(3),
    memActLoad: +(being.memActLoad ?? 0).toFixed(3),
  };
}
