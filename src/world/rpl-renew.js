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

function renewalBudgetLeft(being, profile) {
  const max = profile.rplRenewMaxCount;
  if (max == null) return Infinity;
  return max - ((being.renCount ?? 0) + (being.plgCount ?? 0));
}

function applyRenewalCost(being, profile, { via = 'REN', mult = 1 } = {}) {
  if (!profile?.rplRenewCostEnabled) return null;

  const stressBump = Math.ceil((profile.rplRenewStressBump ?? 3) * mult);
  being.stressStreak = (being.stressStreak || 0) + stressBump;

  const drain = (profile.rplRenewRegisterDrain ?? 0.06) * mult;
  if (drain > 0) {
    for (let i = 0; i < being.registers.length; i++) {
      being.registers[i] = Math.max(0, being.registers[i] - drain);
    }
  }

  const tickDebt = Math.ceil((profile.rplRenewTickDebt ?? 32) * mult);
  if (tickDebt > 0) {
    being.renewTickDebt = (being.renewTickDebt ?? 0) + tickDebt;
    if (being.rplTickCap != null) {
      being.rplTickCap = Math.max(being.tickCount + 12, being.rplTickCap - tickDebt);
    }
  }

  being.renewCostCount = (being.renewCostCount ?? 0) + 1;

  return { stressBump, registerDrain: drain, tickDebt, via };
}

function logRenewalCost(recorder, world, being, cost) {
  if (!cost) return;
  recorder.evolution(
    world.tick,
    being.id,
    `[RCO] ${cost.via} stress+${cost.stressBump} tickDebt+${cost.tickDebt}`,
    {
      kind: 'RCO',
      via: cost.via,
      stressBump: cost.stressBump,
      tickDebt: cost.tickDebt,
      registerDrain: cost.registerDrain,
      renewTickDebt: being.renewTickDebt,
      rplTickCap: being.rplTickCap,
      renewCostCount: being.renewCostCount,
    }
  );
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
  const blocked =
    being.rplScope === 'subunit' && being.rplSub?.length
      ? !hasReplicationRemaining(being, profile)
      : (being.rplRemaining ?? 1) <= ceiling;
  if (!blocked && (being.rplRemaining ?? 1) > ceiling) return null;
  if (stress > (profile.rplRenewMaxStress ?? 0.22)) return null;
  if (substrateAvg(world) < (profile.rplRenewMinSubstrate ?? 0.46)) return null;

  const cooldown = profile.rplRenewCooldown ?? 72;
  const since = world.tick - (being.lastRenTick ?? -cooldown);
  if (since < cooldown) return null;

  if (renewalBudgetLeft(being, profile) <= 0) return null;

  const bias = dnaRenewBias(being);
  const decay = (being.renCount ?? 0) * (profile.rplRenewProbDecay ?? 0);
  const prob = Math.min(0.92, Math.max(0.04, (profile.rplRenewBaseProb ?? 0.42) + bias * 0.35 - decay));
  const roll = mulberry32(hashString(`${being.id}:${world.tick}:ren`))();
  if (roll > prob) return null;

  const grant = profile.rplRenewGrant ?? 1;
  const added = grantRplRenewal(being, grant, profile);
  if (added <= 0) return null;

  being.lastRenTick = world.tick;
  being.renCount = (being.renCount ?? 0) + 1;

  const cost = applyRenewalCost(being, profile, { via: 'REN' });
  logRenewalCost(recorder, world, being, cost);

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
      rplScope: being.rplScope,
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

  const at = profile.plgExhaustedAt ?? 0;
  const exhausted = world.beings.filter((b) => {
    if (!b.alive || b.rplMax == null) return false;
    if (b.rplScope === 'subunit' && b.rplSub?.length) {
      return !hasReplicationRemaining(b, profile);
    }
    return (b.rplRemaining ?? 0) <= at;
  });
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

      if (renewalBudgetLeft(a, profile) <= 0 || renewalBudgetLeft(b, profile) <= 0) continue;

      const grant = profile.plgRenewGrant ?? 1;
      const addedA = grantRplRenewal(a, grant, profile);
      const addedB = grantRplRenewal(b, grant, profile);
      if (addedA <= 0 && addedB <= 0) continue;

      const plgMult = profile.plgRenewCostMult ?? 1.15;
      const costA = applyRenewalCost(a, profile, { via: 'PLG', mult: plgMult });
      const costB = applyRenewalCost(b, profile, { via: 'PLG', mult: plgMult });
      logRenewalCost(recorder, world, a, costA);
      logRenewalCost(recorder, world, b, costB);

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
