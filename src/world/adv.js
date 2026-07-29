// GAP-ENV Phase 91 — [ADV] 邻格平流：patch 间基底与 BIO residue 交换

import { hashString, mulberry32 } from '../core/hash.js';
import { SUBSTRATE_CHANNELS } from './substrate.js';

export function advEnabled(profile) {
  return profile?.advEnabled === true;
}

/** 3×3 patch 网格邻接（00–22） */
export function patchNeighbors(patch = '00') {
  const n = parseInt(patch, 10);
  const r = Math.floor(n / 10);
  const c = n % 10;
  const out = [];
  for (const [dr, dc] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr <= 2 && nc >= 0 && nc <= 2) {
      out.push(`${nr}${nc}`);
    }
  }
  return out;
}

function neighborPool(world, neighborPatch) {
  const band = world.place?.band ?? 'M';
  const terrain = world.place?.terrain ?? 'L';
  const key = `${band}-${neighborPatch}-${terrain}`;
  if (!world.adv.pools[key]) {
    const rng = mulberry32(hashString(`${world.name}:${key}:adv`));
    world.adv.pools[key] = {
      patch: neighborPatch,
      channels: Array.from({ length: SUBSTRATE_CHANNELS }, () => rng()),
    };
  }
  return world.adv.pools[key];
}

export function initAdvState(world) {
  world.adv = {
    pools: {},
    fluxTotal: 0,
    events: 0,
    bioticSpread: 0,
    transferCount: 0,
  };
}

/**
 * 每 advInterval tick：邻格通道差驱动平流；顺带扩散 biotic residue
 */
export function tickAdv(world, profile) {
  if (!advEnabled(profile)) return null;

  const interval = profile.advInterval ?? 12;
  if (world.tick % interval !== 0) return null;

  const patch = world.place?.patch ?? '00';
  const neighbors = patchNeighbors(patch);
  const rate = profile.advRate ?? 0.052;
  const local = world.substrate.channels;
  const transfers = [];
  let flux = 0;

  for (const np of neighbors) {
    const pool = neighborPool(world, np);
    for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
      const delta = rate * (pool.channels[i] - local[i]);
      if (Math.abs(delta) < 0.00004) continue;
      const applied = delta * 0.5;
      local[i] = Math.max(0, Math.min(1, local[i] + applied));
      pool.channels[i] = Math.max(0, Math.min(1, pool.channels[i] - applied));
      flux += Math.abs(applied);
      transfers.push({ neighbor: np, idx: i, delta: +applied.toFixed(5) });
    }
  }

  if (world.biotic?.residue) {
    const spread = profile.advBioticSpread ?? 0.1;
    for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
      const r = world.biotic.residue[i];
      if (Math.abs(r) < 0.0001) continue;
      const out = r * spread * 0.2;
      world.biotic.residue[i] -= out;
      world.adv.bioticSpread = (world.adv.bioticSpread ?? 0) + Math.abs(out);
    }
  }

  if (!transfers.length) return null;

  world.adv.fluxTotal += flux;
  world.adv.events++;
  world.adv.transferCount += transfers.length;

  const t0 = transfers[0];
  return {
    fired: true,
    flux: +flux.toFixed(5),
    transfers,
    neighbors: neighbors.length,
    neighbor: t0.neighbor,
    idx: t0.idx,
    delta: t0.delta,
    place: world.birthPlace,
  };
}
