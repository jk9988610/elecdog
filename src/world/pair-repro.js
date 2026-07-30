// GAP-PAIR-0 — 体内合胞、宫内通量、外排与依赖期（不设配子/性别/通道名）

import { hashString, mulberry32 } from '../core/hash.js';
import { reduceDna, recombineDna, mutate } from '../core/dna.js';
import { birthIntoWorld } from '../birth/spawn.js';
import { applyNurtureAtBirth } from './nurture.js';
import { replicationEnabled } from './replication.js';
import { meiEnabled } from './recombination.js';
import { applyEhuLineageEcho } from './electronic-human-profile.js';
import { applyMemLineageEcho } from './lineage-memory.js';
import { applySemLineageEcho } from './sem-lineage.js';
import { slotIndex, SLOT_COUNT } from './social.js';

function substrateAvg(world) {
  const ch = world.substrate?.channels;
  if (!ch?.length) return 0;
  return ch.reduce((a, b) => a + b, 0) / ch.length;
}

export function pairReproEnabled(profile) {
  return profile?.pairReproEnabled === true;
}

export function pairFusInBodyEnabled(profile) {
  return pairReproEnabled(profile) && profile?.pairFusInBody === true;
}

/** PAIR-1：半态排入环境场，体内不直接合胞 */
export function pairHalfReleaseEnabled(profile) {
  return pairFusInBodyEnabled(profile) && profile?.pairHalfRelease === true;
}

export function ensureFieldHalves(world) {
  if (!world.fieldHalves) world.fieldHalves = [];
}

function dnaDockBias(being) {
  return mulberry32(hashString(`${being.dna.sequence}:${being.id}:dock`))();
}

/** 形态 B 激素门控：寄存器均值 − 场耦合 */
export function pairGateH(being, world) {
  const profile = world.envProfile ?? {};
  const rMean = being.registers.reduce((a, b) => a + b, 0) / being.registers.length;
  const eMean = substrateAvg(world);
  return +(rMean - eMean * (profile.pairGateFieldWeight ?? 0.35)).toFixed(4);
}

export function pairGateOpen(being, world) {
  const profile = world.envProfile ?? {};
  return pairGateH(being, world) > (profile.pairGateMin ?? 0.08);
}

/** 出生时为形态 B 预置驻留半态（singleton） */
export function initDockedHalf(world, being) {
  const profile = world.envProfile ?? {};
  if (!pairReproEnabled(profile) || being.pairMorph !== 'B') return null;
  if (being.dockedHalf) return being.dockedHalf;
  const seed = hashString(`${being.id}:${world.tick}:dock-init`);
  being.dockedHalf = { seq: reduceDna(being.dna.sequence, seed), atTick: world.tick, init: true };
  return being.dockedHalf;
}

/** 形态 B 补全驻留半态（至多 1 个） */
export function tryDockedHalf(world, recorder, being, { stress = 0, integrity = 1 } = {}) {
  const profile = world.envProfile;
  if (!pairFusInBodyEnabled(profile) || !meiEnabled(profile) || !being.alive) return null;
  if (being.pairMorph !== 'B' || being.syncyte) return null;
  if (being.dockedHalf || being.independent === false) return null;
  if (!replicationEnabled(profile)) return null;

  if (being.tickCount < (profile.meiMinAge ?? 40)) return null;
  if (stress > (profile.meiMaxStress ?? 0.26)) return null;
  if (integrity != null && integrity < (profile.meiMinIntegrity ?? 0.5)) return null;
  if (substrateAvg(world) < (profile.meiMinSubstrate ?? 0.44)) return null;

  const cooldown = profile.dockCooldown ?? profile.meiCooldown ?? 80;
  const since = world.tick - (being.lastDockTick ?? -cooldown);
  if (since < cooldown) return null;

  const bias = dnaDockBias(being);
  const prob = Math.min(0.75, (profile.dockBaseProb ?? 0.32) + bias * 0.28);
  const roll = mulberry32(hashString(`${being.id}:${world.tick}:dock`))();
  if (roll > prob) return null;

  const seed = hashString(`${being.id}:${world.tick}:dock-reduce`);
  const seq = reduceDna(being.dna.sequence, seed);
  being.dockedHalf = { seq, atTick: world.tick };
  being.lastDockTick = world.tick;
  being.dockCount = (being.dockCount ?? 0) + 1;

  recorder.evolution(world.tick, being.id, `[DCK] half len ${seq.length}`, {
    kind: 'DCK',
    packetLen: seq.length,
    pairMorph: 'B',
  });
  return { seq };
}

function slotDistance(a, b) {
  const ia = slotIndex(a?.socialSlot ?? 'S0');
  const ib = slotIndex(b?.socialSlot ?? 'S0');
  const d = Math.abs(ia - ib);
  return Math.min(d, SLOT_COUNT - d);
}

