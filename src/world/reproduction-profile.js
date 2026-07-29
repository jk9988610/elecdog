// 繁殖路径层 — LINEAGE / FISS / RCM 起源与活动追踪（GAP-14）

export const RPR_MODES = ['R0', 'SEED_DOM', 'LIN_DOM', 'FIS_DOM', 'RCM_DOM', 'MULTI'];

const MODE_LABELS = {
  R0: '初态',
  SEED_DOM: '种子代',
  LIN_DOM: '谱系路径',
  FIS_DOM: '分裂路径',
  RCM_DOM: '重组路径',
  MULTI: '多路径',
};

export function reproductionProfileEnabled(profile) {
  return profile?.reproductionProfileEnabled === true;
}

export function reproductionFeedbackEnabled(profile) {
  return reproductionProfileEnabled(profile) && profile.reproductionFeedback !== false;
}

export function classifyBirthOrigin(being) {
  if (being.fusParentA || being.recombined) return 'RCM';
  if (being.fissionParent) return 'FIS';
  if (being.lineageParent) return 'LIN';
  return 'SEED';
}

export function initReproductionProfile(being) {
  being.rprOrigin = classifyBirthOrigin(being);
  being.rprMode = 'R0';
  being.rprModeAt = 0;
  being.rprTransitions = 0;
  being.rprFissAsParent = 0;
  being.rprLineageAsParent = 0;
}

export function reproductionModeLabel(mode) {
  return MODE_LABELS[mode] ?? mode;
}

export function recordReproductionPathEvent(being, kind) {
  if (kind === 'FISS_PARENT') {
    being.rprFissAsParent = (being.rprFissAsParent ?? 0) + 1;
  }
  if (kind === 'LINEAGE_PARENT') {
    being.rprLineageAsParent = (being.rprLineageAsParent ?? 0) + 1;
  }
}

export function resolveReproductionMode(being) {
  const ticks = being.tickCount ?? 0;
  if (ticks < 48) return 'R0';

  const origin = being.rprOrigin ?? classifyBirthOrigin(being);
  const fissP = being.rprFissAsParent ?? 0;
  const linP = being.rprLineageAsParent ?? 0;
  const meiP = being.meiCount ?? 0;
  const fusChild = being.fusParentA || being.recombined;

  const activePaths =
    (fissP > 0 ? 1 : 0) +
    (linP > 0 ? 1 : 0) +
    (meiP > 0 || fusChild ? 1 : 0) +
    (origin === 'RCM' ? 1 : 0);

  if (activePaths >= 2) return 'MULTI';
  if (origin === 'RCM' || fusChild) return 'RCM_DOM';
  if (origin === 'FIS' || fissP > 0) return 'FIS_DOM';
  if (origin === 'LIN' || linP > 0) return 'LIN_DOM';
  return 'SEED_DOM';
}

export function reproductionActBias(being, profile) {
  if (!reproductionFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, mode: being.rprMode ?? 'R0' };
  }
  const mode = being.rprMode ?? 'R0';
  switch (mode) {
    case 'FIS_DOM':
      return { actBoost: 0.06, thresholdDelta: -0.03, mode };
    case 'LIN_DOM':
      return { actBoost: -0.04, thresholdDelta: 0.04, mode };
    case 'RCM_DOM':
      return { actBoost: 0.02, thresholdDelta: 0, mode };
    case 'MULTI':
      return { actBoost: 0.04, thresholdDelta: -0.02, mode };
    default:
      return { actBoost: 0, thresholdDelta: 0, mode };
  }
}

export function processReproductionProfileTick(
  world,
  recorder,
  being,
  profile,
  { fieldStat = false } = {}
) {
  if (!reproductionProfileEnabled(profile)) return null;

  const next = resolveReproductionMode(being);
  const prev = being.rprMode ?? 'R0';
  if (next === prev) {
    return { mode: next, changed: false };
  }

  being.rprMode = next;
  being.rprModeAt = world.tick;
  being.rprTransitions = (being.rprTransitions ?? 0) + 1;

  const payload = {
    kind: 'RPR',
    phase: 'mode',
    from: prev,
    to: next,
    origin: being.rprOrigin,
    fissAsParent: being.rprFissAsParent ?? 0,
    lineageAsParent: being.rprLineageAsParent ?? 0,
    generation: being.generation,
  };

  if (!fieldStat) {
    recorder.evolution(
      world.tick,
      being.id,
      `[RPR] ${prev}→${next} origin ${payload.origin} gen ${payload.generation}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[RPR] ${prev}→${next}`, payload);
  }

  return { mode: next, changed: true, from: prev };
}

export function reproductionSnapshot(being) {
  return {
    mode: being.rprMode ?? 'R0',
    origin: being.rprOrigin ?? 'SEED',
    fissAsParent: being.rprFissAsParent ?? 0,
    lineageAsParent: being.rprLineageAsParent ?? 0,
    transitions: being.rprTransitions ?? 0,
  };
}
