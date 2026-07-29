/**
 * 田野环境配置 — Phase 34–35 选择压 / 繁殖 / 个体形态
 * 仅用于 field-batch；观察台默认不启用
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

export function juvenileDrawMultiplier(being, profile) {
  return nurtureJuvenileDraw(being, profile);
}