function resolveParentA(world, half, fallbackB) {
  const found = world.beings.find((b) => b.id === half.fromId);
  if (found) return found;
  return {
    id: half.fromId,
    name: 'A',
    code: fallbackB.code,
    registers: fallbackB.registers,
    generation: 0,
  };
}

/** 形态 A 将体内半态排入环境场（singleton / 源） */
export function releaseFieldHalves(world, recorder) {
  if (!pairHalfReleaseEnabled(world.envProfile)) return [];
  ensureFieldHalves(world);
  const profile = world.envProfile ?? {};
  const maxAge = profile.pairFieldHalfMaxAge ?? 96;
  const events = [];

  for (const a of world.beings.filter((b) => b.alive && b.pairMorph === 'A' && b.meiPacket)) {
    world.fieldHalves = world.fieldHalves.filter((h) => h.fromId !== a.id);
    const half = {
      id: `${a.id}:${world.tick}`,
      seq: a.meiPacket.seq,
      fromId: a.id,
      socialSlot: a.socialSlot ?? 'S0',
      atTick: world.tick,
      expireTick: world.tick + maxAge,
    };
    world.fieldHalves.push(half);
    a.meiPacket = null;
    a.fieldReleaseCount = (a.fieldReleaseCount ?? 0) + 1;
    recorder.evolution(world.tick, a.id, `[FLD] release len ${half.seq.length}`, {
      kind: 'FLD',
      packetLen: half.seq.length,
      expireTick: half.expireTick,
    });
    events.push(half);
  }
  return events;
}

export function decayFieldHalves(world) {
  if (!pairHalfReleaseEnabled(world.envProfile)) return 0;
  ensureFieldHalves(world);
  const before = world.fieldHalves.length;
  const tick = world.tick;
  world.fieldHalves = world.fieldHalves.filter((h) => h.expireTick > tick);
  return before - world.fieldHalves.length;
}

/** PAIR-1：环境半态 + B 驻留半态 → 体内合胞 */
export function processPairFusFromField(world, recorder) {
  const profile = world.envProfile;
  if (!pairHalfReleaseEnabled(profile)) return [];

  ensureFieldHalves(world);
  const morphB = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'B' && b.dockedHalf && !b.syncyte
  );
  if (!morphB.length || !world.fieldHalves.length) return [];

  const events = [];
  const usedHalves = new Set();
  const usedB = new Set();

  for (const b of morphB) {
    if (usedB.has(b.id) || !pairGateOpen(b, world)) continue;
    const candidates = world.fieldHalves
      .filter((h) => !usedHalves.has(h.id))
      .sort((x, y) => {
        const ax = { socialSlot: x.socialSlot };
        const ay = { socialSlot: y.socialSlot };
        return slotDistance(ax, b) - slotDistance(ay, b);
      });
    if (!candidates.length) continue;

    const half = candidates[0];
    const parentA = resolveParentA(world, half, b);
    createSyncyteOnB(world, recorder, parentA, b, half.seq, b.dockedHalf.seq);
    usedHalves.add(half.id);
    usedB.add(b.id);
    b.fieldPickupCount = (b.fieldPickupCount ?? 0) + 1;
    recorder.evolution(world.tick, b.id, `[FLD-IN] ${half.fromId} → syncyte`, {
      kind: 'FLD-IN',
      fromId: half.fromId,
      halfId: half.id,
    });
    events.push({ type: 'FLD-IN', aId: half.fromId, bId: b.id, halfId: half.id });
  }

  world.fieldHalves = world.fieldHalves.filter((h) => !usedHalves.has(h.id));
  return events;
}

function avgRegisters(a, b) {
  const n = Math.min(a.length, b.length);
  return Array.from({ length: n }, (_, i) => +((a[i] + b[i]) * 0.5).toFixed(4));
}

function createSyncyteOnB(world, recorder, parentA, parentB, seqA, seqB) {
  const profile = world.envProfile ?? {};
  const gestationTicks = profile.gestationTicks ?? profile.nurtureTicks ?? 80;
  const seed = hashString(`${parentA.id}:${parentB.id}:${world.tick}:pair-fus`);
  const combined = recombineDna(seqA, seqB, seed);
  const rate = profile.fusionMutationRate ?? 0.015;
  const { seq, mutationCount } = mutate(combined, rate, seed + 1);

  parentB.syncyte = {
    dnaSeq: seq,
    registers: avgRegisters(parentA.registers, parentB.registers),
    gestationUntilTick: world.tick + gestationTicks,
    parentAId: parentA.id,
    atTick: world.tick,
    mutationCount,
  };

  parentA.meiPacket = null;
  parentB.dockedHalf = null;
  parentA.pairFusCount = (parentA.pairFusCount ?? 0) + 1;
  parentB.pairFusCount = (parentB.pairFusCount ?? 0) + 1;

  recorder.evolution(
    world.tick,
    parentB.id,
    `[FUS-IN] ${parentA.id} → syncyte mut ${mutationCount}`,
    {
      kind: 'FUS-IN',
      parentA: parentA.id,
      parentB: parentB.id,
      mutationCount,
      gestationTicks,
    }
  );
  return parentB.syncyte;
}

