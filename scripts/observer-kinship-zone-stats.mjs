#!/usr/bin/env node
/**
 * Z 区近亲阻断阈值 — 田野对照统计（同胞 vs 随机对区段相似度）
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { spawnAdultMulticellCohort } from '../src/birth/adult-cohort.js';
import { Recorder } from '../src/recorder/logger.js';
import {
  dnaKinBlockTriggers,
  dnaSequenceSimilarity,
  isDnaKinBlocked,
  kinshipDnaBlockSim,
  kinshipZoneBlockSim,
  zoneSequenceSimilarity,
} from '../src/genetics/dna-kinship.js';
import { DNA_ZONES } from '../src/genetics/dna-express.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-KIN-Z');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const profile = world.envProfile;

const recorder = new Recorder();
const cohort = spawnAdultMulticellCohort(world, recorder, { males: 4, females: 4 });
const a = cohort[0];
const b = cohort[1];
const unrelated = cohort[7];

const siblingSim = dnaSequenceSimilarity(a.dna.sequence, b.dna.sequence);
assert(siblingSim < kinshipDnaBlockSim(profile), `开局随机对全序列 ${(siblingSim * 100).toFixed(1)}% < 全局阈`);

const cloneA = { id: 'c1', dna: { sequence: a.dna.sequence } };
const cloneB = { id: 'c2', dna: { sequence: a.dna.sequence } };
assert(isDnaKinBlocked(cloneA, cloneB, profile), '同序列阻断');

const zoneKeys = Object.keys(DNA_ZONES);
console.log('\n— Z 区阈值与随机对相似度 —');
for (const zone of zoneKeys) {
  const sim = zoneSequenceSimilarity(a.dna.sequence, unrelated.dna.sequence, zone);
  const thresh = kinshipZoneBlockSim(profile, zone);
  const hit = sim >= thresh;
  console.log(
    `  ${zone} (${DNA_ZONES[zone].tag}): sim=${(sim * 100).toFixed(1)}% thresh=${(thresh * 100).toFixed(0)}% ${hit ? '⚡' : ''}`
  );
}

const triggers = dnaKinBlockTriggers(cloneA, cloneB, profile);
assert(triggers.some((t) => t.scope === 'overall'), '克隆触发全序列阈');

console.log('\n— 字段 tuning 提示 —');
console.log(`  全局 kinshipDnaBlockSim: ${(kinshipDnaBlockSim(profile) * 100).toFixed(0)}%`);
for (const zone of zoneKeys) {
  console.log(`  ${zone}: ${(kinshipZoneBlockSim(profile, zone) * 100).toFixed(0)}%`);
}

if (failed) {
  console.error(`observer-kinship-zone-stats: ${failed} failed`);
  process.exit(1);
}
console.log('\nobserver-kinship-zone-stats: all passed');
