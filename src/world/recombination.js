// 减数缩减 + 双源汇合 — [MEI] / [FUS] / [BCN] 信标（不设配子/性别名称）

import { hashString, mulberry32 } from '../core/hash.js';
import { reduceDna, recombineDna, mutate } from '../core/dna.js';
import { birthIntoWorld } from '../birth/spawn.js';
import { slotIndex, SLOT_COUNT } from './social.js';
import {
  hasMeiReplicationBudget,
  hasDonorReplicationBudget,
  consumeReplicationForMei,
  consumeReplicationForDonor,
  tryIntraSubunitPlg,
  replicationEnabled,
  logReplication,
} from './replication.js';
import { applyEhuLineageEcho } from './electronic-human-profile.js';

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

function slotDistance(a, b) {
  const ia = slotIndex(a?.socialSlot ?? 'S0');
  const ib = slotIndex(b?.socialSlot ?? 'S0');
  const d = Math.abs(ia - ib);
  return Math.min(d, SLOT_COUNT - d);
}

function sortByAffinity(candidates, anchor, profile) {
  if (!profile?.fusSocialAffinity) return candidates;
  return [...candidates].sort((x, y) => slotDistance(anchor, x) - slotDistance(anchor, y));
}

function packetFresh(packet, world, profile) {
  if (!packet) return false;
  const maxAge = profile.fusPacketMaxAge ?? 48;
  return world.tick - packet.atTick <= maxAge;
}

function pairOnCooldown(world, profile, idA, idB) {
  const pairKey = [idA, idB].sort().join(':');
  if (!world.fusPairCooldown?.has(pairKey)) return false;
  const last = world.fusPairCooldown.get(pairKey);
  return world.tick - last < (profile.fusPairCooldown ?? 100);
}

function markPairCooldown(world, idA, idB) {
  const pairKey = [idA, idB].sort().join(':');
  if (!world.fusPairCooldown) world.fusPairCooldown = new Map();
  world.fusPairCooldown.set(pairKey, world.tick);
}

function logBeacon(recorder, world, being) {
  recorder.evolution(
    world.tick,
    being.id,
    `[BCN] packet slot ${being.socialSlot} wait 0`,
    {
      kind: 'BCN',
      socialSlot: being.socialSlot,
      packetAt: being.meiPacket.atTick,
      subId: being.meiPacket.subId ?? null,
    }
  );
}

function logCrossSubBeacon(recorder, world, being) {
  recorder.evolution(
    world.tick,
    being.id,
    `[XBCN] sub ${being.meiPacket.subId ?? '?'} slot ${being.socialSlot}`,
    {
      kind: 'XBCN',
      subId: being.meiPacket.subId ?? null,
      socialSlot: being.socialSlot,
      packetAt: being.meiPacket.atTick,
    }
  );
}

function subunitDonorScore(holder, donor, profile) {
  let score = donor.rplRemaining ?? 0;
  if (!profile.fusSubunitRouteEnabled || donor.rplScope !== 'subunit' || !donor.rplSub?.length) {
    return score;
  }
  const holderSub = holder.meiPacket?.subId;
  for (const u of donor.rplSub) {
    if (u.remaining > 0 && u.subId !== holderSub) score += 4;
    else if (u.remaining > 0) score += 1;
  }
  return score;
}

function sortDonorsBySubCapacity(holder, donors, profile) {
  if (!profile.fusSubunitRouteEnabled) return donors;
  return [...donors].sort(
    (a, b) => subunitDonorScore(holder, b, profile) - subunitDonorScore(holder, a, profile)
  );
}

/** 个体终止时 packet 进入孤儿池 */
export function collectOrphanPacket(world, being, profile) {
  if (!profile?.fusOrphanPoolEnabled || !being.meiPacket) return null;
  if (!world.orphanPackets) world.orphanPackets = [];
  const max = profile.fusOrphanPoolMax ?? 12;
  const entry = {
    seq: being.meiPacket.seq,
    fromId: being.id,
    atTick: being.meiPacket.atTick,
    socialSlot: being.socialSlot,
    collectedAt: world.tick,
  };
  world.orphanPackets.push(entry);
  if (world.orphanPackets.length > max) world.orphanPackets.shift();
  being.meiPacket = null;
  return entry;
}

