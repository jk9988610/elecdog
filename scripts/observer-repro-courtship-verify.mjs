#!/usr/bin/env node
/**
 * 繁殖求偶门控 — 亲属阻断、伴侣阻断、孕妇阻断、8 成体开局、伴侣通道合胞
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { spawnAdultMulticellCohort, initAdultWeanedBeing } from '../src/birth/adult-cohort.js';
import {
  canMaleCourtFemale,
  isPregnant,
} from '../src/world/courtship-gate.js';
import { isReproKinBlocked } from '../src/world/kinship-gate.js';
import {
  registerPairSpeechPRQ,
  registerPairSpeechPGR,
  processPartnerChannelFus,
  initDockedHalf,
} from '../src/world/pair-repro.js';
import {
  initAdultMatingStructures,
  STR_PAIR_IN,
  STR_PAIR_OUT,
} from '../src/world/body-structures.js';
import { buildGenealogyModel } from '../src/ui/genealogy-tree.js';
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

function pinChannels(being, code, ch) {
  const st = being?.bodyStructures?.[code];
  if (st) st.channels = [ch];
}

const world = createWorld('M-COURT');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();

assert(world.envProfile?.pairPartnerChannelFus === true, 'pairPartnerChannelFus 启用');

const cohort = spawnAdultMulticellCohort(world, recorder, { males: 4, females: 4 });
assert(cohort.length === 8, '8 成体队列');
assert(
  cohort.filter((b) => b.pairMorph === 'A').length === 4,
  '4 雄'
);
assert(
  cohort.filter((b) => b.pairMorph === 'B').length === 4,
  '4 雌'
);
assert(
  cohort.every((b) => b.weaned && b.lifeStage === LIFE_STAGE_ADT),
  '均为断奶成体'
);
assert(
  cohort.filter((b) => b.pairMorph === 'A').every((b) => b.meiPacket?.seq),
  '雄有成体精子'
);
assert(
  cohort.filter((b) => b.pairMorph === 'B').every((b) => b.dockedHalf?.seq),
  '雌有成体卵子'
);

const model = buildGenealogyModel(world);
assert(model.nodes.length >= 8, `族谱≥8 节点（${model.nodes.length}）`);

const male = cohort.find((b) => b.pairMorph === 'A');
const female = cohort.find((b) => b.pairMorph === 'B');
initAdultMatingStructures(male, world.envProfile, 0);
initAdultMatingStructures(female, world.envProfile, 0);
pinChannels(male, STR_PAIR_OUT, 7);
pinChannels(female, STR_PAIR_IN, 7);

const prq = registerPairSpeechPRQ(world, recorder, male, female.id);
assert(prq, '成体雄可向雌 PRQ');
const pgr = registerPairSpeechPGR(world, recorder, female, male.id);
assert(pgr, '雌可 PGR 成为伴侣');
assert(male.partnerId === female.id, '伴侣登记');

// 另一雄不能向已有伴侣的雌求偶
const male2 = cohort.find((b) => b.pairMorph === 'A' && b.id !== male.id);
const blockPartner = canMaleCourtFemale(male2, female, world);
assert(!blockPartner.ok && blockPartner.reason === 'female-partner', '阻断：雌已有伴侣');
assert(!registerPairSpeechPRQ(world, recorder, male2, female.id), 'PRQ 被阻断（雌有伴侣）');

// 孕妇阻断
female.syncyte = {
  dnaSeq: male.dna.sequence,
  registers: Array.from({ length: 8 }, () => 0.5),
  gestationUntilTick: world.tick + 40,
  parentAId: male.id,
};
female.pregnant = true;
female.bodyStructures[STR_PAIR_IN].open = false;
assert(isPregnant(female), '孕妇标记');
const blockPreg = canMaleCourtFemale(male2, female, world);
assert(!blockPreg.ok, '阻断：孕妇');

// 亲属阻断
const wKin = createWorld('M-KIN');
applyEnvProfile(wKin, 'multicell_v2_world');
initEnvStackModules(wKin);
const recKin = new Recorder();
const { being: dad } = spawnBeing(wKin, recKin, { name: 'dad', code: 'D01', pairMorph: 'A' });
const { being: mom } = spawnBeing(wKin, recKin, { name: 'mom', code: 'F01', pairMorph: 'B' });
initAdultWeanedBeing(dad, wKin, wKin.envProfile);
initAdultWeanedBeing(mom, wKin, wKin.envProfile);
const { being: child } = spawnBeing(wKin, recKin, {
  name: 'son',
  code: 'S01',
  pairMorph: 'A',
});
child.pairParentA = dad.id;
child.pairParentB = mom.id;
initAdultWeanedBeing(child, wKin, wKin.envProfile);
assert(isReproKinBlocked(dad, child), '父↔子阻断');
assert(isReproKinBlocked(mom, child), '母↔子阻断');
assert(!canMaleCourtFemale(child, mom, wKin).ok, '子不能向母求偶');
registerPairSpeechPRQ(wKin, recKin, child, mom.id);
assert(
  recKin.entries.some((e) => e.meta?.kind === 'PRQ-BLOCK' && e.meta?.reason === 'kin'),
  'PRQ-BLOCK kin 记录'
);

// 伴侣通道合胞
female.syncyte = null;
female.pregnant = false;
female.bodyStructures[STR_PAIR_IN].open = true;
female.bodyStructures[STR_PAIR_IN].pregnancyClosed = false;
if (!female.dockedHalf) initDockedHalf(wKin, female);
const fus = processPartnerChannelFus(world, recorder);
assert(fus.length > 0, '伴侣通道合胞 PARTNER-FUS');
assert(isPregnant(female), '合胞后标记孕妇');
assert(!female.bodyStructures[STR_PAIR_IN].open, '孕期关闭 STR-PAIR-IN');

const blocks = recorder.entries.filter((e) => e.meta?.kind === 'PRQ-BLOCK');
assert(blocks.some((e) => e.meta?.reason === 'female-partner'), 'PRQ-BLOCK female-partner 记录');
assert(blocks.some((e) => e.meta?.reason === 'kin'), 'PRQ-BLOCK kin 记录');

if (failed) {
  console.error(`observer-repro-courtship-verify: ${failed} failed`);
  process.exit(1);
}
console.log('observer-repro-courtship-verify: all passed');