function tickEmbFlux(world, recorder, carrier, syncyte) {
  const profile = world.envProfile ?? {};
  const frac = profile.embFluxFrac ?? 0.018;
  const transfers = [];
  for (let i = 0; i < carrier.registers.length; i++) {
    const grant = Math.min(carrier.registers[i], frac);
    if (grant <= 0.0001) continue;
    carrier.registers[i] = Math.max(0, carrier.registers[i] - grant);
    syncyte.registers[i] = Math.max(0, Math.min(1, syncyte.registers[i] + grant));
    transfers.push({ idx: i, amount: grant });
  }
  if (transfers.length) {
    recorder.evolution(world.tick, carrier.id, `[EMB] flux ${transfers.length}ch`, {
      kind: 'EMB',
      transfers: transfers.length,
      gestLeft: syncyte.gestationUntilTick - world.tick,
    });
  }
  return transfers;
}

function expelSyncyte(world, recorder, carrier) {
  const profile = world.envProfile ?? {};
  const syncyte = carrier.syncyte;
  if (!syncyte?.dnaSeq) return null;

  const maxPop = profile.fusionMaxPop ?? profile.fissionMaxPop ?? 36;
  if (world.beings.filter((b) => b.alive).length >= maxPop) return null;

  const born = birthIntoWorld(world, recorder, {
    name: `${carrier.name.slice(0, 2)}嗣`,
    code: carrier.code,
    dnaSequence: syncyte.dnaSeq,
  });
  const child = born.being;
  child.generation = Math.max(carrier.generation ?? 0, 1) + 1;
  child.registers = [...syncyte.registers];
  child.pairParentA = syncyte.parentAId;
  child.pairParentB = carrier.id;
  child.bornAtTick = world.tick;
  child.recombined = true;

  applyEhuLineageEcho(world, recorder, child, [carrier], profile);
  applyMemLineageEcho(world, recorder, child, [carrier], profile, { via: 'PAIR-EXP' });
  applySemLineageEcho(world, recorder, child, [carrier], profile, { via: 'PAIR-EXP' });

  const nurture = applyNurtureAtBirth(world, carrier, child);
  carrier.syncyte = null;
  carrier.expelCount = (carrier.expelCount ?? 0) + 1;

  recorder.evolution(world.tick, carrier.id, `[EXP] → ${child.id} gen ${child.generation}`, {
    kind: 'EXP',
    childId: child.id,
    generation: child.generation,
    nurture: nurture.mode,
  });
  return { child, nurture };
}

/** 宫内通量 + 到期外排 */
export function processPairGestation(world, recorder) {
  if (!pairFusInBodyEnabled(world.envProfile)) return [];
  const events = [];
  for (const being of world.beings) {
    if (!being.alive || !being.syncyte) continue;
    tickEmbFlux(world, recorder, being, being.syncyte);
    if (world.tick >= being.syncyte.gestationUntilTick) {
      const exp = expelSyncyte(world, recorder, being);
      if (exp) events.push({ type: 'EXP', carrierId: being.id, childId: exp.child.id });
    }
  }
  return events;
}

/** 无握手：形态 A 半态 + 形态 B 驻留半态 → B 体内合胞（PAIR-0 体内直连） */
export function processPairFusInBody(world, recorder) {
  const profile = world.envProfile;
  if (!pairFusInBodyEnabled(profile) || pairHalfReleaseEnabled(profile)) return [];

  const morphA = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'A' && b.meiPacket && !b.syncyte
  );
  const morphB = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'B' && b.dockedHalf && !b.syncyte
  );
  if (!morphA.length || !morphB.length) return [];

  const events = [];
  const usedB = new Set();

  for (const a of morphA) {
    const candidates = morphB.filter((b) => !usedB.has(b.id) && pairGateOpen(b, world));
    if (!candidates.length) continue;
    const b = candidates[0];
    createSyncyteOnB(world, recorder, a, b, a.meiPacket.seq, b.dockedHalf.seq);
    usedB.add(b.id);
    events.push({ type: 'FUS-IN', aId: a.id, bId: b.id });
  }
  return events;
}

/** tick 末尾：衰减 → 排入场 → 宫内发育 → 合胞 */
export function processPairReproduction(world, recorder) {
  if (!pairReproEnabled(world.envProfile)) {
    return { gestation: [], fusIn: [], fieldRelease: [], fieldFus: [] };
  }
  decayFieldHalves(world);
  const fieldRelease = releaseFieldHalves(world, recorder);
  const gestation = processPairGestation(world, recorder);
  const fieldFus = processPairFusFromField(world, recorder);
  const fusIn = processPairFusInBody(world, recorder);
  return { gestation, fusIn, fieldRelease, fieldFus };
}
