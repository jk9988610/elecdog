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
  LIFE_STAGE_EMB,
  LIFE_STAGE_JUV,
} from '../src/world/multicell-v2.js';
import {
  LOGIC_CELL_MAX_PER_TYPE,
  STEM_CELL_CODE,
  STEM_CELL_MAX,
} from '../src/world/logic-cell-types.js';
import { buildGenealogyModel } from '../src/ui/genealogy-tree.js';
import { getObserverEnvId } from '../src/ui/env-select.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
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
assert(b0.devStage === LIFE_STAGE_EMB, '出生为体外胚胎 EMB');

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

const hadEmb = world.beings.some((b) => b.devStage === LIFE_STAGE_EMB || b.juvDiffTicks > 0);
const hadJuv = world.beings.some((b) => b.devStage === LIFE_STAGE_JUV || b.tickCount >= 48);
assert(hadEmb || hadJuv, '经历胚胎/婴幼儿发育阶段');

const differentiated = world.beings.some(
  (b) => b.alive && (b.logicCells?.['LOG-DIG']?.length > 0 || b.logicCells?.['LOG-MOT']?.length > 0)
);
assert(differentiated, '存在分化后逻辑细胞（DIG/MOT）');

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

if (failed) process.exit(1);
console.log('\n✓ 多细胞 v2 MV1a 发育链验证通过');
