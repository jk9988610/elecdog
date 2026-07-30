// 存活分裂 — DNA 偏置 + 富足场门控；亲代不 END（不设有丝/减数名称表）

import { hashString, mulberry32 } from '../core/hash.js';
import { mutate } from '../core/dna.js';
import { birthIntoWorld } from '../birth/spawn.js';
import { applyFissionReplication, hasFissReplicationBudget } from './replication.js';
import { recordReproductionPathEvent, reproductionProfileEnabled } from './reproduction-profile.js';
import { applyEhuLineageEcho } from './electronic-human-profile.js';
import { applySocialKnowledgeInheritance } from './social-knowledge.js';
import { applyMemLineageEcho } from './lineage-memory.js';
import { applySemLineageEcho } from './sem-lineage.js';
import { beingUsesEcoFiss } from './eco-repro.js';
import { juvenileFissBoost, multicellV2Enabled } from './multicell-v2.js';

/** 种群层 FISS（诞生新 being）— 多细胞 v2 仅体内 MIT + 交配分娩 */
export function populationFissionEnabled(profile) {
  if (multicellV2Enabled(profile)) {
    return false;
  }
  return profile?.fissionEnabled === true;
}

export function dnaFissionParams(being) {
  const rng = mulberry32(hashString(`${being.dna.sequence}:${being.id}:fiss`));
  const bias = rng();
  return {
    bias,
    cooldownAdj: Math.floor(bias * 28),
    stressCeilAdj: 0.1 * (1 - bias),
  };
}

export function substrateFertility(channels) {
  if (!channels?.length) return { avg: 0, min: 0 };
  const avg = channels.reduce((a, b) => a + b, 0) / channels.length;
  const min = Math.min(...channels);
  return { avg: +avg.toFixed(4), min: +min.toFixed(4) };
}

export function fissionEnabled(profile) {
  return populationFissionEnabled(profile);
}

/** 富足场 + 低场压 + 膜完整 + DNA 偏置 → 可分裂 */
export function fissionGate(world, being, { stress, integrity }) {
  const profile = world.envProfile;
  if (!fissionEnabled(profile) || !being.alive) return null;
  if (being.independent === false) return null;

  const ecoFiss = beingUsesEcoFiss(being, profile);

  const maxPop = profile.fissionMaxPop ?? 64;
  const aliveCount = world.beings.filter((b) => b.alive).length;
  if (aliveCount >= maxPop) return null;

  const fert = substrateFertility(world.substrate?.channels);
  const dna = dnaFissionParams(being);
  const baseCooldown = profile.fissionCooldown ?? 40;
  const cooldown = Math.max(18, baseCooldown - dna.cooldownAdj);
  const since = world.tick - (being.lastFissionTick ?? being.bornAtTick ?? 0);

  if (being.tickCount < (profile.fissionMinAge ?? 28)) return null;
  if (since < cooldown) return null;
  if (fert.avg < (profile.fissionMinSubstrate ?? 0.42)) return null;
  if (fert.min < (profile.fissionMinSubstrate ?? 0.42) * 0.72) return null;
  if (stress > (profile.fissionMaxStress ?? 0.25) + dna.stressCeilAdj) return null;
  if (integrity != null && integrity < (profile.fissionMinIntegrity ?? 0.5)) return null;
  if (being.lowStreak > 0) return null;
  if (!ecoFiss && !hasFissReplicationBudget(being, profile)) return null;

  const baseProb = profile.fissionBaseProb ?? 0.4;
  const juvBoost = juvenileFissBoost(being, world, profile);
  const eagerP = Math.min(0.95, baseProb + dna.bias * 0.4 + juvBoost);
  const roll = mulberry32(hashString(`${being.id}:${world.tick}:fissroll`))();
  if (roll > eagerP) return null;

  return { fert, dna, cooldown, eagerP, since, ecoFiss: Boolean(ecoFiss) };
}

export function spawnFissionOffspring(world, recorder, parent, gate) {
  const profile = world.envProfile ?? {};
  const maxPop = profile.fissionMaxPop ?? 64;
  if (world.beings.filter((b) => b.alive).length >= maxPop) return null;

  const rate = profile.fissionMutationRate ?? 0.012;
  const seed = hashString(`${parent.id}:${world.tick}:fission`);
  const { seq, mutationCount } = mutate(parent.dna.sequence, rate, seed);

  const born = birthIntoWorld(world, recorder, {
    name: `${parent.name.slice(0, 5)}裂`,
    code: parent.code,
    dnaSequence: seq,
  });

  born.being.generation = (parent.generation ?? 0) + 1;
  born.being.fissionParent = parent.id;
  born.being.fissionLine = parent.fissionLine ?? parent.id;
  born.being.bornAtTick = world.tick;

  parent.lastFissionTick = world.tick;
  parent.fissionCount = (parent.fissionCount ?? 0) + 1;
  if (reproductionProfileEnabled(world.envProfile)) {
    recordReproductionPathEvent(parent, 'FISS_PARENT');
  }

  applyFissionReplication(world, recorder, parent, born.being);
  applyEhuLineageEcho(world, recorder, born.being, [parent], world.envProfile);
  applySocialKnowledgeInheritance(world, recorder, born.being, [parent], world.envProfile, {
    via: 'FISS',
  });
  applyMemLineageEcho(world, recorder, born.being, [parent], world.envProfile, { via: 'FISS' });
  applySemLineageEcho(world, recorder, born.being, [parent], world.envProfile, { via: 'FISS' });

  const retain = profile.fissionRegisterRetain ?? 0.82;
  for (let i = 0; i < parent.registers.length; i++) {
    parent.registers[i] = Math.max(0, parent.registers[i] * retain);
  }

  recorder.evolution(world.tick, parent.id, `[FISS] ${born.id} mut${mutationCount} ē${gate.fert.avg}`, {
    kind: 'FISS',
    parentId: parent.id,
    childId: born.id,
    mutationCount,
    generation: born.being.generation,
    substrateAvg: gate.fert.avg,
    substrateMin: gate.fert.min,
    dnaBias: +gate.dna.bias.toFixed(4),
    eagerP: +gate.eagerP.toFixed(4),
    stressCeil: (profile.fissionMaxStress ?? 0.25) + gate.dna.stressCeilAdj,
    ecoFiss: Boolean(gate.ecoFiss),
  });

  return born;
}
