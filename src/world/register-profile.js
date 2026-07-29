// 寄存器语义层 — 数值模式追踪与场耦合反馈（非感受映射）

export const REG_MODES = ['SYNC', 'LAG', 'SCATTER', 'LOCK'];

const MODE_LABELS = {
  SYNC: '同步',
  LAG: '滞后',
  SCATTER: '离散',
  LOCK: '锁定',
};

export function registerProfileEnabled(profile) {
  return profile?.registerProfileEnabled === true;
}

export function registerFeedbackEnabled(profile) {
  return registerProfileEnabled(profile) && profile.registerFeedback !== false;
}

export function initRegisterProfile(being) {
  being.regMode = 'SYNC';
  being.regModeAt = 0;
  being.regTransitions = 0;
  being.regPrevRegisters = [...being.registers];
  being.regGapMean = 0;
  being.regDriftVel = 0;
  being.regVariance = 0;
  being.regDomReg = 0;
  being.regDomSub = 0;
}

export function registerModeLabel(mode) {
  return MODE_LABELS[mode] ?? mode;
}

export function computeRegisterMetrics(being, substrate) {
  const regs = being.registers;
  const prev = being.regPrevRegisters ?? regs;
  const n = regs.length;
  let gapSum = 0;
  let driftSum = 0;
  for (let i = 0; i < n; i++) {
    const sub = substrate?.[i] ?? regs[i];
    gapSum += Math.abs(regs[i] - sub);
    driftSum += Math.abs(regs[i] - prev[i]);
  }
  const gapMean = gapSum / n;
  const driftVel = driftSum / n;
  const mean = regs.reduce((a, b) => a + b, 0) / n;
  const variance = regs.reduce((s, r) => s + (r - mean) ** 2, 0) / n;
  let domReg = 0;
  let domSub = 0;
  for (let i = 1; i < n; i++) {
    if (regs[i] > regs[domReg]) domReg = i;
    if (substrate && substrate[i] > substrate[domSub]) domSub = i;
  }
  return { gapMean, driftVel, variance, domReg, domSub };
}

export function resolveRegisterMode(metrics) {
  if (metrics.variance > 0.042) return 'SCATTER';
  if (metrics.driftVel < 0.0035 && metrics.gapMean < 0.14) return 'LOCK';
  if (metrics.gapMean > 0.22) return 'LAG';
  if (metrics.domReg === metrics.domSub) return 'SYNC';
  return 'SYNC';
}

/** 模式 → 基底耦合微调（物理量，非感受标签） */
export function registerCouplingAdjust(being, profile) {
  if (!registerFeedbackEnabled(profile)) return 0;
  switch (being.regMode ?? 'SYNC') {
    case 'SYNC':
      return 0.006;
    case 'LAG':
      return 0.01;
    case 'SCATTER':
      return -0.005;
    case 'LOCK':
      return -0.004;
    default:
      return 0;
  }
}

export function effectiveCoupling(profile, being) {
  const base = profile?.registerCouplingBase ?? 0.02;
  return Math.max(0.005, Math.min(0.04, base + registerCouplingAdjust(being, profile)));
}

export function processRegisterTick(
  world,
  recorder,
  being,
  profile,
  substrate,
  { fieldStat = false } = {}
) {
  if (!registerProfileEnabled(profile)) return null;

  const metrics = computeRegisterMetrics(being, substrate);
  being.regGapMean = metrics.gapMean;
  being.regDriftVel = metrics.driftVel;
  being.regVariance = metrics.variance;
  being.regDomReg = metrics.domReg;
  being.regDomSub = metrics.domSub;

  const next = resolveRegisterMode(metrics);
  const prev = being.regMode ?? 'SYNC';
  being.regPrevRegisters = [...being.registers];

  if (next === prev) {
    return { mode: next, changed: false, ...metrics };
  }

  being.regMode = next;
  being.regModeAt = world.tick;
  being.regTransitions = (being.regTransitions ?? 0) + 1;

  const payload = {
    kind: 'REG',
    phase: 'mode',
    from: prev,
    to: next,
    gapMean: +metrics.gapMean.toFixed(4),
    driftVel: +metrics.driftVel.toFixed(4),
    variance: +metrics.variance.toFixed(4),
    domReg: metrics.domReg,
    domSub: metrics.domSub,
    coupling: registerFeedbackEnabled(profile)
      ? +effectiveCoupling(profile, being).toFixed(4)
      : null,
  };

  if (!fieldStat) {
    recorder.register(
      world.tick,
      being.id,
      `[REG] ${prev}→${next} gap ${payload.gapMean} drift ${payload.driftVel}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[REG] ${prev}→${next}`, payload);
  }

  return { mode: next, changed: true, from: prev, ...metrics };
}

export function registerSnapshot(being) {
  return {
    mode: being.regMode ?? 'SYNC',
    gapMean: +(being.regGapMean ?? 0).toFixed(3),
    driftVel: +(being.regDriftVel ?? 0).toFixed(4),
    variance: +(being.regVariance ?? 0).toFixed(4),
    domReg: being.regDomReg ?? 0,
    domSub: being.regDomSub ?? 0,
    transitions: being.regTransitions ?? 0,
  };
}
