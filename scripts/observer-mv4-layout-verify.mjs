#!/usr/bin/env node
/**
 * MV4 — 观察台布局：族谱 vs 经典单细胞卡片
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { buildDashboardStats } from '../src/ui/stats.js';
import {
  LAYOUT_CLASSIC,
  LAYOUT_GENEALOGY,
  shouldShowGenealogyPanel,
  setObserverLayoutMode,
} from '../src/ui/observer-layout.js';
import { multicellV2Observer } from '../src/world/multicell-v2.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-MV4');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();

assert(multicellV2Observer(world.envProfile), 'multicell v2 观察模式');

spawnBeing(world, recorder, { name: 'a', code: '001', pairMorph: 'A' });
spawnBeing(world, recorder, { name: 'b', code: '002', pairMorph: 'B' });
stepWorld(world, recorder);

const stats = buildDashboardStats(world, recorder);
assert(stats.world.multicellV2Observer === true, 'stats 含 multicellV2Observer');
assert(stats.beings.every((b) => b.organismType === 'multicell'), '经典卡片数据含 multicell');
assert(stats.beings.some((b) => b.devStage != null), 'stats 含 devStage');

assert(
  shouldShowGenealogyPanel(world.envProfile, LAYOUT_GENEALOGY),
  '默认族谱布局'
);
assert(
  !shouldShowGenealogyPanel(world.envProfile, LAYOUT_CLASSIC),
  '经典布局隐藏族谱'
);
assert(
  !shouldShowGenealogyPanel({ multicellV2Enabled: false }, LAYOUT_GENEALOGY),
  '非 v2 环境无族谱面板'
);

setObserverLayoutMode(LAYOUT_CLASSIC);
assert(shouldShowGenealogyPanel(world.envProfile, LAYOUT_CLASSIC) === false, '持久化经典模式');
setObserverLayoutMode(LAYOUT_GENEALOGY);

if (failed) process.exit(1);
console.log('\n✓ MV4 观察台布局切换验收通过');
