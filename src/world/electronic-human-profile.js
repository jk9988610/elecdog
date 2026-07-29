// 电子人层 — 自我连续性与叙事可观察性（OUTLINE Phase 4 kickoff，非预制人格）

import { beingLayerTransitions } from './profile-stack.js';

export const EHU_STAGES = ['H0', 'H1', 'H2', 'H3'];

const STAGE_LABELS = {
  H0: '初态',
  H1: '可追踪',
  H2: '整合',
  H3: '叙事',
};

export function electronicHumanEnabled(profile) {
  return profile?.electronicHumanEnabled === true;
}

export function electronicHumanFeedbackEnabled(profile) {
  return electronicHumanEnabled(profile) && profile.electronicHumanFeedback !== false;
}

export function ehuLineageEchoEnabled(profile) {
  return electronicHumanEnabled(profile) && profile.ehuLineageEchoEnabled === true;
}

export function ehuSocialDeepEnabled(profile) {
  return electronicHumanEnabled(profile) && profile.ehuSocialDeepEnabled === true;
}

export function ehuRenewTraceEnabled(profile) {
  return electronicHumanEnabled(profile) && profile.ehuRenewTraceEnabled !== false;
}

export function initElectronicHuman(being) {
  being.ehuStage = 'H0';
  being.ehuStageAt = 0;
  being.ehuTransitions = 0;
  being.ehuCoherence = 0.5;
  being.ehuDistinction = 0;
  being.ehuSocialBind = 0;
  being.ehuParentStage = null;
  being.ehuEchoCoherence = null;
  being.ehuLineageEcho = false;
  being.ehuRenCount = 0;
  being.ehuPrevRegisters = being.registers ? [...being.registers] : [];
}

export function electronicHumanStageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage;
}

export function accumulateElectronicHuman(being, ctx, profile = {}) {
  const prev = being.ehuPrevRegisters ?? being.registers;
  const regs = being.registers ?? [];
  if (prev.length === regs.length && regs.length) {
    let drift = 0;
    for (let i = 0; i < regs.length; i++) {
      drift += Math.abs(regs[i] - prev[i]);
    }
    const stability = Math.max(0, 1 - drift / regs.length);
    being.ehuCoherence = (being.ehuCoherence ?? 0.5) * 0.92 + stability * 0.08;
  }
  being.ehuPrevRegisters = [...regs];

  const selfAct = (ctx.hadTx ? 0.5 : 0) + (ctx.hadAct ? 0.5 : 0);
  const social = Math.min(1, (ctx.crossRx ?? 0) * 0.04);
  const socialWeight = ehuSocialDeepEnabled(profile) ? 0.022 : 0.015;
  const bindWeight = ehuSocialDeepEnabled(profile) ? 0.05 : 0;

  if (selfAct > 0) {
    being.ehuDistinction = Math.min(1, (being.ehuDistinction ?? 0) + selfAct * 0.03);
  }
  if (social > 0) {
    being.ehuDistinction = Math.max(0, (being.ehuDistinction ?? 0) - social * socialWeight);
  }
  if (bindWeight > 0 && ctx.crossRx > 0 && ctx.hadTx) {
    being.ehuSocialBind = Math.min(1, (being.ehuSocialBind ?? 0) + bindWeight);
  }
}

export function electronicHumanArc(being) {
  return beingLayerTransitions(being) + (being.rprTransitions ?? 0);
}

export function resolveElectronicHumanStage(being, profile) {
  const ticks = being.tickCount ?? 0;
  const juvenile = profile.ehuJuvenileTicks ?? 64;
  const arc = electronicHumanArc(being);
  const coherence = being.ehuCoherence ?? 0.5;
  const distinction = being.ehuDistinction ?? 0;
  const arcNarrative = profile.ehuArcNarrative ?? 18;

  if (ticks < juvenile || arc < 2) return 'H0';
  if (coherence < 0.32) return 'H1';
  if (arc < 10) return 'H2';
  const bindNeed = ehuSocialDeepEnabled(profile) ? 0.12 : 0;
  const bindOk = (being.ehuSocialBind ?? 0) >= bindNeed;
  if (distinction >= 0.22 && arc >= arcNarrative && bindOk) return 'H3';
  if (ehuSocialDeepEnabled(profile) && distinction >= 0.18 && arc >= arcNarrative - 2 && bindOk) {
    return 'H3';
  }
  return 'H2';
}

