// 阅历层 — 结构化经历积累与行为反馈（非地球式年龄）

export const EXP_STAGES = ['E0', 'E1', 'E2', 'E3'];

const STAGE_LABELS = {
  E0: '初态',
  E1: '积累',
  E2: '稳态',
  E3: '磨损',
};

export function experienceEnabled(profile) {
  return profile?.experienceEnabled === true;
}

export function experienceFeedbackEnabled(profile) {
  return experienceEnabled(profile) && profile.experienceFeedback !== false;
}

export function initExperience(being) {
  being.expStress = 0;
  being.expLow = 0;
  being.expSocial = 0;
  being.expAct = 0;
  being.expStage = 'E0';
  being.expStageAt = 0;
  being.expTransitions = 0;
}

export function experienceStageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage;
}

export function accumulateExperience(being, { stress = 0, hadLow = false, hadRx = false, hadTx = false, hadAct = false } = {}) {
  if (stress > 0.35) {
    being.expStress = Math.min(1, (being.expStress ?? 0) + 0.018);
  }
  if (hadLow) {
    being.expLow = Math.min(1, (being.expLow ?? 0) + 0.028);
  }
  if (hadRx || hadTx) {
    being.expSocial = Math.min(1, (being.expSocial ?? 0) + 0.012);
  }
  if (hadAct) {
    being.expAct = Math.min(1, (being.expAct ?? 0) + 0.02);
  }
}

export function resolveExperienceStage(being, profile) {
  const ticks = being.tickCount ?? 0;
  const load =
    (being.expStress ?? 0) + (being.expLow ?? 0) + (being.expSocial ?? 0) + (being.expAct ?? 0);
  const juvenile = profile.expJuvenileTicks ?? 48;
  if (ticks < juvenile) return 'E0';
  if (load < 0.22) return 'E1';
  if (load < 0.58) return 'E2';
  return 'E3';
}

/** 阅历阶段 → 对外行为偏置（可观察，非预制感受映射） */
export function experienceActBias(being, profile) {
  if (!experienceFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, stage: being.expStage ?? 'E0' };
  }
  const stage = being.expStage ?? 'E0';
  switch (stage) {
    case 'E0':
      return { actBoost: -0.1, thresholdDelta: 0.07, stage };
    case 'E1':
      return { actBoost: 0.05, thresholdDelta: -0.03, stage };
    case 'E2':
      return { actBoost: 0.1, thresholdDelta: -0.05, stage };
    case 'E3':
      return { actBoost: -0.06, thresholdDelta: 0.06, stage };
    default:
      return { actBoost: 0, thresholdDelta: 0, stage };
  }
}

export function processExperienceTick(
  world,
  recorder,
  being,
  profile,
  ctx,
  { fieldStat = false } = {}
) {
  if (!experienceEnabled(profile)) return null;

  accumulateExperience(being, ctx);
  const next = resolveExperienceStage(being, profile);
  const prev = being.expStage ?? 'E0';
  if (next === prev) {
    return { stage: next, changed: false };
  }

  being.expStage = next;
  being.expStageAt = world.tick;
  being.expTransitions = (being.expTransitions ?? 0) + 1;

  const payload = {
    kind: 'EXP',
    phase: 'stage',
    from: prev,
    to: next,
    tickCount: being.tickCount,
    expLoad: +(
      (being.expStress ?? 0) +
      (being.expLow ?? 0) +
      (being.expSocial ?? 0) +
      (being.expAct ?? 0)
    ).toFixed(4),
  };

  if (!fieldStat) {
    recorder.experience(
      world.tick,
      being.id,
      `[EXP] ${prev}→${next} t${being.tickCount} load ${payload.expLoad}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[EXP] ${prev}→${next}`, payload);
  }

  return { stage: next, changed: true, from: prev };
}

export function experienceSnapshot(being) {
  return {
    stage: being.expStage ?? 'E0',
    expStress: +(being.expStress ?? 0).toFixed(3),
    expLow: +(being.expLow ?? 0).toFixed(3),
    expSocial: +(being.expSocial ?? 0).toFixed(3),
    expAct: +(being.expAct ?? 0).toFixed(3),
    transitions: being.expTransitions ?? 0,
  };
}
