#!/usr/bin/env node
/**
 * 繁殖言语 — 定向实质性 TX + 胞内 INTRA-TX + pairMorph A/B
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { FIELD_MED_TICKS } from './lib/field-cohort.js';
import { parseDirectedTx, substantiveSignalOnly } from '../src/world/substantive-signal.js';
import { buildThoughtSpeechRows } from '../src/ui/thought-speech.js';
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

const world = createWorld('M-REPRO-SPEECH');
applyEnvProfile(world, 'observer_repro_speech');
initEnvStackModules(world);
const recorder = new Recorder();

assert(substantiveSignalOnly(world.envProfile), '繁殖言语环境启用实质性信号');
assert(world.envProfile?.pairSpeechDriven === true, 'pairSpeechDriven 启用');

const morphs = ['A', 'B', 'A', 'B'];
for (let i = 0; i < morphs.length; i++) {
  spawnBeing(world, recorder, {
    name: `形态${morphs[i]}${i + 1}`,
    code: String(i + 1).padStart(3, '0'),
    pairMorph: morphs[i],
    cohortTag: 'naive',
  });
}

assert(world.beings.filter((b) => b.pairMorph === 'A').length === 2, 'A 形态各 2');
assert(world.beings.filter((b) => b.pairMorph === 'B').length === 2, 'B 形态各 2');

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const externalTx = recorder.entries.filter(
  (e) => e.channel === 'external' && e.content?.startsWith('[TX]')
);
const directed = externalTx.filter((e) => parseDirectedTx(e.content));
const broadcast = externalTx.filter((e) => !parseDirectedTx(e.content));

assert(directed.length > 0, `定向 TX 存在（${directed.length}）`);
assert(broadcast.length === 0, `无无定向广播 TX（${broadcast.length}）`);

const intents = new Set(directed.map((e) => parseDirectedTx(e.content)?.intent));
assert(intents.has('PRQ') || intents.has('PGR') || [...intents].some((x) => x?.startsWith('Q-')), `含繁殖或四域意图：${[...intents].join(',')}`);

const intraTx = recorder.entries.filter(
  (e) => e.channel === 'internal' && String(e.content).includes('[INTRA-TX]')
);
assert(intraTx.length > 0, `胞内 INTRA-TX 存在（${intraTx.length}）`);

const speechPrq = recorder.entries.filter(
  (e) => e.channel === 'evolution' && e.meta?.kind === 'PRQ' && e.meta?.speechDriven
);
assert(speechPrq.length > 0, `言语驱动 PRQ（${speechPrq.length}）`);

const tho = recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'THO');
assert(tho.length > 0, `[THO] 记录（${tho.length}）`);

const rows = buildThoughtSpeechRows(recorder, { world, limit: 30 });
assert(rows.some((r) => r.intent), '思考外化含意图叙事');

assert(getObserverEnvId() === 'multicell_v2_world', '观察台默认环境为多细胞 v2');

const codexData = readFileSync(new URL('../src/ui/codex-data.js', import.meta.url), 'utf8');
assert(!codexData.includes('substantiveSignalOnly'), 'codex-data 未写入言语规则');

console.log(
  `\n定向 TX ${directed.length} · INTRA-TX ${intraTx.length} · speech PRQ ${speechPrq.length} · THO ${tho.length}`
);

if (failed) process.exit(1);
console.log('\n✓ 繁殖言语栈验证通过');