export function electronicHumanActBias(being, profile) {
  if (!electronicHumanFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, stage: being.ehuStage ?? 'H0' };
  }
  const stage = being.ehuStage ?? 'H0';
  switch (stage) {
    case 'H0':
      return { actBoost: -0.04, thresholdDelta: 0.05, stage };
    case 'H1':
      return { actBoost: 0.02, thresholdDelta: -0.02, stage };
    case 'H2':
      return { actBoost: 0.08, thresholdDelta: -0.04, stage };
    case 'H3':
      return { actBoost: 0.12, thresholdDelta: -0.06, stage };
    default:
      return { actBoost: 0, thresholdDelta: 0, stage };
  }
}

export function processElectronicHumanTick(
  world,
  recorder,
  being,
  profile,
  ctx,
  { fieldStat = false } = {}
) {
  if (!electronicHumanEnabled(profile)) return null;

  accumulateElectronicHuman(being, ctx, profile);
  const next = resolveElectronicHumanStage(being, profile);
  const prev = being.ehuStage ?? 'H0';
  if (next === prev) {
    return { stage: next, changed: false };
  }

  being.ehuStage = next;
  being.ehuStageAt = world.tick;
  being.ehuTransitions = (being.ehuTransitions ?? 0) + 1;

  const payload = {
    kind: 'EHU',
    phase: 'stage',
    from: prev,
    to: next,
    tickCount: being.tickCount,
    arc: electronicHumanArc(being),
    coherence: +(being.ehuCoherence ?? 0).toFixed(4),
    distinction: +(being.ehuDistinction ?? 0).toFixed(4),
  };

  if (!fieldStat) {
    recorder.evolution(
      world.tick,
      being.id,
      `[EHU] ${prev}→${next} arc ${payload.arc} coh ${payload.coherence}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[EHU] ${prev}→${next}`, payload);
  }

  return { stage: next, changed: true, from: prev };
}

export function applyEhuLineageEcho(world, recorder, child, parents, profile) {
  if (!ehuLineageEchoEnabled(profile)) return null;
  const list = parents.filter(Boolean);
  if (!list.length) return null;

  const stages = list.map((p) => p.ehuStage ?? 'H0');
  const coherences = list.map((p) => p.ehuCoherence ?? 0.5);
  child.ehuParentStage = stages.join('+');
  child.ehuEchoCoherence = +(coherences.reduce((a, b) => a + b, 0) / coherences.length).toFixed(3);
  child.ehuLineageEcho = true;

  const payload = {
    kind: 'EHU-LIN',
    parentStages: stages,
    echoCoherence: child.ehuEchoCoherence,
    parentIds: list.map((p) => p.id),
  };

  if (!profile.fieldStatMode) {
    recorder.evolution(
      world.tick,
      child.id,
      `[EHU-LIN] parent ${child.ehuParentStage} echo ${child.ehuEchoCoherence}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, child.id, `[EHU-LIN] echo`, payload);
  }

  return payload;
}

/** 续行 [REN]/[PLG] 与 EHU 阶段交叉迹 — 非情感/本能语义 */
export function applyEhuRenewalTrace(world, recorder, being, profile, { via = 'REN', added = 0 } = {}) {
  if (!ehuRenewTraceEnabled(profile)) return null;

  being.ehuRenCount = (being.ehuRenCount ?? 0) + 1;
  const stage = being.ehuStage ?? 'H0';
  const coherence = +(being.ehuCoherence ?? 0).toFixed(4);
  const payload = {
    kind: 'EHU-REN',
    via,
    stage,
    coherence,
    added,
    renCount: being.renCount ?? 0,
    plgCount: being.plgCount ?? 0,
  };

  if (!profile.fieldStatMode) {
    recorder.evolution(
      world.tick,
      being.id,
      `[EHU-REN] ${via} stage ${stage} coh ${coherence}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[EHU-REN] ${via}`, payload);
  }

  return payload;
}

export function electronicHumanSnapshot(being) {
  return {
    stage: being.ehuStage ?? 'H0',
    coherence: +(being.ehuCoherence ?? 0).toFixed(3),
    distinction: +(being.ehuDistinction ?? 0).toFixed(3),
    socialBind: +(being.ehuSocialBind ?? 0).toFixed(3),
    arc: electronicHumanArc(being),
    transitions: being.ehuTransitions ?? 0,
    parentStage: being.ehuParentStage ?? null,
    echoCoherence: being.ehuEchoCoherence ?? null,
    lineageEcho: Boolean(being.ehuLineageEcho),
    renewTrace: being.ehuRenCount ?? 0,
  };
}
