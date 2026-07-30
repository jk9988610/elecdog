#!/usr/bin/env node
/** 田野 tick 截止守卫单元验证 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile } from '../src/world/env-profile.js';
import { StatsRecorder } from '../src/recorder/stats-recorder.js';
import { runFieldTicks } from './lib/field-ticks.js';
import { createFieldDeadline, FIELD_MAX_TICKS_PER_PASS, resolveTickCap } from './lib/field-budget.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

assert(resolveTickCap(10000, 8192) === 8192, 'tick 硬顶生效');
assert(resolveTickCap(640, 8192) === 640, '正常 tick 不截断');

const world = createWorld('M-00-D');
applyEnvProfile(world, 'baseline');
const recorder = new StatsRecorder();
const deadline = createFieldDeadline(5, performance.now());

const result = runFieldTicks(world, recorder, 100000, { deadline, maxTicksPerPass: 8192 });
assert(result.deadlineHit === true, '墙钟截止触发');
assert(result.ticksCompleted < 100000, `提前终止（${result.ticksCompleted} tick）`);
assert(result.tickCapHit === true, '超大请求标记 tickCapHit');

if (failed) process.exit(1);
console.log('\n✓ 田野 tick 截止守卫验证通过');
