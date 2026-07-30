#!/usr/bin/env node
/**
 * Phase 135 — 观察台 WL-R 繁殖载荷域面板 + CODEX 联动验证
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { buildQuadChainCohort, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { buildWlReproStackSummary } from '../src/ui/wl-repro-stack.js';
import { buildSemStackSummary } from '../src/ui/sem-stack.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-00-WLR');
applyEnvProfile(world, 'observer_wlr_stack');
initEnvStackModules(world);
const recorder = new Recorder();

for (const spec of buildQuadChainCohort(0)) {
  spawnBeing(world, recorder, spec);
}

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const wlr = buildWlReproStackSummary(world, recorder);
const sem = buildSemStackSummary(world, recorder);

assert(wlr.anyEnabled, 'WL-R 域标记已启用');
assert(wlr.enabled.reproLin, 'semReproLineage 已启用');
assert(wlr.enabled.fourCouple, 'semFourDomainCouple 已启用');
assert(sem.anyEnabled, 'SEM 栈并存');
assert(wlr.semTotal > 0, `域标记下有 SEM 配对（${wlr.semTotal}）`);
assert(wlr.coreR >= 0, 'CORE-R 计数可读');

const panelSrc = readFileSync(new URL('../src/ui/wl-repro-stack.js', import.meta.url), 'utf8');
assert(panelSrc.includes('wl-repro-stack-panel'), 'WL-R 面板已定义');
assert(panelSrc.includes('data-codex-entry'), 'CODEX 联动按钮');

const codexSrc = readFileSync(new URL('../src/ui/codex.js', import.meta.url), 'utf8');
assert(codexSrc.includes('openEntry'), '辞典 openEntry API');

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('renderWlReproStackPanel'), '观察台已挂载 WL-R 面板');
assert(observerSrc.includes('data-codex-entry'), '观察台绑定 CODEX 跳转');

const codex = readFileSync(new URL('../docs/CODEX.md', import.meta.url), 'utf8');
assert(codex.includes('## 繁殖载荷域迹'), 'CODEX 第 33 条存在');

console.log(
  `\nWL-R 摘要：coreR ${wlr.coreR} · couple ${wlr.couplePairs} · ratio ${wlr.coreRRatio} · reproLin ${wlr.logs.semLinRepro}`
);

if (failed) process.exit(1);
console.log('\n✓ Phase 135 WL-R 观察台 UI 验证通过');
