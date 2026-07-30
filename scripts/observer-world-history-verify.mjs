#!/usr/bin/env node
/** 观察台世界快照 — 回退/前进不触发 structuredClone 错误 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { spawnAdultMulticellCohort } from '../src/birth/adult-cohort.js';
import { Recorder } from '../src/recorder/logger.js';
import { stepWorld } from '../src/kernel/engine.js';
import { snapshotWorldState, restoreWorldState } from '../src/world/world-history.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-HIST');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
spawnAdultMulticellCohort(world, new Recorder());
const recorder = new Recorder();

for (let i = 0; i < 8; i++) {
  stepWorld(world, recorder);
}

const snap = snapshotWorldState(world);
assert(snap?.tick === world.tick, '快照 tick 一致');
assert(snap.semTopTxByRx?.__map__ === true, 'Map 序列化为条目');

const restored = restoreWorldState(snap);
assert(restored.tick === world.tick, '恢复 tick');
assert(restored.semTopTxByRx instanceof Map, 'semTopTxByRx 为 Map');
assert(typeof restored.substrate?.rng === 'function', 'substrate rng 可调用');
assert(typeof restored.beings[0]?.rng === 'function', 'being rng 可调用');
assert(typeof restored.beings[0]?.tick === 'function', 'Being 原型 tick');

stepWorld(restored, new Recorder());
assert(restored.tick === world.tick + 1, '恢复后可继续 step');

if (failed) {
  console.error(`observer-world-history-verify: ${failed} failed`);
  process.exit(1);
}
console.log('observer-world-history-verify: all passed');
