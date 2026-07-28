#!/usr/bin/env node
/** 首次田野运行 — 生成观察数据供归纳 */

import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';

const TICKS = 200;
const world = createWorld('首次田野');
const recorder = new Recorder();

recorder.system(0, `世界创建 ${world.name}`);
const { being, id, dna } = performBirthRitual(world, recorder, {
  name: '小狗',
  code: '001',
});

for (let i = 0; i < TICKS; i++) {
  stepWorld(world, recorder);
}

const internals = recorder.entries.filter((e) => e.channel === 'internal');
const externals = recorder.entries.filter((e) => e.channel === 'external');
const states = recorder.entries.filter((e) => e.channel === 'state');

const externalTicks = [...new Set(externals.map((e) => e.tick))];
const internalPerTick = internals.filter((e) => e.tick > 0).length / TICKS;

const r0Start = states.find((e) => e.tick === 1)?.meta?.registers?.[0];
const r0End = states.find((e) => e.tick === TICKS)?.meta?.registers?.[0];

console.log('=== 首次田野运行摘要 ===');
console.log(`个体: ${being.name}（${being.code}）`);
console.log(`身份证: ${id}`);
console.log(`DNA 长度: ${dna.sequence.length}, 变异位: ${dna.mutationCount}`);
console.log(`tick: 0–${TICKS}`);
console.log(`日志条目: ${recorder.entries.length}`);
console.log(`对内记录: ${internals.length}, 平均每 tick ${internalPerTick.toFixed(2)} 条`);
console.log(`对外记录: ${externals.length}, 分布于 ${externalTicks.length} 个 tick`);
console.log(`r0: ${r0Start?.toFixed(4)} → ${r0End?.toFixed(4)}`);
console.log('');
console.log('--- 意识脉冲 ---');
console.log(internals.find((e) => e.tick === 0)?.content);
console.log('');
console.log('--- 首次对外行为 ---');
const firstExt = externals[0];
if (firstExt) {
  console.log(`t${firstExt.tick} ${firstExt.content}`);
} else {
  console.log('（200 tick 内未出现）');
}
