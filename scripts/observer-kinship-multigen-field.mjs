#!/usr/bin/env node
/**
 * 多代繁殖田野 — 全同胞 / 半同胞 / 远亲 DNA 相似度与阻断
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnAdultMulticellCohort } from '../src/birth/adult-cohort.js';
import {
  dnaSequenceSimilarity,
  isDnaKinBlocked,
  isFullSibling,
  isHalfSibling,
  kinshipRelationLabel,
  KINSHIP_LABEL_HALF,
  zoneSequenceSimilarity,
  applyKinshipZoneTuning,
  suggestKinshipZoneBlockSim,
  cohortPairKinBlocked,
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

const world = createWorld('M-MULTIGEN');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const profile = world.envProfile;
const recorder = new Recorder();

const cohort = spawnAdultMulticellCohort(world, recorder, { males: 2, females: 2 });
const male1 = cohort.find((b) => b.pairMorph === 'A' && b.code === 'M01');
const male2 = cohort.find((b) => b.pairMorph === 'A' && b.code === 'M02');
const female1 = cohort.find((b) => b.pairMorph === 'B' && b.code === 'F01');
const female2 = cohort.find((b) => b.pairMorph === 'B' && b.code === 'F02');

assert(bondPair(world, recorder, male1, female1), '雄1雌1 结伴');
const child1 = birthChild(world, recorder, male1, female1);
assert(child1, '第一胎');
resetPairForNextBirth(world, male1, female1, profile);
world.tick += 8;
const child2 = birthChild(world, recorder, male1, female1);
assert(child2, '第二胎（全同胞）');
assert(isFullSibling(child1, child2), '全同胞');

assert(bondPair(world, recorder, male1, female2), '雄1雌2 结伴');
resetPairForNextBirth(world, male1, female2, profile);
world.tick += 8;
const child3 = birthChild(world, recorder, male1, female2);
assert(child3, '第三胎（半同胞）');
assert(isHalfSibling(child1, child3), '半同胞');
assert(!isFullSibling(child1, child3), '非全同胞');

const unrelated = male2;
const fullSim = dnaSequenceSimilarity(child1.dna.sequence, child2.dna.sequence);
const halfSim = dnaSequenceSimilarity(child1.dna.sequence, child3.dna.sequence);
const distantSim = dnaSequenceSimilarity(child1.dna.sequence, unrelated.dna.sequence);

console.log('\n— 代际相似度 —');
console.log(`  全同胞: ${(fullSim * 100).toFixed(1)}%`);
console.log(`  半同胞: ${(halfSim * 100).toFixed(1)}%`);
console.log(`  远亲(雄2): ${(distantSim * 100).toFixed(1)}%`);

const zoneKeys = Object.keys(DNA_ZONES);
const siblingZoneMax = { overall: fullSim };
const unrelatedZoneMax = { overall: distantSim };
for (const zone of zoneKeys) {
  siblingZoneMax[zone] = zoneSequenceSimilarity(child1.dna.sequence, child2.dna.sequence, zone);
  unrelatedZoneMax[zone] = Math.max(
    unrelatedZoneMax[zone] ?? 0,
    zoneSequenceSimilarity(child1.dna.sequence, unrelated.dna.sequence, zone)
  );
  unrelatedZoneMax[zone] = Math.max(
    unrelatedZoneMax[zone],
    zoneSequenceSimilarity(child1.dna.sequence, child3.dna.sequence, zone)
  );
}

const suggestion = suggestKinshipZoneBlockSim(profile, {
  siblingZoneMax,
  unrelatedZoneMax,
});
const tuned = applyKinshipZoneTuning(profile, suggestion);
assert(tuned.applied, '田野建议写入 profile');
assert(profile.kinshipZoneTuningApplied, 'profile 标记 tuning');

assert(isDnaKinBlocked(child1, child2, profile), '全同胞 DNA 阻断');
assert(isHalfSibling(child1, child3), '半同胞关系');
assert(cohortPairKinBlocked(child1, child3, profile), '半同胞 ID 血缘阻断');
assert(!isDnaKinBlocked(child1, child3, profile), '半同胞 DNA 相似度低于阈（靠 ID 阻断）');
assert(kinshipRelationLabel(child1, child3, profile) === KINSHIP_LABEL_HALF, '半同胞血缘标签');
assert(!isDnaKinBlocked(child1, unrelated, profile), '远亲成体不阻断');
assert(kinshipRelationLabel(child1, child2, profile) !== '无血缘', '全同胞有血缘标签');
assert(kinshipRelationLabel(child1, unrelated, profile) === '无血缘', '远亲无血缘');

console.log('\n— 应用后阈值 —');
console.log(`  全局: ${(profile.kinshipDnaBlockSim * 100).toFixed(0)}%`);
for (const zone of zoneKeys) {
  console.log(`  ${zone}: ${(profile.kinshipZoneBlockSim[zone] * 100).toFixed(0)}%`);
}

if (failed) {
  console.error(`observer-kinship-multigen-field: ${failed} failed`);
  process.exit(1);
}
console.log('\nobserver-kinship-multigen-field: all passed');
