#!/usr/bin/env node
/**
 * 繁殖求偶门控 — 亲属阻断、伴侣阻断、孕妇阻断、8 成体开局、伴侣通道合胞
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { spawnAdultMulticellCohort, initAdultWeanedBeing } from '../src/birth/adult-cohort.js';
import { issueAdultHealthReport } from '../src/world/health-report.js';
import {
  canMaleCourtFemale,
  canSendCourtship,
  isPregnant,
} from '../src/world/courtship-gate.js';
import { cohortKinBlocked, isReproKinBlocked } from '../src/world/kinship-gate.js';
import {
  registerPairSpeechPRQ,
  registerPairSpeechPGR,
  processPartnerChannelFus,
  processPairGestation,
  processPairFusFromField,
  releaseFieldHalves,
  initDockedHalf,
} from '../src/world/pair-repro.js';
import { COURTSHIP_PRQ_PROB_BY_MORPH } from '../src/world/substantive-signal.js';
import { formatBeingDisplayName } from '../src/world/being-names.js';
import {
  initAdultMatingStructures,
  STR_PAIR_IN,
  STR_PAIR_OUT,
} from '../src/world/body-structures.js';
import { buildGenealogyModel } from '../src/ui/genealogy-tree.js';
import { courtshipBondLineForCouple } from '../src/world/being-names.js';
import { LIFE_STAGE_ADT } from '../src/world/multicell-v2.js';
import { LOGIC_CELL_MAX_PER_TYPE } from '../src/world/logic-cell-types.js';
import { displayLogicCellTypes } from '../src/world/logic-cell-display.js';

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

function waiveReproGates(world, beings = []) {
  world.courtshipGraceUntilTick = 0;
  for (const b of beings) {
    b.courtshipEligibleAtTick = 0;
    b.partnerFusEligibleAtTick = 0;
  }
}

const world = createWorld('M-COURT');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();

assert(world.envProfile?.pairPartnerChannelFus === true, 'pairPartnerChannelFus 启用');
assert(COURTSHIP_PRQ_PROB_BY_MORPH.A === 0.9, '雄求偶 PRQ 概率 90%');
assert(COURTSHIP_PRQ_PROB_BY_MORPH.B === 0.1, '雌求偶 PRQ 概率 10%');

const cohort = spawnAdultMulticellCohort(world, recorder, { males: 4, females: 4 });
waiveReproGates(world, cohort);
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
  cohort.every((b) => b.healthReport?.dnaFp),
  '成体均有体检报告'
);
for (const b of cohort) {
  for (const t of displayLogicCellTypes()) {
    const n = b.logicCells?.[t.code]?.length ?? 0;
    assert(n === LOGIC_CELL_MAX_PER_TYPE, `${b.code} ${t.code} 满格 ${n}`);
  }
}
assert(
  cohort.every((b) => b.familyName && b.givenName),
  '成体均有姓与名'
);
assert(
  cohort.every((b) => b.lineageHeadId === b.id),
  '开局各自为谱系头'
);
assert(
  cohort.every((b) => formatBeingDisplayName(b) === `${b.familyName}·${b.givenName}`),
  '显示名格式为姓·名'
);
assert(
  cohort.every((b) => {
    return cohort.every((o) => b.id === o.id || !cohortKinBlocked(b, o, world.envProfile));
  }),
  '开局 8 人无近亲血缘'
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
assert(prq.healthReport?.dnaFp, 'PRQ 附带体检报告');
const pgr = registerPairSpeechPGR(world, recorder, female, male.id);
assert(pgr, '雌可 PGR 成为伴侣');
assert(male.partnerId === female.id, '伴侣登记');
assert(female.lineageHeadId === male.lineageHeadId, '雄求偶成功后雌并入雄谱系');
assert(male.bondCourtshipInitiatorMorph === 'A', '雄为求偶发起方');
assert(male.bondCourtshipInitiatorId === male.id, '求偶发起方记录为雄 id');
assert(male.lineageHeadId === male.id, '雄仍为谱系头');
assert(
  courtshipBondLineForCouple(male, female)?.includes(male.familyName),
  '求偶文案含发起雄姓名'
);
assert(!canSendCourtship(male, world), '有伴侣雄不发送求偶');
assert(!canSendCourtship(female, world), '有伴侣雌不发送求偶');

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
waiveReproGates(wKin, wKin.beings);
assert(isReproKinBlocked(dad, child, wKin.envProfile), '父↔子阻断');
assert(isReproKinBlocked(mom, child, wKin.envProfile), '母↔子阻断');
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
if (!female.dockedHalf) initDockedHalf(world, female);
waiveReproGates(world, [male, female]);
const fus = processPartnerChannelFus(world, recorder);
assert(fus.length > 0, '伴侣通道合胞 PARTNER-FUS');
assert(isPregnant(female), '合胞后标记孕妇');
assert(!female.bodyStructures[STR_PAIR_IN].open, '孕期关闭 STR-PAIR-IN');

female.syncyte.gestationUntilTick = world.tick;
const gest = processPairGestation(world, recorder);
assert(gest.length > 0, '到期外排子代');
const gestChild = world.beings.find((b) => b.id === gest[0].childId);
assert(gestChild, '子代存在');
assert(gestChild.familyName === male.familyName, '雄求偶子代姓氏随父');
assert(gestChild.lineageHeadId === male.lineageHeadId, '子代谱系随父系');

const blocks = recorder.entries.filter((e) => e.meta?.kind === 'PRQ-BLOCK');
assert(blocks.some((e) => e.meta?.reason === 'female-partner'), 'PRQ-BLOCK female-partner 记录');

// 雌向雄求偶
const wFem = createWorld('M-FPRQ');
applyEnvProfile(wFem, 'multicell_v2_world');
initEnvStackModules(wFem);
const recFem = new Recorder();
const cohortF = spawnAdultMulticellCohort(wFem, recFem, { males: 2, females: 2 });
waiveReproGates(wFem, cohortF);
const fem = cohortF.find((b) => b.pairMorph === 'B');
const mal = cohortF.find((b) => b.pairMorph === 'A');
initAdultMatingStructures(mal, wFem.envProfile, 0);
initAdultMatingStructures(fem, wFem.envProfile, 0);
pinChannels(mal, STR_PAIR_OUT, 7);
pinChannels(fem, STR_PAIR_IN, 7);
const fPrq = registerPairSpeechPRQ(wFem, recFem, fem, mal.id);
assert(fPrq?.fromMorph === 'B', '雌可向雄 PRQ');
const mPgr = registerPairSpeechPGR(wFem, recFem, mal, fem.id);
assert(mPgr, '雄回应雌 PGR');
assert(mal.lineageHeadId === fem.lineageHeadId, '雌求偶成功后雄并入雌谱系');
assert(mal.bondCourtshipInitiatorMorph === 'B', '雌为求偶发起方');

pinChannels(mal, STR_PAIR_OUT, 7);
pinChannels(fem, STR_PAIR_IN, 7);
waiveReproGates(wFem, [mal, fem]);
const fusFem = processPartnerChannelFus(wFem, recFem);
assert(fusFem.length > 0, '雌发起伴侣通道合胞');
fem.syncyte.gestationUntilTick = wFem.tick;
const gestFem = processPairGestation(wFem, recFem);
assert(gestFem.length > 0, '雌谱系外排子代');
const femChild = wFem.beings.find((b) => b.id === gestFem[0].childId);
assert(femChild?.familyName === fem.familyName, '雌求偶子代姓氏随母');
assert(femChild?.lineageHeadId === fem.lineageHeadId, '子代谱系随母系');

// DNA 血缘：同胞阻断求偶；克隆 DNA 在 PGR 时被忽略
const wDna = createWorld('M-DNA');
applyEnvProfile(wDna, 'multicell_v2_world');
initEnvStackModules(wDna);
const recDna = new Recorder();
const { being: sibA } = spawnBeing(wDna, recDna, { name: 'sa', code: 'SA1', pairMorph: 'A' });
const { being: sibB } = spawnBeing(wDna, recDna, { name: 'sb', code: 'SB1', pairMorph: 'B' });
initAdultWeanedBeing(sibA, wDna, wDna.envProfile);
initAdultWeanedBeing(sibB, wDna, wDna.envProfile);
sibA.pairParentA = 'P1';
sibA.pairParentB = 'P2';
sibB.pairParentA = 'P1';
sibB.pairParentB = 'P2';
initAdultMatingStructures(sibA, wDna.envProfile, 0);
initAdultMatingStructures(sibB, wDna.envProfile, 0);
pinChannels(sibA, STR_PAIR_OUT, 7);
pinChannels(sibB, STR_PAIR_IN, 7);
waiveReproGates(wDna, [sibA, sibB]);
assert(!registerPairSpeechPRQ(wDna, recDna, sibA, sibB.id), '同胞 PRQ 阻断');
assert(
  recDna.entries.some((e) => e.meta?.kind === 'PRQ-BLOCK' && e.meta?.reason === 'kin'),
  '同胞 PRQ-BLOCK kin'
);

const { being: cloneA } = spawnBeing(wDna, recDna, { name: 'ca', code: 'CA1', pairMorph: 'A' });
const { being: cloneB } = spawnBeing(wDna, recDna, { name: 'cb', code: 'CB1', pairMorph: 'B' });
initAdultWeanedBeing(cloneA, wDna, wDna.envProfile);
initAdultWeanedBeing(cloneB, wDna, wDna.envProfile);
cloneB.dna.sequence = cloneA.dna.sequence;
issueAdultHealthReport(cloneB, 0);
initAdultMatingStructures(cloneA, wDna.envProfile, 0);
initAdultMatingStructures(cloneB, wDna.envProfile, 0);
pinChannels(cloneA, STR_PAIR_OUT, 7);
pinChannels(cloneB, STR_PAIR_IN, 7);
waiveReproGates(wDna, [cloneA, cloneB]);
const clonePrq = registerPairSpeechPRQ(wDna, recDna, cloneA, cloneB.id);
assert(!clonePrq, '克隆 DNA PRQ 阻断');
assert(
  recDna.entries.some(
    (e) =>
      e.meta?.kind === 'PRQ-IGNORE' ||
      (e.meta?.kind === 'PRQ-BLOCK' && e.meta?.reason === 'kin')
  ),
  '克隆/近亲 PRQ-IGNORE 或 PRQ-BLOCK'
);

// 无伴侣不得场合胞怀孕
const wFld = createWorld('M-FLD');
applyEnvProfile(wFld, 'multicell_v2_world');
initEnvStackModules(wFld);
const recFld = new Recorder();
const cohortFld = spawnAdultMulticellCohort(wFld, recFld, { males: 2, females: 2 });
waiveReproGates(wFld, cohortFld);
const maleFld = cohortFld.find((b) => b.pairMorph === 'A');
const femaleFld = cohortFld.find((b) => b.pairMorph === 'B');
const female2 = cohortFld.find((b) => b.pairMorph === 'B' && b.id !== femaleFld.id);
initAdultMatingStructures(maleFld, wFld.envProfile, 0);
initAdultMatingStructures(femaleFld, wFld.envProfile, 0);
pinChannels(maleFld, STR_PAIR_OUT, 7);
pinChannels(femaleFld, STR_PAIR_IN, 7);
pinChannels(female2, STR_PAIR_IN, 7);
wFld.fieldHalves = [
  {
    id: 'test-half',
    seq: maleFld.meiPacket.seq,
    fromId: maleFld.id,
    socialSlot: maleFld.socialSlot ?? 'S0',
    grantFrom: femaleFld.id,
    atTick: 0,
    expireTick: 100,
    channelIdx: 7,
  },
];
const fieldFusUnbonded = processPairFusFromField(wFld, recFld);
assert(fieldFusUnbonded.length === 0, '未结伴雌不接受场合胞');
assert(!isPregnant(female2), '无伴侣雌不因场半态怀孕');
assert(!isPregnant(femaleFld), '未登记伴侣的雌不因场半态怀孕');
const prqFld = registerPairSpeechPRQ(wFld, recFld, maleFld, femaleFld.id);
const pgrFld = registerPairSpeechPGR(wFld, recFld, femaleFld, maleFld.id);
assert(prqFld && pgrFld, '场测试前完成结伴');
waiveReproGates(wFld, [maleFld, femaleFld]);
maleFld.pairGrantFrom = femaleFld.id;
releaseFieldHalves(wFld, recFld);
const fieldFusBonded = processPairFusFromField(wFld, recFld);
assert(fieldFusBonded.length === 0, '伴侣通道模式下场合胞不取代体内合胞');
assert(!isPregnant(femaleFld), '场合胞未在伴侣通道前怀孕');
const fusBond = processPartnerChannelFus(wFld, recFld);
assert(fusBond.length > 0, '伴侣通道合胞受孕');
assert(isPregnant(femaleFld), '结伴后伴侣通道方可怀孕');

if (failed) {
  console.error(`observer-repro-courtship-verify: ${failed} failed`);
  process.exit(1);
}
console.log('observer-repro-courtship-verify: all passed');
