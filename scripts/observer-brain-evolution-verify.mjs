#!/usr/bin/env node
/**
 * 脑演化 — internal→TX 耦合 + [THO] + 观察台面板
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { buildQuadChainCohort, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { buildThoughtSpeechRows } from '../src/ui/thought-speech.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-BRAIN');
applyEnvProfile(world, 'observer_brain_evolution');
initEnvStackModules(world);
const recorder = new Recorder();

assert(world.envProfile?.internalTxCoupling === true, '脑演化环境启用耦合');

for (const spec of buildQuadChainCohort(0)) {
  spawnBeing(world, recorder, spec);
}

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const thoCount = recorder.entries.filter(
  (e) => e.channel === 'evolution' && e.meta?.kind === 'THO'
).length;
assert(thoCount > 0, `[THO] 记录存在（${thoCount}）`);

const rows = buildThoughtSpeechRows(recorder, { limit: 20 });
assert(rows.length > 0, '思考外化叙事行存在');
assert(rows.some((r) => r.narrative.includes('思考外化')), '含中文叙事');

const hits = world.beings.reduce((s, b) => s + (b.internalTxHits ?? 0), 0);
assert(hits > 0, `internalTxHits 累计 > 0（${hits}）`);

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('initThoughtSpeechPanel'), '观察台挂载思考外化面板');
assert(observerSrc.includes('observer_brain_evolution') || observerSrc.includes('thought-speech'), '思考外化 UI');

const codexData = readFileSync(new URL('../src/ui/codex-data.js', import.meta.url), 'utf8');
assert(!codexData.includes('internalTxCoupling'), 'codex-data 未写入脑耦合规则');

console.log(`\n[THO] ${thoCount} · 叙事 ${rows.length} · 耦合命中 ${hits}`);

if (failed) process.exit(1);
console.log('\n✓ 脑演化 internal→TX 验证通过');
