// 减数缩减 + 双源汇合 — [MEI] / [FUS]（不设配子/性别名称）

import { hashString, mulberry32 } from '../core/hash.js';
import { reduceDna, recombineDna, mutate } from '../core/dna.js';
import { performBirthRitual } from '../birth/ritual.js';
import {
  hasReplicationRemaining,
  replicationEnabled,
  logReplication,
} from './replication.js';

function substrateAvg(world) {
  const ch = world.substrate?.channels;
  if (!ch?.length) return 0;
  return ch.reduce((a, b) => a + b, 0) / ch.length;
}

function dnaMeiBias(being) {
  return mulberry32(hashString(`${being.dna.sequence}:${being.id}:mei`))();
}

export function meiEnabled(profile) {
  return profile?.meiEnabled === true;
}

export function fusEnabled(profile) {
  return profile?.fusEnabled === true;
}

/** 富足场 + 低胁迫 + 有 RPL → 产生 meiPacket */
export function tryMeiosis(world, recorder, being, { stress = 0, integrity = 1 } = {}) {
  const profile = world.envProfile;
  if (!meiEnabled(profile) || !replicationEnabled(profile) || !being.alive) return null;
  if (being.independent === false) return null;
  if (being.meiPacket) return null;
  if (!hasReplicationRemaining(being, profile)) return null;

  if (being.tickCount < (profile.meiMinAge ?? 40)) return null;
  if (stress > (profile.meiMaxStress ?? 0.26)) return null;
  if (integrity != null && integrity < (profile.meiMinIntegrity ?? 0.5)) return null;
  if (substrateAvg(world) < (profile.meiMinSubstrate ?? 0.44)) return null;

  const cooldown = profile.meiCooldown ?? 80;
  const since = world.tick - (being.lastMeiTick ?? -cooldown);
  if (since < cooldown) return null;

  const bias = dnaMeiBias(being);
  const prob = Math.min(0.88, (profile.meiBaseProb ?? 0.38) + bias * 0.32);
  const roll = mulberry32(hashString(`${being.id}:${world.tick}:mei`))();
  if (roll > prob) return null;

  const seed = hashString(`${being.id}:${world.tick}:reduce`);
  const packetSeq = reduceDna(being.dna.sequence, seed);
  being.meiPacket = { seq: packetSeq, atTick: world.tick };
  being.lastMeiTick = world.tick;
  being.meiCount = (being.meiCount ?? 0) + 1;

  const before = being.rplRemaining ?? 0;
  if (being.rplScope === 'subunit' && being.rplSub?.length) {
    for (const unit of being.rplSub) {
      unit.remaining = Math.max(0, unit.remaining - 1);
    }
    being.rplRemaining = being.rplSub.reduce((s, u) => s + u.remaining, 0);
  } else {
    being.rplRemaining = Math.max(0, before - 1);
  }

  logReplication(recorder, world.tick, being.id, `[RPL] mei ${being.rplRemaining}/${being.rplMax}`, {
    phase: 'mei',
    before,
    after: being.rplRemaining,
    rplMax: being.rplMax,
    rplScope: being.rplScope,
  });

  recorder.evolution(
    world.tick,
    being.id,
    `[MEI] packet len ${packetSeq.length} bias ${bias.toFixed(3)}`,
    {
      kind: 'MEI',
      packetLen: packetSeq.length,
      dnaBias: +bias.toFixed(4),
      rplRemaining: being.rplRemaining,
      stress,
    }
  );

  return { packetSeq, bias };
}

function exchangeRegisterFlux(a, b, frac = 0.04) {
  const n = Math.min(a.registers.length, b.registers.length);
  for (let i = 0; i < n; i++) {
    const flux = (a.registers[i] - b.registers[i]) * frac;
    a.registers[i] = Math.max(0, Math.min(1, a.registers[i] - flux));
    b.registers[i] = Math.max(0, Math.min(1, b.registers[i] + flux));
  }
}

function packetFresh(packet, world, profile) {
  if (!packet) return false;
  const maxAge = profile.fusPacketMaxAge ?? 48;
  return world.tick - packet.atTick <= maxAge;
}

function spawnFusionFromSeqs(world, recorder, parentA, parentB, seqA, seqB, { liveDonor = false } = {}) {
  const profile = world.envProfile ?? {};
  const maxPop = profile.fusionMaxPop ?? profile.fissionMaxPop ?? 36;
  if (world.beings.filter((b) => b.alive).length >= maxPop) return null;

  const seed = hashString(`${parentA.id}:${parentB.id}:${world.tick}:fus`);
  const combined = recombineDna(seqA, seqB, seed);
  const rate = profile.fusionMutationRate ?? 0.015;
  const { seq, mutationCount } = mutate(combined, rate, seed + 1);

  const born = performBirthRitual(world, recorder, {
    name: `${parentA.name.slice(0, 3)}${parentB.name.slice(0, 3)}汇`,
    code: parentA.code,
    dnaSequence: seq,
  });

  const child = born.being;
  child.generation = Math.max(parentA.generation ?? 0, parentB.generation ?? 0) + 1;
  child.fusParentA = parentA.id;
  child.fusParentB = parentB.id;
  child.bornAtTick = world.tick;
  child.recombined = true;

  parentA.meiPacket = null;
  parentA.fusCount = (parentA.fusCount ?? 0) + 1;
  parentB.fusCount = (parentB.fusCount ?? 0) + 1;

  exchangeRegisterFlux(parentA, parentB);

  if (replicationEnabled(profile)) {
    const before = child.rplRemaining ?? 0;
    if (child.rplScope === 'subunit' && child.rplSub?.length) {
      for (const unit of child.rplSub) {
        unit.remaining = Math.max(0, unit.remaining - 1);
      }
      child.rplRemaining = child.rplSub.reduce((s, u) => s + u.remaining, 0);
    } else {
      child.rplRemaining = Math.max(0, before - 1);
    }
    logReplication(recorder, world.tick, child.id, `[RPL] fus ${child.rplRemaining}/${child.rplMax}`, {
      phase: 'fus',
      before,
      after: child.rplRemaining,
      parentA: parentA.id,
      parentB: parentB.id,
      liveDonor,
    });
  }

  for (const [who, partner] of [
    [parentA, parentB],
    [parentB, parentA],
  ]) {
    recorder.evolution(
      world.tick,
      who.id,
      `[FUS] ${partner.id} → ${child.id} mut ${mutationCount}${liveDonor ? ' live' : ''}`,
      {
        kind: 'FUS',
        partnerId: partner.id,
        childId: child.id,
        mutationCount,
        generation: child.generation,
        liveDonor,
      }
    );
  }

  return { child, mutationCount };
}

