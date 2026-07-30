// 社会合作层 — 社会迹聚合与行为反馈（非角色名/联盟语义）

export const COOP_MODES = ['S0', 'SOLO', 'MESH', 'RIVAL', 'ECHO'];

const MODE_LABELS = {
  S0: '初态',
  SOLO: '孤立',
  MESH: '交叉接收',
  RIVAL: '争夺',
  ECHO: '广播',
};

export function cooperationProfileEnabled(profile) {
  return profile?.cooperationProfileEnabled === true;
}

export function cooperationFeedbackEnabled(profile) {
  return cooperationProfileEnabled(profile) && profile.cooperationFeedback !== false;
}

export function initCooperationProfile(being) {
  being.coopMode = 'S0';
  being.coopModeAt = 0;
  being.coopTransitions = 0;
  being.socRx = 0;
  being.socCrossRx = 0;
  being.socTx = 0;
  being.socAct = 0;
  being.socContest = 0;
}

export function cooperationModeLabel(mode) {
  return MODE_LABELS[mode] ?? mode;
}

export function accumulateCooperation(
  being,
  { hadRx = false, crossRx = 0, hadTx = false, hadAct = false, hadContest = false } = {}
) {
  if (hadRx) {
    being.socRx = (being.socRx ?? 0) + 1;
    being.socCrossRx = (being.socCrossRx ?? 0) + crossRx;
  }
  if (hadTx) being.socTx = (being.socTx ?? 0) + 1;
  if (hadAct) being.socAct = (being.socAct ?? 0) + 1;
  if (hadContest) being.socContest = (being.socContest ?? 0) + 1;
}

export function resolveCooperationMode(being) {
  const total =
    (being.socRx ?? 0) + (being.socTx ?? 0) + (being.socAct ?? 0) + (being.socContest ?? 0);
  if (total < 20) return 'S0';

  const crossShare = (being.socRx ?? 0) > 0 ? (being.socCrossRx ?? 0) / being.socRx : 0;
  const contestRate = total > 0 ? (being.socContest ?? 0) / total : 0;
  const txRate = total > 0 ? (being.socTx ?? 0) / total : 0;

  if (contestRate > 0.12) return 'RIVAL';
  if (crossShare > 0.45) return 'MESH';
  if (txRate > 0.42 && (being.socAct ?? 0) < (being.socTx ?? 0)) return 'ECHO';
  if ((being.socRx ?? 0) < total * 0.15 && contestRate < 0.05) return 'SOLO';
  return 'MESH';
}

export function cooperationActBias(being, profile) {
  if (!cooperationFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, mode: being.coopMode ?? 'S0' };
  }
  const mode = being.coopMode ?? 'S0';
  switch (mode) {
    case 'SOLO':
      return { actBoost: -0.08, thresholdDelta: 0.05, mode };
    case 'MESH':
      return { actBoost: 0.05, thresholdDelta: -0.03, mode };
    case 'RIVAL':
      return { actBoost: 0.1, thresholdDelta: -0.02, mode };
    case 'ECHO':
      return { actBoost: -0.02, thresholdDelta: -0.04, mode };
    default:
      return { actBoost: 0, thresholdDelta: 0, mode };
  }
}

export function mergeActBias(...biases) {
  let actBoost = 0;
  let thresholdDelta = 0;
  let txBoost = 0;
  let txPayloadHint = null;
  let semLoad = 0;
  for (const b of biases) {
    if (!b) continue;
    actBoost += b.actBoost ?? 0;
    thresholdDelta += b.thresholdDelta ?? 0;
    txBoost += b.txBoost ?? 0;
    const load = b.semLoad ?? 0;
    if (load >= semLoad && b.txPayloadHint) {
      semLoad = load;
      txPayloadHint = b.txPayloadHint;
    }
  }
  return { actBoost, thresholdDelta, txBoost, txPayloadHint, semLoad };
}

export function processCooperationTick(
  world,
  recorder,
  being,
  profile,
  ctx,
  { fieldStat = false } = {}
) {
  if (!cooperationProfileEnabled(profile)) return null;

  accumulateCooperation(being, ctx);
  const next = resolveCooperationMode(being);
  const prev = being.coopMode ?? 'S0';
  if (next === prev) {
    return { mode: next, changed: false };
  }

  being.coopMode = next;
  being.coopModeAt = world.tick;
  being.coopTransitions = (being.coopTransitions ?? 0) + 1;

  const total =
    (being.socRx ?? 0) + (being.socTx ?? 0) + (being.socAct ?? 0) + (being.socContest ?? 0);
  const payload = {
    kind: 'COOP',
    phase: 'mode',
    from: prev,
    to: next,
    slot: being.socialSlot,
    socTotal: total,
    crossRx: being.socCrossRx ?? 0,
    contest: being.socContest ?? 0,
  };

  if (!fieldStat) {
    recorder.social(
      world.tick,
      being.id,
      `[COOP] ${prev}→${next} ${being.socialSlot} cross ${payload.crossRx}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, being.id, `[COOP] ${prev}→${next}`, payload);
  }

  return { mode: next, changed: true, from: prev };
}

export function cooperationSnapshot(being) {
  const total =
    (being.socRx ?? 0) + (being.socTx ?? 0) + (being.socAct ?? 0) + (being.socContest ?? 0);
  return {
    mode: being.coopMode ?? 'S0',
    slot: being.socialSlot,
    socRx: being.socRx ?? 0,
    socCrossRx: being.socCrossRx ?? 0,
    socTx: being.socTx ?? 0,
    socAct: being.socAct ?? 0,
    socContest: being.socContest ?? 0,
    socTotal: total,
    transitions: being.coopTransitions ?? 0,
  };
}
