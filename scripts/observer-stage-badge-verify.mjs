#!/usr/bin/env node
/** 阶段徽章 + DNA 解读 + 体检报告 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { spawnAdultMulticellCohort } from '../src/birth/adult-cohort.js';
import { Recorder } from '../src/recorder/logger.js';
import {
  genealogyStageBadge,
  isDisplayPregnant,
  STAGE_BADGE_ADULT,
  STAGE_BADGE_INFANT,
  STAGE_BADGE_JUV,
} from '../src/world/genealogy-stage.js';
import { interpretFullDna } from '../src/genetics/dna-interpret.js';
import { issueHealthReport } from '../src/world/health-report.js';
import { LIFE_STAGE_ADT } from '../src/world/multicell-v2.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-STAGE');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();
const cohort = spawnAdultMulticellCohort(world, recorder, { males: 1, females: 1 });
const adult = cohort[0];
assert(genealogyStageBadge(adult)?.code === STAGE_BADGE_ADULT, '成体标 成');
assert(adult.healthReport?.dnaInterpret?.positions?.length === 96, '成体体检 96 位解读');

const interp = interpretFullDna(adult.dna.sequence, adult.id);
assert(interp.zones.length === 6, 'Z1–Z6 区段');
assert(interp.positions.every((p) => p.meaning), '每位点有释义');

const infant = { alive: true, independent: false, weaned: false, lifeStage: 'JUV', pairMorph: 'B' };
assert(genealogyStageBadge(infant)?.code === STAGE_BADGE_INFANT, '哺乳幼体标 婴');
assert(!isDisplayPregnant(infant), '婴不标孕');

const juv = { alive: true, independent: true, weaned: true, lifeStage: 'JUV', devStage: 'JUV', pairMorph: 'A' };
assert(genealogyStageBadge(juv)?.code === STAGE_BADGE_JUV, '断奶幼体标 幼');

issueHealthReport(juv, 0, { stage: '幼' });
assert(juv.healthReport?.dnaInterpret, '幼体体检含解读');

const preg = {
  alive: true,
  pairMorph: 'B',
  lifeStage: LIFE_STAGE_ADT,
  syncyte: { dnaSeq: '0', registers: [], gestationUntilTick: 99 },
  independent: true,
  adultAtTick: 0,
};
assert(isDisplayPregnant(preg), '成体孕雌标孕');
assert(genealogyStageBadge(preg)?.code === '孕', '徽章 孕');

if (failed) process.exit(1);
console.log('stage-badge-health-verify: all passed');
