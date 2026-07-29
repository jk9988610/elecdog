// W4 社会知识累积 — RX 频次编码 → 可继承社会迹（非地球式「文化」语义）

export function socialKnowledgeEnabled(profile) {
  return profile?.socialKnowledgeEnabled === true;
}

export function socialKnowledgeFeedbackEnabled(profile) {
  return socialKnowledgeEnabled(profile) && profile?.socialKnowledgeFeedbackEnabled !== false;
}

export function initSocialKnowledge(being) {
  being.socEncRx = 0;
  being.socEncCross = 0;
  being.socEncTotal = 0;
  being.socEncode = [0, 0, 0];
  being.socTrace = null;
  being.socTraceVia = null;
  being.socLinCount = 0;
  being.socLogCount = 0;
}

export function accumulateSocialEncode(being, { hadRx = false, crossRx = 0 } = {}) {
  if (hadRx) {
    being.socEncRx = (being.socEncRx ?? 0) + 1;
    being.socEncCross = (being.socEncCross ?? 0) + crossRx;
  }
  being.socEncTotal = (being.socEncTotal ?? 0) + 1;
}

/** 将 RX 频次编码为 [rxShare, crossShare, intensity] */
export function updateSocialEncode(being, profile) {
  const minTicks = profile?.socialKnowledgeMinTicks ?? 12;
  const rx = being.socEncRx ?? 0;
  const total = being.socEncTotal ?? 0;
  const cross = being.socEncCross ?? 0;
  if (total < minTicks) {
    being.socEncode = [0, 0, 0];
    return being.socEncode;
  }
  const rxShare = rx / total;
  const crossShare = rx > 0 ? cross / rx : 0;
  const intensity = Math.min(1, rx / (profile?.socialKnowledgeIntensityDiv ?? 72));
  being.socEncode = [
    +rxShare.toFixed(4),
    +crossShare.toFixed(4),
    +intensity.toFixed(4),
  ];
  return being.socEncode;
}

/** 谱系/分裂时继承亲代社会迹 */
export function applySocialKnowledgeInheritance(
  world,
  recorder,
  child,
  parents,
  profile,
  { via = 'LINEAGE' } = {}
) {
  if (!socialKnowledgeEnabled(profile)) return null;
  const list = parents.filter(Boolean);
  if (!list.length) return null;

  const encodes = list.map((p) => p.socEncode ?? [0, 0, 0]);
  const traces = list.map((p) => p.socTrace ?? p.socEncode ?? [0, 0, 0]);
  const inherited = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const encAvg = encodes.reduce((s, e) => s + (e[i] ?? 0), 0) / encodes.length;
    const traceAvg = traces.reduce((s, e) => s + (e[i] ?? 0), 0) / traces.length;
    inherited[i] = +(encAvg * 0.6 + traceAvg * 0.4).toFixed(4);
  }

  child.socTrace = inherited;
  child.socTraceVia = via;
  child.socLinCount = (child.socLinCount ?? 0) + 1;

  const payload = {
    kind: 'SOC-LIN',
    via,
    trace: inherited,
    parentIds: list.map((p) => p.id),
  };

  if (!profile.fieldStatMode) {
    recorder.evolution(
      world.tick,
      child.id,
      `[SOC-LIN] ${via} trace ${inherited.join('/')}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, child.id, `[SOC-LIN] ${via}`, payload);
  }

  return payload;
}

/** 继承社会迹 → 行为偏置 */
export function socialKnowledgeActBias(being, profile) {
  if (!socialKnowledgeFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, socLoad: 0 };
  }
  const trace = being.socTrace ?? [0, 0, 0];
  const encode = being.socEncode ?? [0, 0, 0];
  const rxShare = trace[0] ?? 0;
  const crossShare = trace[1] ?? 0;
  const intensity = trace[2] ?? 0;
  const encIntensity = encode[2] ?? 0;
  const socLoad = +(intensity + encIntensity * 0.5).toFixed(4);

  return {
    actBoost: +(crossShare * 0.06 + intensity * 0.04 - rxShare * 0.02).toFixed(4),
    thresholdDelta: +(-crossShare * 0.04 - intensity * 0.02).toFixed(4),
    socLoad,
  };
}

export function processSocialKnowledgeTick(
  world,
  recorder,
  being,
  profile,
  { fieldStat = false } = {}
) {
  if (!socialKnowledgeEnabled(profile)) return null;

  const enc = updateSocialEncode(being, profile);
  const hasTrace = being.socTrace && (being.socTrace[2] ?? 0) >= 0.08;
  const hasEncode = (enc[2] ?? 0) >= 0.12;
  const newborn = world.tick - (being.bornAtTick ?? 0) < 40;
  const shouldLog =
    (hasTrace || hasEncode) &&
    (newborn || world.tick % 180 === 0 || (hasTrace && hasEncode));

  if (!shouldLog) return { encode: enc, logged: false };

  being.socLogCount = (being.socLogCount ?? 0) + 1;
  const payload = {
    kind: 'SOC-ENC',
    encode: enc,
    trace: being.socTrace,
    via: being.socTraceVia,
  };

  if (!fieldStat) {
    recorder.evolution(world.tick, being.id, `[SOC-ENC] ${enc.join('/')}`, payload);
  } else {
    recorder.evolution(world.tick, being.id, `[SOC-ENC]`, payload);
  }

  return { encode: enc, logged: true };
}

export function socialKnowledgeSnapshot(being) {
  return {
    encode: being.socEncode ?? [0, 0, 0],
    trace: being.socTrace,
    via: being.socTraceVia,
    socEncRx: being.socEncRx ?? 0,
    socEncCross: being.socEncCross ?? 0,
    linCount: being.socLinCount ?? 0,
    logCount: being.socLogCount ?? 0,
  };
}
