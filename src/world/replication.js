// 复制配额 — DNA 决定的剩余复制次数（不设端粒/海弗利克名称表）

import { hashString, mulberry32 } from '../core/hash.js';

export function replicationEnabled(profile) {
  return profile?.rplEnabled === true;
}

/** 从 DNA 初始化复制配额与可选 tick 上限 */
export function initReplicationQuota(being, profile) {
  if (!replicationEnabled(profile)) {
    being.rplMax = null;
    being.rplRemaining = null;
    being.rplTickCap = null;
    return null;
  }
  const rng = mulberry32(hashString(`${being.dna.sequence}:${being.id}:rpl`));
  const max = (profile.rplBaseMax ?? 6) + Math.floor(rng() * (profile.rplMaxSpread ?? 6));
  const tickCap =
    profile.rplTickCapEnabled === true
      ? (profile.rplTickCapBase ?? 200) + Math.floor(rng() * (profile.rplTickCapSpread ?? 250))
      : null;
  being.rplMax = max;
  being.rplRemaining = max;
  being.rplTickCap = tickCap;
  return { rplMax: max, rplRemaining: max, rplTickCap: tickCap };
}

export function hasReplicationRemaining(being, profile) {
  if (!replicationEnabled(profile)) return true;
  return (being.rplRemaining ?? 0) > 0;
}

export function logReplication(recorder, tick, beingId, content, meta) {
  recorder.evolution(tick, beingId, content, { kind: 'RPL', ...meta });
}

/** 诞生后记录初始配额 */
export function recordReplicationInit(recorder, tick, being) {
  if (being.rplMax == null) return;
  logReplication(recorder, tick, being.id, `[RPL] init ${being.rplRemaining}/${being.rplMax}`, {
    phase: 'init',
    rplMax: being.rplMax,
    rplRemaining: being.rplRemaining,
    rplTickCap: being.rplTickCap,
  });
}

/** FISS：亲代与子代同步扣减后的剩余 */
export function applyFissionReplication(world, recorder, parent, child) {
  const profile = world.envProfile;
  if (!replicationEnabled(profile)) return null;

  const before = parent.rplRemaining ?? 0;
  const after = Math.max(0, before - 1);
  parent.rplRemaining = after;
  child.rplMax = parent.rplMax;
  child.rplRemaining = after;
  child.rplTickCap = parent.rplTickCap;

  logReplication(recorder, world.tick, parent.id, `[RPL] fiss ${after}/${parent.rplMax} child ${child.id}`, {
    phase: 'fiss',
    before,
    after,
    rplMax: parent.rplMax,
    childId: child.id,
  });

  if (after === 0) {
    logReplication(recorder, world.tick, parent.id, `[RPL] exhausted`, {
      phase: 'exhausted',
      via: 'fiss',
    });
  }
  return { before, after };
}

/** LINEAGE 诞生：新个体配额 −1（出生计为一次复制） */
export function applyLineageReplication(world, recorder, child) {
  const profile = world.envProfile;
  if (!replicationEnabled(profile)) return null;

  const before = child.rplRemaining ?? 0;
  const after = Math.max(0, before - 1);
  child.rplRemaining = after;

  logReplication(recorder, world.tick, child.id, `[RPL] lineage ${after}/${child.rplMax}`, {
    phase: 'lineage',
    before,
    after,
    rplMax: child.rplMax,
  });
  return { before, after };
}

/** tick 寿命顶 / 配额耗尽终止 */
export function checkReplicationTermination(being, profile) {
  if (!replicationEnabled(profile) || !being.alive) return null;

  if (profile.rplTickCapEnabled && being.rplTickCap != null && being.tickCount >= being.rplTickCap) {
    return { reason: 'rpl_tick_cap', rplTickCap: being.rplTickCap, tickCount: being.tickCount };
  }

  if (profile.rplSenescenceEnd && (being.rplRemaining ?? 0) <= 0 && (being.rplMax ?? 0) > 0) {
    return { reason: 'rpl_exhausted', rplRemaining: being.rplRemaining, rplMax: being.rplMax };
  }

  return null;
}
