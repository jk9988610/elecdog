#!/usr/bin/env node
/**
 * Phase 98–99 — 观察台环境栈 UI 验证
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { buildEnvStackSummary } from '../src/ui/env-stack.js';
import { readFileSync } from 'fs';

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
applyEnvProfile(world, 'observer_w6_stack');
initEnvStackModules(world);
const recorder = new Recorder();

for (let i = 0; i < 240; i++) {
  stepWorld(world, recorder);
}

const stack = buildEnvStackSummary(world, recorder);

assert(stack.anyEnabled, '环境栈已启用');
assert(stack.place.band === 'M', '区带 M');
assert(stack.place.terrain === 'L', '地形 L');
assert(stack.diurnal != null, '日相可读');
assert(stack.seasonal != null, '季相可读');
assert(stack.lunar != null, '月相可读');
assert((stack.diurnal.dayTicks ?? 0) + (stack.diurnal.nightTicks ?? 0) >= 200, '日相统计 ≥200 tick');
assert(stack.logs.dlc >= 1, `DLC 季度跃迁可观测（${stack.logs.dlc}）`);
assert(world.birthPlace === 'M-00-L', 'birthPlace 格式化');

assert(stack.enabled.rsv && stack.enabled.synth && stack.enabled.dsp, '工具/储备层已启用');
assert(stack.tools?.rsv != null, 'RSV 摘要可读');
assert(stack.tools?.dsp != null, 'DSP 摘要可读');
assert(stack.tools?.adv != null, 'ADV 摘要可读');

const envStackSrc = readFileSync(new URL('../src/ui/env-stack.js', import.meta.url), 'utf8');
assert(envStackSrc.includes('envTools'), '工具层列已渲染');

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('renderEnvStackPanel'), '观察台已挂载环境栈面板');

const codex = readFileSync(new URL('../docs/CODEX.md', import.meta.url), 'utf8');
assert(!codex.includes('## 区带'), 'CODEX 未写入区带词条（类比 UI only）');

console.log(
  `\n环境栈摘要：${stack.birthPlace} · DSP lost ${stack.tools.dsp.lost} · ADV flux ${stack.tools.adv.fluxTotal}`
);

if (failed) process.exit(1);
console.log('\n✓ Phase 99 环境栈工具层 UI 验证通过');
