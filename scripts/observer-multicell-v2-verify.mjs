#!/usr/bin/env node
/**
 * 多细胞 v2 — 发育链 MV1a：STEM、MIT/DIFF、四段生命史
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  LIFE_STAGE_ADT,
  LIFE_STAGE_JUV,
} from '../src/world/multicell-v2.js';
import {
  LOGIC_CELL_MAX_PER_TYPE,
  STEM_CELL_CODE,
  STEM_CELL_MAX,
  LIFE_STAGE_GEST,
} from '../src/world/logic-cell-types.js';
import { buildGenealogyModel } from '../src/ui/genealogy-tree.js';
import { getObserverEnvId } from '../src/ui/env-select.js';
import {
  initGestationalUmbilical,
  UMB_STRUCTURE_CODE,
} from '../src/world/umbilical.js';
import {
  assessPairStructureFit,
  initAdultMatingStructures,
  STR_PAIR_OUT,
  STR_PAIR_IN,
} from '../src/world/body-structures.js';
import { applyNurtureAtBirth } from '../src/world/nurture.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

/** 观察子确定性：强制体表结构共享至少一条通道 */
function pinSharedChannels(being, structCode, channel) {
  const st = being?.bodyStructures?.[structCode];
  if (st) st.channels = [channel];
}

const world = createWorld('M-MV2');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();

assert(world.envProfile?.multicellV2Enabled === true, 'multicell v2 启用');

for (let i = 0; i < 4; i++) {
  spawnBeing(world, recorder, {
    name: `mv2${i}`,
    code: String(i + 1).padStart(3, '0'),
    pairMorph: i % 2 === 0 ? 'A' : 'B',
  });
}

const b0 = world.beings[0];
const stemBirth = b0.logicCells?.[STEM_CELL_CODE]?.length ?? 0;
assert(stemBirth >= 2, `出生为干细胞池（STEM=${stemBirth}）`);
assert(!b0.logicCells?.['LOG-BRN']?.length, '出生无已分化脑细胞');
assert(b0.skinMembrane?.code === 'MBR-SKN', '皮肤膜存在');
assert(b0.devStage === LIFE_STAGE_JUV, '排出/诞生即为婴幼儿 JUV（无体外胚胎窗）');

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const mit = recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'MIT');
const diff = recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'DIFF');
const celLog = recorder.entries.filter((e) => e.channel === 'cell' && e.meta?.kind === 'CEL-LOG');

assert(mit.length > 0, `[MIT] 体内有丝（${mit.length}）`);
assert(diff.length > 0, `[DIFF] 分化（${diff.length}）`);
assert(celLog.length > 0, `[CEL] 逻辑计数迹（${celLog.length}）`);

const juvMei = world.beings.some((b) => b.tickCount < 96 && b.meiCount > 0);
assert(!juvMei, '幼体 tick 内无减数（生殖未成熟）');

const adult = world.beings.find((b) => b.alive && b.lifeStage === LIFE_STAGE_ADT);
assert(adult, '存在成体');

const hadJuv = world.beings.some((b) => b.devStage === LIFE_STAGE_JUV || b.juvDiffTicks > 0);
assert(hadJuv, '经历婴幼儿发育与分化');

const differentiated = world.beings.some(
  (b) => b.alive && (b.logicCells?.['LOG-DIG']?.length > 0 || b.logicCells?.['LOG-MOT']?.length > 0)
);
assert(differentiated, '存在分化后逻辑细胞（DIG/MOT）');

const celWithEnv = recorder.entries.filter(
  (e) => e.channel === 'cell' && e.meta?.kind === 'CEL-LOG' && e.meta?.envCoupling
);
assert(celWithEnv.length > 0, `CEL 含环境耦合字段（${celWithEnv.length}）`);

for (const b of world.beings.filter((x) => x.alive)) {
  const stems = b.logicCells?.[STEM_CELL_CODE]?.length ?? 0;
  assert(stems <= STEM_CELL_MAX, `STEM≤${STEM_CELL_MAX}（${stems}）`);
  for (const t of ['LOG-BRN', 'LOG-DIG', 'LOG-MOT', 'LOG-NRV']) {
    const n = b.logicCells?.[t]?.length ?? 0;
    assert(n <= LOGIC_CELL_MAX_PER_TYPE, `${t}≤8（${n}）`);
  }
}

