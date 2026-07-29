// GAP-ENV Phase 94 — [MIG] patch 迁徙：邻格移动 + alt 迁徙税

import { hashString } from '../core/hash.js';
import { patchNeighbors } from './adv.js';
import { formatBirthPlace, parseBirthPlace } from './place.js';

export function migEnabled(profile) {
  return profile?.migEnabled === true;
}

/** patch 高程标量 ∈ [0,1]（数字类比，非米） */
export function patchAlt(patch = '00') {
  const n = parseInt(patch, 10);
  const r = Math.floor(n / 10);
  const c = n % 10;
  return +((r + c) / 4).toFixed(4);
}

export function patchDistance(a, b) {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  return Math.abs(Math.floor(na / 10) - Math.floor(nb / 10)) + Math.abs((na % 10) - (nb % 10));
}

export function initMigState(world) {
  world.mig = {
    moves: 0,
    taxTotal: 0,
    lastFrom: null,
    lastTo: null,
  };
}

function pickMigrateTarget(world, profile) {
  const current = world.place?.patch ?? '00';
  const target = profile.migTargetPatch ?? '11';
  const neighbors = patchNeighbors(current);
  if (!neighbors.length) return null;

  let best = null;
  let bestDist = Infinity;
  for (const np of neighbors) {
    const d = patchDistance(np, target);
    if (d < bestDist) {
      bestDist = d;
      best = np;
    }
  }
  return best && best !== current ? best : neighbors[0];
}

function applyMigTax(world, profile, altDelta) {
  const base = profile.migTaxBase ?? 0.04;
  const tax = base + altDelta * (profile.migAltTax ?? 0.06);
  for (const being of world.beings) {
    if (!being.alive) continue;
    const idx = hashString(being.id) % 8;
    const drain = tax * 0.35;
    being.registers[idx] = Math.max(0, (being.registers[idx] ?? 0) - drain);
  }
  world.mig.taxTotal = (world.mig.taxTotal ?? 0) + tax * world.beings.filter((b) => b.alive).length;
  return tax;
}

/** 世界 patch 迁徙：邻格 + alt 税 + 更新 birthPlace */
export function tickMigration(world, profile, { meanStress = 0 } = {}) {
  if (!migEnabled(profile)) return null;

  const interval = profile.migInterval ?? 56;
  if (world.tick % interval !== 0) return null;

  const current = world.place?.patch ?? '00';
  const target = pickMigrateTarget(world, profile);
  if (!target || target === current) return null;

  const stressMin = profile.migStressMin ?? 0.18;
  const forceEvery = profile.migForceEvery ?? 0;
  const forced = forceEvery > 0 && world.tick % forceEvery === 0;
  if (meanStress < stressMin && !forced) return null;

  const altFrom = patchAlt(current);
  const altTo = patchAlt(target);
  const altDelta = Math.abs(altTo - altFrom);
  const tax = applyMigTax(world, profile, altDelta);

  const band = world.place?.band ?? profile.placeBand ?? 'M';
  const terrain = world.place?.terrain ?? profile.placeTerrain ?? 'L';
  world.birthPlace = formatBirthPlace(band, target, terrain);
  world.place = parseBirthPlace(world.birthPlace);

  world.mig.moves = (world.mig.moves ?? 0) + 1;
  world.mig.lastFrom = current;
  world.mig.lastTo = target;

  return {
    fired: true,
    from: current,
    to: target,
    altFrom,
    altTo,
    altDelta: +altDelta.toFixed(4),
    tax: +tax.toFixed(4),
    meanStress: +meanStress.toFixed(4),
    place: world.birthPlace,
  };
}
