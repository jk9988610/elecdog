// 代谢通道层 — 摄取分布追踪与可选反馈（非资源类型命名）

export const MTB_PROFILES = ['N0', 'DOM', 'BAL', 'SCAR'];

const PROFILE_LABELS = {
  N0: '初采',
  DOM: '单通道主导',
  BAL: '多通道均衡',
  SCAR: '匮乏型',
};

export function metabolicProfileEnabled(profile) {
  return profile?.metabolicProfileEnabled === true;
}

export function metabolicFeedbackEnabled(profile) {
  return metabolicProfileEnabled(profile) && profile.metabolicFeedback !== false;
}

export function initMetabolicProfile(being) {
  being.metDrawByChannel = Array(8).fill(0);
  being.metLowByChannel = Array(8).fill(0);
  being.metProfile = 'N0';
  being.metProfileAt = 0;
  being.metTransitions = 0;
  being.metDrawTotal = 0;
  being.metDominantIdx = 0;
}

export function metabolicProfileLabel(profile) {
  return PROFILE_LABELS[profile] ?? profile;
}

export function accumulateMetabolicDraw(being, { idx, amount = 0, hadLow = false, lowIdx = null } = {}) {
  if (idx == null || idx < 0) return;
  being.metDrawByChannel[idx] = (being.metDrawByChannel[idx] ?? 0) + amount;
  being.metDrawTotal = (being.metDrawTotal ?? 0) + 1;
  if (hadLow && lowIdx != null) {
    being.metLowByChannel[lowIdx] = (being.metLowByChannel[lowIdx] ?? 0) + 1;
  }
}

export function resolveMetabolicProfile(being) {
  const total = being.metDrawTotal ?? 0;
  if (total < 20) return 'N0';

  const draws = being.metDrawByChannel ?? [];
  const sum = draws.reduce((a, b) => a + b, 0) || 1;
  let domIdx = 0;
  let domShare = 0;
  for (let i = 0; i < draws.length; i++) {
    const share = draws[i] / sum;
    if (share > domShare) {
      domShare = share;
      domIdx = i;
    }
  }
  being.metDominantIdx = domIdx;

  const lowTotal = (being.metLowByChannel ?? []).reduce((a, b) => a + b, 0);
  const lowRate = lowTotal / Math.max(1, total);
  if (lowRate > 0.08) return 'SCAR';
  if (domShare > 0.5) return 'DOM';
  if (domShare < 0.35) return 'BAL';
  return 'DOM';
}

/** 代谢档案 → 摄取倍率微调（物理量，非资源标签） */
export function metabolicDrawMultAdjust(being, profile) {
  if (!metabolicFeedbackEnabled(profile)) return 0;
  switch (being.metProfile ?? 'N0') {
    case 'DOM':
      return 0.06;
    case 'BAL':
      return 0;
    case 'SCAR':
      return -0.1;
    default:
      return 0;
  }
}

export function processMetabolicProfileTick(
  world,
  recorder,
  being,
  profile,
  ctx,
  { fieldStat = false } = {}
) {
  if (!metabolicProfileEnabled(profile)) return null;
  if (ctx.idx == null) return null;

  accumulateMetabolicDraw(being, ctx);
  const next = resolveMetabolicProfile(being);
  const prev = being.metProfile ?? 'N0';
  if (next === prev) {
    return { profile: next, changed: false };
  }

  being.metProfile = next;
  being.metProfileAt = world.tick;
  being.metTransitions = (being.metTransitions ?? 0) + 1;

  const payload = {
    kind: 'MTB',
    phase: 'profile',
    from: prev,
    to: next,
    domIdx: being.metDominantIdx,
    drawTotal: being.metDrawTotal,
    lowTotal: (being.metLowByChannel ?? []).reduce((a, b) => a + b, 0),
  };

  if (!fieldStat) {
    recorder.metabolism(
      world.tick,
      being.id,
      `[MTB] ${prev}→${next} dom e${payload.domIdx} draws ${payload.drawTotal}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[MTB] ${prev}→${next}`, payload);
  }

  return { profile: next, changed: true, from: prev };
}

export function metabolicSnapshot(being) {
  const draws = being.metDrawByChannel ?? Array(8).fill(0);
  const sum = draws.reduce((a, b) => a + b, 0) || 1;
  return {
    profile: being.metProfile ?? 'N0',
    domIdx: being.metDominantIdx ?? 0,
    domShare: +(draws[being.metDominantIdx ?? 0] / sum).toFixed(3),
    drawTotal: being.metDrawTotal ?? 0,
    lowTotal: (being.metLowByChannel ?? []).reduce((a, b) => a + b, 0),
    transitions: being.metTransitions ?? 0,
    channelShares: draws.map((d) => +(d / sum).toFixed(3)),
  };
}
