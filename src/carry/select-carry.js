/** Phase 106 — 田野结束时筛选留置个体 */

import { snapshotBeings } from './being-snapshot.js';

/**
 * 优先存活者；全灭时取存活 tick 最长者。
 * 排序：代次高 → 存活 tick 长。
 */
export function selectCarryCandidates(world, profile = {}) {
  const max = profile.carryMaxPerSeed ?? 2;
  let pool = world.beings.filter((b) => b.alive);
  if (!pool.length) {
    pool = [...world.beings];
  }
  return pool
    .sort((a, b) => {
      const scoreA = (a.generation ?? 0) * 10000 + (a.tickCount ?? 0);
      const scoreB = (b.generation ?? 0) * 10000 + (b.tickCount ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, max);
}

export function selectCarrySnapshots(world, profile = {}, provenance = {}) {
  const picks = selectCarryCandidates(world, profile);
  return snapshotBeings(picks, { ...provenance, tick: world.tick });
}