const bonds = recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'BOND');
assert(bonds.length > 0, `伴侣登记 [BOND]（${bonds.length}）`);

const model = buildGenealogyModel(world);
assert(model.nodes.length >= 4, '族谱节点');

assert(getObserverEnvId() === 'multicell_v2_world', '默认环境 multicell_v2_world');

// MV1b — 宫内脐带
const wU = createWorld('M-UMB');
applyEnvProfile(wU, 'multicell_v2_world');
initEnvStackModules(wU);
const recU = new Recorder();
spawnBeing(wU, recU, { name: 'ua', code: '001', pairMorph: 'A' });
spawnBeing(wU, recU, { name: 'ub', code: '002', pairMorph: 'B' });
const carrier = wU.beings.find((b) => b.pairMorph === 'B');
const parentA = wU.beings.find((b) => b.pairMorph === 'A');
carrier.syncyte = {
  dnaSeq: parentA.dna.sequence,
  registers: Array.from({ length: 8 }, () => 0.45),
  gestationUntilTick: wU.tick + 40,
  parentAId: parentA.id,
};
initGestationalUmbilical(carrier, wU.envProfile, 0);
carrier.logicCells['LOG-UMB'] = [
  { id: `${carrier.id.slice(-6)}:LOG-UMB:0`, code: 'LOG-UMB', atTick: 0 },
];
assert(carrier.bodyStructures?.[UMB_STRUCTURE_CODE]?.open, 'STR-UMB 结构已挂接');
assert(carrier.devStage === LIFE_STAGE_GEST, '合胞载体为 GEST');
for (let i = 0; i < 20; i++) stepWorld(wU, recU);
const umb = recU.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'UMB');
assert(umb.length > 0, `[UMB] 宫内脐带通量（${umb.length}）`);

// MV6 — 交配结构与哺乳接触
const wS = createWorld('M-STR');
applyEnvProfile(wS, 'multicell_v2_world');
initEnvStackModules(wS);
const recS = new Recorder();
spawnBeing(wS, recS, { name: 'sa', code: '001', pairMorph: 'A' });
spawnBeing(wS, recS, { name: 'sb', code: '002', pairMorph: 'B' });
const morphA = wS.beings.find((b) => b.pairMorph === 'A');
const morphB = wS.beings.find((b) => b.pairMorph === 'B');
morphA.tickCount = 100;
morphB.tickCount = 100;
morphA.lifeStage = LIFE_STAGE_ADT;
morphB.lifeStage = LIFE_STAGE_ADT;
morphA.devStage = LIFE_STAGE_ADT;
morphB.devStage = LIFE_STAGE_ADT;
initAdultMatingStructures(morphA, wS.envProfile, 0);
initAdultMatingStructures(morphB, wS.envProfile, 0);
pinSharedChannels(morphA, STR_PAIR_OUT, 7);
pinSharedChannels(morphB, STR_PAIR_IN, 7);
assert(morphA.bodyStructures?.[STR_PAIR_OUT]?.open, 'STR-PAIR-OUT 成体 A');
assert(morphB.bodyStructures?.[STR_PAIR_IN]?.open, 'STR-PAIR-IN 成体 B');
const fit = assessPairStructureFit(morphA, morphB, wS.envProfile);
assert(fit.fit, `PAIR 结构匹配 overlap=${fit.overlap}`);

spawnBeing(wS, recS, { name: 'sc', code: '003', pairMorph: 'B' });
const infant = wS.beings.find((b) => b.name === 'sc');
applyNurtureAtBirth(wS, morphB, infant);
pinSharedChannels(morphB, 'STR-LACT-OUT', 7);
pinSharedChannels(infant, 'STR-ING-IN', 7);
assert(morphB.bodyStructures?.['STR-LACT-OUT']?.open, 'STR-LACT-OUT');
assert(infant.bodyStructures?.['STR-ING-IN']?.open, 'STR-ING-IN');
for (let i = 0; i < 12; i++) stepWorld(wS, recS);
const lac = recS.entries.filter((e) => e.meta?.kind === 'LAC');
assert(lac.length > 0, `[LAC] 接触哺乳（${lac.length}）`);

if (failed) process.exit(1);
console.log('\n✓ 多细胞 v2 MV1a/MV1b/MV6 验证通过');
