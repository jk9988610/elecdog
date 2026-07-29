/**
 * 田野 / 观察台环境配置 — Phase 34–36
 */

import { juvenileDrawMultiplier as nurtureJuvenileDraw } from './nurture.js';

export const ENV_PROFILES = {
  baseline: {
    id: 'baseline',
    label: '基线（现行规则）',
  },
  high_shk: {
    id: 'high_shk',
    label: '高频剧变',
    pulseInterval: 50,
  },
  juvenile_fragile: {
    id: 'juvenile_fragile',
    label: '幼体脆弱窗',
    juvenileTicks: 80,
    juvenileDrawMult: 0.45,
    juvenileMinGen: 1,
  },
  sparse_substrate: {
    id: 'sparse_substrate',
    label: '基底耗竭',
    substrateDrainMult: 1.35,
  },
  harsh_combined: {
    id: 'harsh_combined',
    label: '组合高压',
    pulseInterval: 50,
    juvenileTicks: 80,
    juvenileDrawMult: 0.45,
    juvenileMinGen: 1,
    substrateDrainMult: 1.25,
  },
  /** Phase 36 — 富足基底 + 存活分裂门控 */
  fertile_field: {
    id: 'fertile_field',
    label: '富足分裂场',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
  },
  fertile_field_open: {
    id: 'fertile_field_open',
    label: '富足分裂场（无复制上限）',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: false,
  },
  fertile_field_strict: {
    id: 'fertile_field_strict',
    label: '富足场+复制耗尽终止',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: true,
    rplTickCapEnabled: true,
    rplTickCapBase: 220,
    rplTickCapSpread: 180,
  },
  fertile_inert: {
    id: 'fertile_inert',
    label: '富足无分裂门',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
  },
  fertile_multicell_rpl: {
    id: 'fertile_multicell_rpl',
    label: '富足多子域+复制配额',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    organismMode: 'multicell',
    rplScope: 'organism',
  },
  fertile_renew_plg: {
    id: 'fertile_renew_plg',
    label: '富足+RPL续行+双体汇合',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
  },
  fertile_multicell_renew_plg: {
    id: 'fertile_multicell_renew_plg',
    label: '富足多子域+子域RPL+续行汇合',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
  },
};

const REN_BASE = {
  rplRenewEnabled: true,
  rplRenewGrant: 1,
  rplRenewCooldown: 64,
  rplRenewBaseProb: 0.5,
  rplRenewAtOrBelow: 0,
  rplRenewMaxStress: 0.24,
  rplRenewMinSubstrate: 0.46,
};

const PLG_BASE = {
  plgEnabled: true,
  plgRenewGrant: 1,
  plgPairCooldown: 100,
  plgExhaustedAt: 0,
};

/** Phase 40 — 多细胞 × RPL 续行 */
export const PHASE40_TREATMENTS = {
  multicell_org_ren: {
    id: 'multicell_org_ren',
    label: '多细胞+共享RPL+[REN]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
    ...REN_BASE,
  },
  multicell_org_ren_plg: {
    id: 'multicell_org_ren_plg',
    label: '多细胞+共享RPL+[REN]+[PLG]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
    ...REN_BASE,
    ...PLG_BASE,
  },
  multicell_sub_ren: {
    id: 'multicell_sub_ren',
    label: '多细胞+子域RPL+[REN]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    ...REN_BASE,
  },
  multicell_sub_ren_plg: {
    id: 'multicell_sub_ren_plg',
    label: '多细胞+子域RPL+[REN]+[PLG]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    ...REN_BASE,
    ...PLG_BASE,
  },
};

/** Phase 39 — [REN] 环境重置 / [PLG] 双体通量汇合 */
export const PHASE39_TREATMENTS = {
  fertile_rpl: {
    id: 'fertile_rpl',
    label: '富足+RPL（无续行）',
    envId: 'fertile_field',
  },
  fertile_ren: {
    id: 'fertile_ren',
    label: '富足+RPL+[REN]',
    envId: 'fertile_field',
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    rplRenewAtOrBelow: 0,
    rplRenewMaxStress: 0.24,
    rplRenewMinSubstrate: 0.46,
  },
  fertile_ren_plg: {
    id: 'fertile_ren_plg',
    label: '富足+RPL+[REN]+[PLG]',
    envId: 'fertile_field',
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    rplRenewAtOrBelow: 0,
    rplRenewMaxStress: 0.24,
    rplRenewMinSubstrate: 0.46,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
    plgExhaustedAt: 0,
  },
};

/** Phase 38 — 多细胞 × RPL 共享 vs 子域分摊 */
export const PHASE38_TREATMENTS = {
  unicell_rpl: {
    id: 'unicell_rpl',
    label: '单域+复制配额',
    envId: 'fertile_field',
    organismMode: 'unicell',
    rplScope: 'organism',
  },
  multicell_rpl: {
    id: 'multicell_rpl',
    label: '多子域+有机体共享RPL',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
  },
  multicell_subrpl: {
    id: 'multicell_subrpl',
    label: '多子域+子域分摊RPL',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
  },
};

/** Phase 35 田野处理组（固定 harsh_combined 基底） */
export const PHASE35_TREATMENTS = {
  unicell_instant: {
    id: 'unicell_instant',
    label: '单域即时独立',
    envId: 'harsh_combined',
    organismMode: 'unicell',
    reproMode: 'instant',
  },
  unicell_nursed: {
    id: 'unicell_nursed',
    label: '单域延迟独立+通量',
    envId: 'harsh_combined',
    organismMode: 'unicell',
    reproMode: 'nursed',
    nurtureTicks: 80,
    nurtureSeedFrac: 0.35,
    nurtureTickGrant: 0.012,
    dependentDrawMult: 0.55,
    independenceTicks: 80,
  },
  multicell_instant: {
    id: 'multicell_instant',
    label: '多子域即时独立',
    envId: 'harsh_combined',
    organismMode: 'multicell',
    reproMode: 'instant',
  },
  multicell_nursed: {
    id: 'multicell_nursed',
    label: '多子域延迟独立+通量',
    envId: 'harsh_combined',
    organismMode: 'multicell',
    reproMode: 'nursed',
    nurtureTicks: 80,
    nurtureSeedFrac: 0.35,
    nurtureTickGrant: 0.012,
    dependentDrawMult: 0.55,
    independenceTicks: 80,
  },
};

export function applyEnvProfile(world, profileId) {
  const profile = ENV_PROFILES[profileId] ?? ENV_PROFILES.baseline;
  world.envProfile = { ...profile };
  if (profile.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = profile.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, profile.pulseInterval);
  }
  return profile;
}

export function applyFieldTreatment(world, treatmentId) {
  const treatment = PHASE35_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知田野处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 35, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase38Treatment(world, treatmentId) {
  const treatment = PHASE38_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase38 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 38, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase40Treatment(world, treatmentId) {
  const treatment = PHASE40_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase40 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 40, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase39Treatment(world, treatmentId) {
  const treatment = PHASE39_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase39 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 39, treatmentId, ...treatment };
  return world.envProfile;
}

export function juvenileDrawMultiplier(being, profile) {
  return nurtureJuvenileDraw(being, profile);
}
