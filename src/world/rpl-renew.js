// 复制配额续行 — [REN] 环境重置 / [PLG] 双体通量汇合（不设端粒酶/配子名称）

import { hashString, mulberry32 } from '../core/hash.js';
import {
  hasReplicationRemaining,
  replicationEnabled,
  logReplication,
} from './replication.js';

function syncRplRemaining(being) {
  if (being.rplSub?.length) {
    being.rplRemaining = being.rplSub.reduce((s, u) => s + u.remaining, 0);
  }
}

export function grantRplRenewal(being, grant, profile) {
  if (!replicationEnabled(profile) || grant <= 0) return 0;

  if (being.rplScope === 'subunit' && being.rplSub?.length) {
    let added = 0;
    for (const unit of being.rplSub) {
      const before = unit.remaining;
      unit.remaining = Math.min(unit.max, unit.remaining + grant);
      added += unit.remaining - before;
    }
    syncRplRemaining(being);
    return added;
  }

  const before = being.rplRemaining ?? 0;
  being.rplRemaining = Math.min(being.rplMax ?? before, before + grant);
  return being.rplRemaining - before;
}

function dnaRenewBias(being) {
  return mulberry32(hashString(`${being.dna.sequence}:${being.id}:ren`))();
}

function substrateAvg(world) {
  const ch = world.substrate?.channels;
  if (!ch?.length) return 0;
  return ch.reduce((a, b) => a + b, 0) / ch.length;
}

/** 富足场 + 低胁迫 + 配额见底 → 概率性 [REN] */
export function tryRplRenew(world, recorder, being, { stress = 0 } = {}) {
  const profile = world.envProfile;
  if (!profile?.rplRenewEnabled || !replicationEnabled(profile) || !being.alive) return null;

  const ceiling = profile.rplRenewAtOrBelow ?? 0;
  if ((being.rplRemaining ?? 1) > ceiling) return null;
  if (stress > (profile.rplRenewMaxStress ?? 0.22)) return null;
  if (substrateAvg(world) < (profile.rplRenewMinSubstrate ?? 0.46)) return null;

  const cooldown = profile.rplRenewCooldown ?? 72;
  const since = world.tick - (being.lastRenTick ?? -cooldown);
  if (since < cooldown) return null;

  const bias = dnaRenewBias(being);
  const prob = Math.min(0.92, (profile.rplRenewBaseProb ?? 0.42) + bias * 0.35);
  const roll = mulberry32(hashString(`${being.id}:${world.tick}:ren`))();
  if (roll > prob) return null;

  const grant = profile.rplRenewGrant ?? 1;
  const added = grantRplRenewal(being, grant, profile);
  if (added <= 0) return null;

  being.lastRenTick = world.tick;
  being.renCount = (being.renCount ?? 0) + 1;

  recorder.evolution(
    world.tick,
    being.id,
    `[REN] +${added} → ${being.rplRemaining}/${being.rplMax} bias ${bias.toFixed(3)}`,
    {
      kind: 'REN',
      added,
      rplRemaining: being.rplRemaining,
      rplMax: being.rplMax,
      dnaBias: +bias.toFixed(4),
      stress,
    }
  );

  return { added, rplRemaining: being.rplRemaining };
}

function exchangeRegisterFlux(a, b, frac = 0.04) {
  const n = Math.min(a.registers.length, b.registers.length);
  for (let i = 0; i < n; i++) {
    const flux = (a.registers[i] - b.registers[i]) * frac;
    a.registers[i] = Math.max(0, Math.min(1, a.registers[i] - flux));
    b.registers[i] = Math.max(0, Math.min(1, b.registers[i] + flux));
  }
}

/** 同 tick 内两体 RPL 耗尽 → 通量汇合互赋配额 [PLG] */
export function processPledgeRenewals(world, recorder) {
  const profile = world.envProfile;
  if (!profile?.plgEnabled || !replicationEnabled(profile)) return [];

  const exhausted = world.beings.filter(
    (b) => b.alive && b.rplMax != null && (b.rplRemaining ?? 0) <= (profile.plgExhaustedAt ?? 0)
  );
  if (exhausted.length < 2) return [];

  const events = [];
  const paired = new Set();

  for (let i = 0; i < exhausted.length; i++) {
    const a = exhausted[i];
    if (paired.has(a.id)) continue;

    for (let j = i + 1; j < exhausted.length; j++) {
      const b = exhausted[j];
      if (paired.has(b.id) || a.id === b.id) continue;

      const pairKey = [a.id, b.id].sort().join(':');
      if (world.plgPairCooldown?.has(pairKey)) {
        const last = world.plgPairCooldown.get(pairKey);
        if (world.tick - last < (profile.plgPairCooldown ?? 120)) continue;
      }

      const grant = profile.plgRenewGrant ?? 1;
      const addedA = grantRplRenewal(a, grant, profile);
      const addedB = grantRplRenewal(b, grant, profile);
      if (addedA <= 0 && addedB <= 0) continue;

      exchangeRegisterFlux(a, b);
      a.plgCount = (a.plgCount ?? 0) + 1;
      b.plgCount = (b.plgCount ?? 0) + 1;

      if (!world.plgPairCooldown) world.plgPairCooldown = new Map();
      world.plgPairCooldown.set(pairKey, world.tick);

      for (const [who, partner, added] of [
        [a, b, addedA],
        [b, a, addedB],
      ]) {
        recorder.evolution(
          world.tick,
          who.id,
          `[PLG] ${partner.id} +${added} → ${who.rplRemaining}/${who.rplMax}`,
          {
            kind: 'PLG',
            partnerId: partner.id,
            added,
            rplRemaining: who.rplRemaining,
            rplMax: who.rplMax,
          }
        );
      }

      paired.add(a.id);
      paired.add(b.id);
      events.push({ aId: a.id, bId: b.id, addedA, addedB });
      break;
    }
  }

  return events;
}
