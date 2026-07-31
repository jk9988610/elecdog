#!/usr/bin/env node
/**
 * 多代繁殖田野 — 全同胞 / 半同胞 / 远亲 DNA 相似度与阻断（含 3+ 代）
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
  isParentChildId,
  kinshipRelationLabel,
  KINSHIP_LABEL_HALF,
  KINSHIP_LABEL_NONE,
  KINSHIP_LABEL_PARENT,
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
  promoteToAdultRepro,
  waiveReproGates,
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

function labelCounts(pairs) {
  const counts = {};
  for (const { label } of pairs) {
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return counts;
}

function collectKinPairs(beings, profile) {
  const rows = [];
  for (let i = 0; i < beings.length; i++) {
    for (let j = i + 1; j < beings.length; j++) {
      const a = beings[i];
      const b = beings[j];
      rows.push({
        a: a.code ?? a.id,
        b: b.code ?? b.id,
        label: kinshipRelationLabel(a, b, profile),
        sim: dnaSequenceSimilarity(a.dna.sequence, b.dna.sequence),
      });
    }
  }
  return rows;
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

assert(bondPair(world, recorder, male2, female1), '雄2雌1 结伴');
resetPairForNextBirth(world, male2, female1, profile);
world.tick += 8;
const child4 = birthChild(world, recorder, male2, female1);
assert(child4, '第四胎（同母半同胞）');
assert(isHalfSibling(child1, child4), 'child1↔child4 同母半同胞');
assert(!isHalfSibling(child3, child4), 'child3↔child4 无共同父母');

const unrelated = male2;
const fullSim = dnaSequenceSimilarity(child1.dna.sequence, child2.dna.sequence);
const halfSim = dnaSequenceSimilarity(child1.dna.sequence, child3.dna.sequence);
const distantSim = dnaSequenceSimilarity(child1.dna.sequence, unrelated.dna.sequence);

console.log('\n— 代际相似度 —');
console.log(`  全同胞: ${(fullSim * 100).toFixed(1)}%`);
console.log(`  半同胞: ${(halfSim * 100).toFixed(1)}%`);
console.log(`  远亲(雄2): ${(distantSim * 100).toFixed(1)}%`);

const g1Male = [child1, child2, child3, child4].find(
  (b) =>
    b.pairMorph === 'A' &&
    b.pairParentA !== female2.id &&
    b.pairParentB !== female2.id
);
assert(g1Male, 'G1 有可繁殖雄体（非雌2之子）');
promoteToAdultRepro(g1Male, world);
promoteToAdultRepro(female2, world);
male1.partnerId = null;
female2.partnerId = null;
resetPairForNextBirth(world, g1Male, female2, profile);
waiveReproGates(world, world.beings);
assert(bondPair(world, recorder, g1Male, female2), 'G1雄 + 雌2 结伴');
resetPairForNextBirth(world, g1Male, female2, profile);
world.tick += 8;
const child5 = birthChild(world, recorder, g1Male, female2);
assert(child5, 'G2 子代');
assert(isParentChildId(g1Male, child5), 'G1 为 G2 之父');
assert(isHalfSibling(child5, child3), 'G2 与 child3 同母半同胞');
assert(cohortPairKinBlocked(g1Male, child5, profile), '父母子女阻断');

const g1Children = [child1, child2, child3, child4];
const kinPairs = collectKinPairs(g1Children, profile);
const counts = labelCounts(kinPairs);
console.log('\n— G1 血缘对分布 —');
for (const [label, n] of Object.entries(counts).sort()) {
  console.log(`  ${label}: ${n}`);
}
assert(counts['同胞'] >= 1, 'G1 含全同胞对');
assert(counts['半同胞'] >= 2, 'G1 含半同胞对');
assert(
  kinPairs.some((p) => p.label === KINSHIP_LABEL_NONE),
  'G1 含无血缘对'
);

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
  unrelatedZoneMax[zone] = Math.max(
    unrelatedZoneMax[zone],
    zoneSequenceSimilarity(child3.dna.sequence, child4.dna.sequence, zone)
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
assert(kinshipRelationLabel(child1, child2, profile) !== KINSHIP_LABEL_NONE, '全同胞有血缘标签');
assert(kinshipRelationLabel(child1, unrelated, profile) === KINSHIP_LABEL_NONE, '远亲无血缘');
assert(
  kinshipRelationLabel(child3, child4, profile) === KINSHIP_LABEL_NONE,
  'child3↔child4 无 ID 血缘'
);
assert(
  kinshipRelationLabel(g1Male, child5, profile) === KINSHIP_LABEL_PARENT,
  'G1↔G2 父母子女标签'
);

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