function spawnFusionOffspring(world, recorder, parentA, parentB) {
  return spawnFusionFromSeqs(world, recorder, parentA, parentB, parentA.meiPacket.seq, parentB.meiPacket.seq);
}

function applyLiveDonorRpl(world, recorder, donor) {
  const profile = world.envProfile;
  const before = donor.rplRemaining ?? 0;
  if (donor.rplScope === 'subunit' && donor.rplSub?.length) {
    for (const unit of donor.rplSub) {
      unit.remaining = Math.max(0, unit.remaining - 1);
    }
    donor.rplRemaining = donor.rplSub.reduce((s, u) => s + u.remaining, 0);
  } else {
    donor.rplRemaining = Math.max(0, before - 1);
  }
  logReplication(recorder, world.tick, donor.id, `[RPL] donor ${donor.rplRemaining}/${donor.rplMax}`, {
    phase: 'donor',
    before,
    after: donor.rplRemaining,
    rplMax: donor.rplMax,
  });
}

function tryLiveDonorFusion(world, recorder, holder, donor) {
  const profile = world.envProfile;
  if (!profile?.fusLiveDonorEnabled || !hasReplicationRemaining(donor, profile)) return null;
  if (!holder.meiPacket || !packetFresh(holder.meiPacket, world, profile)) return null;

  const donorSeq = reduceDna(donor.dna.sequence, hashString(`${donor.id}:${world.tick}:live`));
  applyLiveDonorRpl(world, recorder, donor);
  return spawnFusionFromSeqs(world, recorder, holder, donor, holder.meiPacket.seq, donorSeq, {
    liveDonor: true,
  });
}

/** 双体 meiPacket 汇合；可选 live-donor 配对 */
export function processFusions(world, recorder) {
  const profile = world.envProfile;
  if (!fusEnabled(profile) || !replicationEnabled(profile)) return [];

  const events = [];
  const paired = new Set();

  const ready = world.beings.filter(
    (b) => b.alive && b.meiPacket && packetFresh(b.meiPacket, world, profile)
  );

  for (let i = 0; i < ready.length; i++) {
    const a = ready[i];
    if (paired.has(a.id)) continue;

    for (let j = i + 1; j < ready.length; j++) {
      const b = ready[j];
      if (paired.has(b.id) || a.id === b.id) continue;
      if (a.code !== b.code && profile.fusSameCodeOnly) continue;

      const pairKey = [a.id, b.id].sort().join(':');
      if (world.fusPairCooldown?.has(pairKey)) {
        const last = world.fusPairCooldown.get(pairKey);
        if (world.tick - last < (profile.fusPairCooldown ?? 100)) continue;
      }

      const result = spawnFusionOffspring(world, recorder, a, b);
      if (!result) continue;

      if (!world.fusPairCooldown) world.fusPairCooldown = new Map();
      world.fusPairCooldown.set(pairKey, world.tick);

      paired.add(a.id);
      paired.add(b.id);
      events.push({ aId: a.id, bId: b.id, childId: result.child.id, liveDonor: false });
      break;
    }
  }

  if (profile.fusLiveDonorEnabled) {
    const holders = world.beings.filter(
      (b) => b.alive && b.meiPacket && packetFresh(b.meiPacket, world, profile) && !paired.has(b.id)
    );
    const donors = world.beings.filter(
      (b) => b.alive && !b.meiPacket && !paired.has(b.id) && hasReplicationRemaining(b, profile)
    );

    for (const holder of holders) {
      if (paired.has(holder.id)) continue;
      for (const donor of donors) {
        if (paired.has(donor.id) || holder.id === donor.id) continue;

        const pairKey = [holder.id, donor.id].sort().join(':');
        if (world.fusPairCooldown?.has(pairKey)) {
          const last = world.fusPairCooldown.get(pairKey);
          if (world.tick - last < (profile.fusPairCooldown ?? 100)) continue;
        }

        const result = tryLiveDonorFusion(world, recorder, holder, donor);
        if (!result) continue;

        if (!world.fusPairCooldown) world.fusPairCooldown = new Map();
        world.fusPairCooldown.set(pairKey, world.tick);

        paired.add(holder.id);
        paired.add(donor.id);
        events.push({
          aId: holder.id,
          bId: donor.id,
          childId: result.child.id,
          liveDonor: true,
        });
        break;
      }
    }
  }

  return events;
}

/** 种群 DNA 序列唯一数（田野多样性指标） */
export function dnaDiversity(beings) {
  const alive = beings.filter((b) => b.alive);
  const unique = new Set(alive.map((b) => b.dna.sequence));
  return { uniqueSeqs: unique.size, population: alive.length };
}
