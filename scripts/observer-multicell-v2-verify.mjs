#!/usr/bin/env node
/**
 * 多细胞 v2 — 逻辑细胞、幼体门控、族谱 UI
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { FIELD_MED_TICKS } from './lib/field-cohort.js';
import { LIFE_STAGE_ADT, LIFE_STAGE_JUV } from '../src/world/multicell-v2.js';
import { LOGIC_CELL_MAX_PER_TYPE } from '../src/world/logic-cell-types.js';
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
assert(b0.logicCells?.['LOG-BRN']?.length >= 1, '逻辑脑细胞已初始化');
assert(b0.skinMembrane?.code === 'MBR-SKN', '皮肤膜存在');
assert(b0.lifeStage === LIFE_STAGE_JUV, '出生为幼体');

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const juvMei = world.beings.some((b) => b.tickCount < 96 && b.meiCount > 0);
assert(!juvMei, '幼体 tick 内无减数（生殖未成熟）');

const adult = world.beings.find((b) => b.alive && b.lifeStage === LIFE_STAGE_ADT);
assert(adult, '存在成体');

for (const b of world.beings.filter((x) => x.alive)) {
  for (const cells of Object.values(b.logicCells ?? {})) {
    assert(cells.length <= LOGIC_CELL_MAX_PER_TYPE, `逻辑细胞≤8（${cells.length}）`);
  }
}

const bonds = recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'BOND');
assert(bonds.length > 0, `伴侣登记 [BOND]（${bonds.length}）`);

const model = buildGenealogyModel(world);
assert(model.nodes.length >= 4, '族谱节点');

assert(getObserverEnvId() === 'multicell_v2_world', '默认环境 multicell_v2_world');

if (failed) process.exit(1);
console.log('\n✓ 多细胞 v2 验证通过');
