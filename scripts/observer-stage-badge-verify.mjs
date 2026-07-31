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
import { buildHealthReport } from '../src/world/health-report.js';
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
const adultSnap = buildHealthReport(adult, 0, { adult: true, world, stage: '成体' });
assert(adultSnap.dnaInterpret?.positions?.length === 96, '成体 96 位 DNA 解读');
assert(adultSnap.vitals?.common?.hormones?.length === 5, '成体含激素指标');
assert(adultSnap.vitals?.sperm?.stocked === true, '成体雄含精子备货');
const female = cohort.find((b) => b.pairMorph === 'B');
const femaleSnap = buildHealthReport(female, 0, { adult: true, world, stage: '成体' });
assert(femaleSnap?.vitals?.egg?.stocked === true, '成体雌含卵细胞备货');
assert(femaleSnap?.vitals?.egg?.oocyteQuality > 0, '卵母细胞质量');
assert(adultSnap.vitals?.common?.nutrition?.registerMean > 0, '营养储备指标');

const interp = interpretFullDna(adult.dna.sequence, adult.id);
assert(interp.zones.length === 6, 'Z1–Z6 区段');
assert(interp.positions.every((p) => p.meaning), '每位点有释义');

const infant = { alive: true, independent: false, weaned: false, lifeStage: 'JUV', pairMorph: 'B' };
assert(genealogyStageBadge(infant)?.code === STAGE_BADGE_INFANT, '哺乳幼体标 婴');
assert(!isDisplayPregnant(infant), '婴不标孕');

const juv = { alive: true, independent: true, weaned: true, lifeStage: 'JUV', devStage: 'JUV', pairMorph: 'A' };
assert(genealogyStageBadge(juv)?.code === STAGE_BADGE_JUV, '断奶幼体标 幼');

const juvSnap = buildHealthReport(juv, 0, { stage: '幼', world });
assert(juvSnap.dnaInterpret, '幼体 DNA 解读');

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
