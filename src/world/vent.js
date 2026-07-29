// GAP-ENV Phase 93 — [VTN] 地热 vent：标记 patch 局部 floor/boost 微源

import { patchNeighbors } from './adv.js';

export function ventEnabled(profile) {
  return profile?.ventEnabled === true;
}

export function ventActiveAt(world, profile) {
  if (!ventEnabled(profile)) return false;
  const patch = world.place?.patch ?? profile.placePatch ?? '00';
  const ventPatch = profile.ventPatch ?? patch;
  if (patch === ventPatch) return true;
  if (profile.ventNeighborReach) {
    return patchNeighbors(ventPatch).includes(patch);
  }
  return false;
}

export function initVentState(world, profile) {
  world.vent = {
    injectTotal: 0,
    ticks: 0,
    activeTicks: 0,
  };
  world.ventMods = { boostMult: 1, floorAdd: 0 };
}

/** vent patch 每 tick 向基底注入微源（与 SHK 独立） */
export function tickVent(world, profile) {
  if (!ventActiveAt(world, profile)) {
    world.ventMods = { boostMult: 1, floorAdd: 0 };
    return null;
  }

  const amp = profile.ventInjectAmp ?? 0.019;
  const ch = world.substrate?.channels;
  if (!ch) return null;

  const targets = profile.ventChannels ?? [0, 2, 4, 6];
  let inject = 0;
  const transfers = [];
  for (const idx of targets) {
    const before = ch[idx];
    const delta = amp * (1 - before);
    ch[idx] = Math.min(1, before + delta);
    inject += delta;
    transfers.push({ idx, delta: +delta.toFixed(5), before, after: ch[idx] });
  }

  const boostMult = profile.ventBoostMult ?? 1.08;
  const floorAdd = profile.ventFloorAdd ?? 0.012;
  world.ventMods = { boostMult, floorAdd };
  world.vent.injectTotal = (world.vent.injectTotal ?? 0) + inject;
  world.vent.ticks = (world.vent.ticks ?? 0) + 1;
  world.vent.activeTicks = (world.vent.activeTicks ?? 0) + 1;

  return {
    fired: true,
    inject: +inject.toFixed(5),
    boostMult,
    floorAdd,
    patch: world.place?.patch ?? '00',
    transfers,
  };
}