/** 富足场 + 低胁迫 + 有 RPL → 产生 meiPacket */
export function tryMeiosis(world, recorder, being, { stress = 0, integrity = 1 } = {}) {
  const profile = world.envProfile;
  if (!meiEnabled(profile) || !replicationEnabled(profile) || !being.alive) return null;
  if (being.independent === false) return null;
  if (being.meiPacket) return null;
  if (!hasMeiReplicationBudget(being, profile)) return null;

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
  const rpl = consumeReplicationForMei(being, profile);
  being.meiPacket = { seq: packetSeq, atTick: world.tick, subId: rpl.subId ?? null };
  being.lastMeiTick = world.tick;
  being.meiCount = (being.meiCount ?? 0) + 1;

  logReplication(recorder, world.tick, being.id, `[RPL] mei ${being.rplRemaining}/${being.rplMax}`, {
    phase: 'mei',
    before: rpl.before,
    after: rpl.after,
    rplMax: being.rplMax,
    rplScope: rpl.rplScope,
    meiRplDeduct: rpl.mode,
    subId: rpl.subId,
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
      organismType: being.organismType ?? 'unicell',
      rplScope: being.rplScope,
      meiRplDeduct: rpl.mode,
      subId: rpl.subId,
    }
  );

  if (profile.fusIntraSubPlgEnabled) {
    tryIntraSubunitPlg(world, recorder, being, profile);
  }
  if (profile.fusSubunitRouteEnabled) {
    logCrossSubBeacon(recorder, world, being);
  } else if (profile.fusBeaconEnabled) {
    logBeacon(recorder, world, being);
  }

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

function spawnFusionFromSeqs(
  world,
  recorder,
  parentA,
  parentB,
  seqA,
  seqB,
  { liveDonor = false, orphan = false, orphanFromId = null } = {}
) {
  const profile = world.envProfile ?? {};
  const maxPop = profile.fusionMaxPop ?? profile.fissionMaxPop ?? 36;
  if (world.beings.filter((b) => b.alive).length >= maxPop) return null;

  const seed = hashString(`${parentA.id}:${parentB.id}:${world.tick}:fus`);
  const combined = recombineDna(seqA, seqB, seed);
  const rate = profile.fusionMutationRate ?? 0.015;
  const { seq, mutationCount } = mutate(combined, rate, seed + 1);

  const born = birthIntoWorld(world, recorder, {
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

  applyEhuLineageEcho(world, recorder, child, [parentA, parentB], profile);

  if (!orphan) parentA.meiPacket = null;
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
      orphan,
    });
  }

  const tag = `${liveDonor ? ' live' : ''}${orphan ? ' orphan' : ''}`;
  for (const [who, partner] of [
    [parentA, parentB],
    [parentB, parentA],
  ]) {
    recorder.evolution(
      world.tick,
      who.id,
      `[FUS] ${partner.id} → ${child.id} mut ${mutationCount}${tag}`,
      {
        kind: 'FUS',
        partnerId: partner.id,
        childId: child.id,
        mutationCount,
        generation: child.generation,
        organismType: child.organismType ?? 'unicell',
        liveDonor,
        orphan,
        orphanFromId,
      }
    );
  }

  return { child, mutationCount };
}

function spawnFusionOffspring(world, recorder, parentA, parentB) {
  return spawnFusionFromSeqs(world, recorder, parentA, parentB, parentA.meiPacket.seq, parentB.meiPacket.seq);
}

function applyLiveDonorRpl(world, recorder, donor) {
  const profile = world.envProfile ?? {};
  const rpl =
    donor.rplScope === 'subunit' && profile.fusSubunitDonorMode === 'any'
      ? consumeReplicationForDonor(donor, profile)
      : null;

  if (rpl) {
    logReplication(recorder, world.tick, donor.id, `[RPL] donor ${donor.rplRemaining}/${donor.rplMax}`, {
      phase: 'donor',
      before: rpl.before,
      after: rpl.after,
      rplMax: donor.rplMax,
      subId: rpl.subId,
      donorMode: 'any',
    });
    return;
  }

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
  if (!profile?.fusLiveDonorEnabled || !hasDonorReplicationBudget(donor, profile)) return null;
  if (!holder.meiPacket || !packetFresh(holder.meiPacket, world, profile)) return null;

  const donorSeq = reduceDna(donor.dna.sequence, hashString(`${donor.id}:${world.tick}:live`));
  applyLiveDonorRpl(world, recorder, donor);
  return spawnFusionFromSeqs(world, recorder, holder, donor, holder.meiPacket.seq, donorSeq, {
    liveDonor: true,
  });
}

function tryOrphanFusion(world, recorder, orphan, donor) {
  const profile = world.envProfile;
  if (!profile?.fusOrphanPoolEnabled || !hasDonorReplicationBudget(donor, profile)) return null;
  if (!packetFresh(orphan, world, profile)) return null;

  const donorSeq = reduceDna(donor.dna.sequence, hashString(`${donor.id}:${world.tick}:orphan`));
  applyLiveDonorRpl(world, recorder, donor);
  return spawnFusionFromSeqs(world, recorder, donor, donor, orphan.seq, donorSeq, {
    liveDonor: true,
    orphan: true,
    orphanFromId: orphan.fromId,
  });
}

