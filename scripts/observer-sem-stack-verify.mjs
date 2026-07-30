#!/usr/bin/env node
/**
 * Phase 104 — 观察台智慧语言 SEM 栈 UI 验证
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { buildQuadChainCohort, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { buildSemStackSummary } from '../src/ui/sem-stack.js';
import { buildEnvStackSummary } from '../src/ui/env-stack.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-00-L');
applyEnvProfile(world, 'observer_wl_stack');
initEnvStackModules(world);
const recorder = new Recorder();

for (const spec of buildQuadChainCohort(0)) {
  spawnBeing(world, recorder, spec);
}

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const sem = buildSemStackSummary(world, recorder);
const env = buildEnvStackSummary(world, recorder);

assert(sem.anyEnabled, 'SEM 栈已启用');
assert(sem.enabled.feedback, 'SEM 反馈已启用');
assert(sem.enabled.lineage, 'SEM 谱系持久已启用');
assert(sem.pairKinds > 0, `载荷对种类 > 0（${sem.pairKinds}）`);
assert(sem.logs.sem >= 0, 'SEM 日志可读');
assert(env.anyEnabled, '环境栈并存');

const semSrc = readFileSync(new URL('../src/ui/sem-stack.js', import.meta.url), 'utf8');
assert(semSrc.includes('sem-stack-panel'), 'SEM 面板已渲染');

const analogySrc = readFileSync(new URL('../src/ui/analogy.js', import.meta.url), 'utf8');
assert(analogySrc.includes('semViewModeHint'), '类比提示已定义');
assert(analogySrc.includes('非辞典'), '类比免责声明');

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('renderSemStackPanel'), '观察台已挂载 SEM 面板');

const codex = readFileSync(new URL('../docs/CODEX.md', import.meta.url), 'utf8');
assert(!codex.toLowerCase().includes('智慧语言'), 'CODEX 未写入智慧语言词条');

console.log(
  `\nSEM 摘要：pairs ${sem.pairKinds} · [SEM] ${sem.logs.sem} · top ${sem.topPairs[0]?.rx ?? '—'}→${sem.topPairs[0]?.tx ?? '—'}`
);

if (failed) process.exit(1);
console.log('\n✓ Phase 104 智慧语言观察台 UI 验证通过');
