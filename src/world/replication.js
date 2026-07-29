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
    being.rplScope = null;
    being.rplSub = null;
    return null;
  }
  const rng = mulberry32(hashString(`${being.dna.sequence}:${being.id}:rpl`));
  const max = (profile.rplBaseMax ?? 6) + Math.floor(rng() * (profile.rplMaxSpread ?? 6));
  const tickCap =
    profile.rplTickCapEnabled === true
      ? (profile.rplTickCapBase ?? 200) + Math.floor(rng() * (profile.rplTickCapSpread ?? 250))
      : null;

  const scope = resolveRplScope(being, profile);
  being.rplScope = scope;
  being.rplMax = max;
  being.rplTickCap = tickCap;

  if (scope === 'subunit' && being.subCells?.length) {
    being.rplSub = initSubunitRpl(being, max);
    being.rplRemaining = being.rplSub.reduce((s, u) => s + u.remaining, 0);
  } else {
    being.rplSub = null;
    being.rplRemaining = max;
  }

  return { rplMax: max, rplRemaining: being.rplRemaining, rplTickCap: tickCap, rplScope: scope };
}

export function resolveRplScope(being, profile) {
  if (profile?.rplScope === 'subunit' && being.organismType === 'multicell') return 'subunit';
  return 'organism';
}

function initSubunitRpl(being, totalMax) {
  const n = being.subCells.length;
  let pool = Math.max(totalMax, n);
  const units = [];
  for (let i = 0; i < n; i++) {
    const left = n - i;
    const share = Math.max(1, Math.floor(pool / left));
    pool -= share;
    const sc = being.subCells[i];
    units.push({ subId: sc.id, role: sc.role, max: share, remaining: share });
  }
  return units;
}

export function hasReplicationRemaining(being, profile) {
  if (!replicationEnabled(profile)) return true;
  if (being.rplScope === 'subunit' && being.rplSub?.length) {
    return being.rplSub.every((u) => u.remaining > 0);
  }
  return (being.rplRemaining ?? 0) > 0;
}

export function logReplication(recorder, tick, beingId, content, meta) {
  recorder.evolution(tick, beingId, content, { kind: 'RPL', ...meta });
}

export function recordReplicationInit(recorder, tick, being) {
  if (being.rplMax == null) return;
  const scope = being.rplScope ?? 'organism';
  const subNote =
    scope === 'subunit' && being.rplSub?.length
      ? ` subs ${being.rplSub.map((u) => `${u.subId}:${u.remaining}`).join(' ')}`
      : '';
  logReplication(
    recorder,
    tick,
    being.id,
    `[RPL] init ${being.rplRemaining}/${being.rplMax} scope ${scope}${subNote}`,
    {
      phase: 'init',
      rplMax: being.rplMax,
      rplRemaining: being.rplRemaining,
      rplTickCap: being.rplTickCap,
      rplScope: scope,
      rplSub: being.rplSub,
      organismType: being.organismType,
    }
  );
}

function syncRplRemaining(being) {
  if (being.rplSub?.length) {
    being.rplRemaining = being.rplSub.reduce((s, u) => s + u.remaining, 0);
  }
}

function copyRplSub(parent) {
  return parent.rplSub?.map((u) => ({ ...u })) ?? null;
}

/** FISS：亲代与子代同步扣减后的剩余 */
export function applyFissionReplication(world, recorder, parent, child) {
  const profile = world.envProfile;
  if (!replicationEnabled(profile)) return null;

  const scope = parent.rplScope ?? 'organism';
  let before = parent.rplRemaining ?? 0;

  if (scope === 'subunit' && parent.rplSub?.length) {
    for (const unit of parent.rplSub) {
      unit.remaining = Math.max(0, unit.remaining - 1);
    }
    syncRplRemaining(parent);
    child.rplScope = 'subunit';
    child.rplSub = copyRplSub(parent);
    child.rplMax = parent.rplMax;
    child.rplTickCap = parent.rplTickCap;
    child.rplRemaining = parent.rplRemaining;
  } else {
    const after = Math.max(0, before - 1);
    parent.rplRemaining = after;
    child.rplMax = parent.rplMax;
    child.rplRemaining = after;
    child.rplTickCap = parent.rplTickCap;
    child.rplScope = 'organism';
    child.rplSub = null;
  }

  const after = parent.rplRemaining ?? 0;

  logReplication(recorder, world.tick, parent.id, `[RPL] fiss ${after}/${parent.rplMax} scope ${scope} child ${child.id}`, {
    phase: 'fiss',
    before,
    after,
    rplMax: parent.rplMax,
    childId: child.id,
    rplScope: scope,
    rplSub: parent.rplSub,
    organismType: parent.organismType,
  });

  if (!hasReplicationRemaining(parent, profile)) {
    logReplication(recorder, world.tick, parent.id, `[RPL] exhausted`, {
      phase: 'exhausted',
      via: 'fiss',
      rplScope: scope,
    });
  }
  return { before, after, rplScope: scope };
}

/** LINEAGE 诞生：新个体配额 −1（出生计为一次复制） */
export function applyLineageReplication(world, recorder, child) {
  const profile = world.envProfile;
  if (!replicationEnabled(profile)) return null;

  const before = child.rplRemaining ?? 0;
  if (child.rplScope === 'subunit' && child.rplSub?.length) {
    for (const unit of child.rplSub) {
      unit.remaining = Math.max(0, unit.remaining - 1);
    }
    syncRplRemaining(child);
  } else {
    child.rplRemaining = Math.max(0, before - 1);
  }
  const after = child.rplRemaining ?? 0;

  logReplication(recorder, world.tick, child.id, `[RPL] lineage ${after}/${child.rplMax} scope ${child.rplScope ?? 'organism'}`, {
    phase: 'lineage',
    before,
    after,
    rplMax: child.rplMax,
    rplScope: child.rplScope,
    rplSub: child.rplSub,
  });
  return { before, after };
}

/** tick 寿命顶 / 配额耗尽终止 */
export function checkReplicationTermination(being, profile) {
  if (!replicationEnabled(profile) || !being.alive) return null;

  if (profile.rplTickCapEnabled && being.rplTickCap != null && being.tickCount >= being.rplTickCap) {
    return { reason: 'rpl_tick_cap', rplTickCap: being.rplTickCap, tickCount: being.tickCount };
  }

  if (profile.rplSenescenceEnd && !hasReplicationRemaining(being, profile) && (being.rplMax ?? 0) > 0) {
    return {
      reason: 'rpl_exhausted',
      rplRemaining: being.rplRemaining,
      rplMax: being.rplMax,
      rplScope: being.rplScope,
    };
  }

  return null;
}
