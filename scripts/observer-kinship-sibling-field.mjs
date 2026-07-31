#!/usr/bin/env node
/**
 * 多代繁殖田野 — 同胞区段相似度与 Z 区阻断阈值建议
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnAdultMulticellCohort } from '../src/birth/adult-cohort.js';
import {
  dnaSequenceSimilarity,
  isFullSibling,
  isDnaKinBlocked,
  kinshipDnaBlockSim,
  kinshipZoneBlockSim,
  suggestKinshipZoneBlockSim,
  zoneSequenceSimilarity,
} from '../src/genetics/dna-kinship.js';
import { DNA_ZONES } from '../src/genetics/dna-express.js';
import {
  bondPair,
  birthChild,
  resetPairForNextBirth,
} from './lib/kinship-repro-helpers.mjs';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-SIB-FIELD');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const profile = world.envProfile;
const recorder = new Recorder();

const cohort = spawnAdultMulticellCohort(world, recorder, { males: 1, females: 1 });
const male = cohort.find((b) => b.pairMorph === 'A');
const female = cohort.find((b) => b.pairMorph === 'B');

assert(bondPair(world, recorder, male, female), '雄雌结伴');

const child1 = birthChild(world, recorder, male, female);
assert(child1, '第一胎外排');
resetPairForNextBirth(world, male, female, profile);
world.tick += 8;
const child2 = birthChild(world, recorder, male, female);
assert(child2, '第二胎外排');
assert(isFullSibling(child1, child2), '两胎为同胞');
assert(child1.pairParentA === child2.pairParentA, '同父');
assert(child1.pairParentB === child2.pairParentB, '同母');

const siblingOverall = dnaSequenceSimilarity(child1.dna.sequence, child2.dna.sequence);
console.log(`\n— 同胞全序列相似度 ${(siblingOverall * 100).toFixed(1)}% —`);

const siblingZoneMax = { overall: siblingOverall };
const unrelatedZoneMax = { overall: 0 };
const zoneKeys = Object.keys(DNA_ZONES);

for (const zone of zoneKeys) {
  const sim = zoneSequenceSimilarity(child1.dna.sequence, child2.dna.sequence, zone);
  siblingZoneMax[zone] = sim;
  console.log(`  同胞 ${zone}: ${(sim * 100).toFixed(1)}%`);
}

const unrelated = cohort.find((b) => b.id !== male.id && b.id !== female.id) ?? male;
for (const zone of zoneKeys) {
  const sim = zoneSequenceSimilarity(child1.dna.sequence, unrelated.dna.sequence, zone);
  unrelatedZoneMax[zone] = Math.max(unrelatedZoneMax[zone] ?? 0, sim);
}
const unrelatedOverall = dnaSequenceSimilarity(child1.dna.sequence, unrelated.dna.sequence);
unrelatedZoneMax.overall = unrelatedOverall;

const suggestion = suggestKinshipZoneBlockSim(profile, {
  siblingZoneMax,
  unrelatedZoneMax,
  padding: 0.02,
});

console.log('\n— 当前阈值 —');
for (const zone of zoneKeys) {
  console.log(`  ${zone}: ${(kinshipZoneBlockSim(profile, zone) * 100).toFixed(0)}%`);
}

console.log('\n— 建议阈值（田野样本） —');
console.log(`  全局: ${(suggestion.global * 100).toFixed(0)}%`);
for (const zone of zoneKeys) {
  console.log(`  ${zone}: ${(suggestion.zones[zone] * 100).toFixed(0)}%`);
}

assert(isDnaKinBlocked(child1, child2, profile), '同胞 DNA 高相似应阻断');
assert(siblingOverall >= kinshipDnaBlockSim(profile), '同胞样本超现行全局阈');
assert(suggestion.zones.Z3 >= kinshipZoneBlockSim(profile, 'Z3'), '建议 Z3 不低于现行');

if (failed) {
  console.error(`observer-kinship-sibling-field: ${failed} failed`);
  process.exit(1);
}
console.log('\nobserver-kinship-sibling-field: all passed');
