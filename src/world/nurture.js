// 谱系幼体依赖期 — 亲代通量种子 + 延迟独立（不设哺乳/性别名称）

import { multicellV2Enabled } from './multicell-v2.js';
import { initNursingStructures } from './body-structures.js';

export function reproModeFromProfile(profile) {
  if (profile?.reproMode === 'nursed' || profile?.reproMode === 'gestation') return 'nursed';
  return profile?.reproMode === 'instant' ? 'instant' : 'instant';
}

export function applyNurtureAtBirth(world, parent, child) {
  const profile = world.envProfile ?? {};
  if (reproModeFromProfile(profile) !== 'nursed') {
    child.independent = true;
    child.nurtureReserve = null;
    child.nurtureUntilTick = null;
    return { mode: 'instant' };
  }

  const seedFrac = profile.nurtureSeedFrac ?? 0.35;
  const nurtureTicks = profile.nurtureTicks ?? profile.juvenileTicks ?? 80;
  child.independent = false;
  child.nurtureUntilTick = world.tick + nurtureTicks;
  child.nurtureReserve = parent.registers.map((r) => r * seedFrac);
  child.nurtureParentId = parent.id;
  if (multicellV2Enabled(profile)) {
    initNursingStructures(parent, child, profile, world.tick);
  }
  return {
    mode: 'nursed',
    nurtureTicks,
    seedFrac,
    reserveSum: +child.nurtureReserve.reduce((a, b) => a + b, 0).toFixed(4),
  };
}

export function tickNurture(world, being) {
  if (being.independent !== false) return null;

  const profile = world.envProfile ?? {};
  const reserve = being.nurtureReserve;
  if (!reserve?.length) {
    being.independent = true;
    return null;
  }

  const tickGrant = profile.nurtureTickGrant ?? 0.012;
  const transfers = [];
  for (let i = 0; i < reserve.length; i++) {
    const grant = Math.min(reserve[i], tickGrant);
    if (grant <= 0.0001) continue;
    reserve[i] -= grant;
    being.registers[i] = Math.max(0, Math.min(1, being.registers[i] + grant * 0.5));
    transfers.push({ idx: i, amount: grant });
  }

  const reserveLeft = reserve.reduce((a, b) => a + b, 0);
  const independenceTicks = profile.independenceTicks ?? profile.nurtureTicks ?? 80;
  const membraneReady =
    being.tickCount >= independenceTicks ||
    world.tick >= (being.nurtureUntilTick ?? 0) ||
    reserveLeft < 0.02;

  if (membraneReady) {
    being.independent = true;
    being.nurtureReserve = null;
  }

  if (!transfers.length && !membraneReady) return null;

  return {
    transfers,
    reserveLeft: +reserveLeft.toFixed(4),
    becameIndependent: membraneReady,
    parentId: being.nurtureParentId ?? null,
  };
}

export function juvenileDrawMultiplier(being, profile) {
  if (!profile?.juvenileDrawMult || being.generation < (profile.juvenileMinGen ?? 1)) {
    return 1;
  }
  if (being.independent === false) {
    return profile.dependentDrawMult ?? 0.55;
  }
  if (being.tickCount <= (profile.juvenileTicks ?? 0)) {
    return profile.juvenileDrawMult;
  }
  return 1;
}