function pairAllPackets(world, recorder, profile, paired, events) {
  const maxPasses = profile.fusAggressivePairing ? (profile.fusMaxPairPasses ?? 3) : 1;
  const maxPairs = profile.fusMaxPairsPerTick ?? 8;
  let pairsDone = 0;

  for (let pass = 0; pass < maxPasses && pairsDone < maxPairs; pass++) {
    let pairedThisPass = false;
    let ready = world.beings.filter(
      (b) => b.alive && b.meiPacket && packetFresh(b.meiPacket, world, profile) && !paired.has(b.id)
    );
    if (ready.length < 2) break;

    if (profile.fusBeaconEnabled) {
      ready = [...ready].sort((a, b) => a.meiPacket.atTick - b.meiPacket.atTick);
    }

    for (let i = 0; i < ready.length && pairsDone < maxPairs; i++) {
      const a = ready[i];
      if (paired.has(a.id)) continue;

      const candidates = sortByAffinity(
        ready.filter((b) => b.id !== a.id && !paired.has(b.id)),
        a,
        profile
      );

      for (const b of candidates) {
        if (pairsDone >= maxPairs) break;
        if (a.code !== b.code && profile.fusSameCodeOnly) continue;
        if (pairOnCooldown(world, profile, a.id, b.id)) continue;

        const result = spawnFusionOffspring(world, recorder, a, b);
        if (!result) continue;

        markPairCooldown(world, a.id, b.id);
        paired.add(a.id);
        paired.add(b.id);
        pairsDone++;
        pairedThisPass = true;
        events.push({ aId: a.id, bId: b.id, childId: result.child.id, liveDonor: false, orphan: false });
        break;
      }
    }
    if (!pairedThisPass) break;
  }
}

function pairLiveDonors(world, recorder, profile, paired, events) {
  if (!profile.fusLiveDonorEnabled) return;

  let holders = world.beings.filter(
    (b) => b.alive && b.meiPacket && packetFresh(b.meiPacket, world, profile) && !paired.has(b.id)
  );
  if (profile.fusBeaconEnabled) {
    holders = [...holders].sort((a, b) => a.meiPacket.atTick - b.meiPacket.atTick);
  }

  for (const holder of holders) {
    if (paired.has(holder.id)) continue;
    const donors = sortDonorsBySubCapacity(
      holder,
      sortByAffinity(
        world.beings.filter(
          (b) => b.alive && !b.meiPacket && !paired.has(b.id) && hasDonorReplicationBudget(b, profile)
        ),
        holder,
        profile
      ),
      profile
    );

    for (const donor of donors) {
      if (paired.has(donor.id) || holder.id === donor.id) continue;
      if (pairOnCooldown(world, profile, holder.id, donor.id)) continue;

      const result = tryLiveDonorFusion(world, recorder, holder, donor);
      if (!result) continue;

      markPairCooldown(world, holder.id, donor.id);
      paired.add(holder.id);
      paired.add(donor.id);
      events.push({ aId: holder.id, bId: donor.id, childId: result.child.id, liveDonor: true, orphan: false });
      if (!profile.fusAggressivePairing) break;
    }
  }
}

function pairOrphanPool(world, recorder, profile, paired, events) {
  if (!profile.fusOrphanPoolEnabled || !world.orphanPackets?.length) return;

  const remaining = [];
  for (const orphan of world.orphanPackets) {
    if (!packetFresh(orphan, world, profile)) continue;

    const anchor = { socialSlot: orphan.socialSlot };
    const donors = sortByAffinity(
      world.beings.filter(
        (b) => b.alive && !paired.has(b.id) && hasDonorReplicationBudget(b, profile)
      ),
      anchor,
      profile
    );

    let fused = false;
    for (const donor of donors) {
      if (pairOnCooldown(world, profile, orphan.fromId, donor.id)) continue;
      const result = tryOrphanFusion(world, recorder, orphan, donor);
      if (!result) continue;

      markPairCooldown(world, orphan.fromId, donor.id);
      paired.add(donor.id);
      events.push({
        aId: orphan.fromId,
        bId: donor.id,
        childId: result.child.id,
        liveDonor: true,
        orphan: true,
      });
      fused = true;
      if (!profile.fusAggressivePairing) break;
    }
    if (!fused) remaining.push(orphan);
  }
  world.orphanPackets = remaining;
}

/** 双体 meiPacket 汇合；live-donor；孤儿池；信标优先 */
export function processFusions(world, recorder) {
  const profile = world.envProfile;
  if (!fusEnabled(profile) || !replicationEnabled(profile)) return [];

  if (profile.fusIntraSubPlgEnabled) {
    for (const being of world.beings) {
      if (being.alive) tryIntraSubunitPlg(world, recorder, being, profile);
    }
  }

  const events = [];
  const paired = new Set();

  pairAllPackets(world, recorder, profile, paired, events);
  pairLiveDonors(world, recorder, profile, paired, events);
  pairOrphanPool(world, recorder, profile, paired, events);

  return events;
}

/** 种群 DNA 序列唯一数（田野多样性指标） */
export function dnaDiversity(beings) {
  const alive = beings.filter((b) => b.alive);
  const unique = new Set(alive.map((b) => b.dna.sequence));
  return { uniqueSeqs: unique.size, population: alive.length };
}
