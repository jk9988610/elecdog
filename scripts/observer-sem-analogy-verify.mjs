#!/usr/bin/env node
/**
 * 信号类比流 UI 验证 — 机制推导翻译 + 观察台面板
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { buildQuadChainCohort, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  translateSignal,
  buildSignalTranslations,
  pickSignalStreamEntries,
  payloadHexFromSignal,
} from '../src/ui/sem-analogy-translate.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-00-SEM-AN');
applyEnvProfile(world, 'observer_wlr_stack');
initEnvStackModules(world);
const recorder = new Recorder();

for (const spec of buildQuadChainCohort(0)) {
  spawnBeing(world, recorder, spec);
}

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const signals = pickSignalStreamEntries(recorder, { limit: 20 });
assert(signals.length > 0, `有 TX/RX 信号记录（${signals.length}）`);

const translations = buildSignalTranslations(recorder, world, { limit: 20 });
assert(translations.length > 0, 'buildSignalTranslations 有输出');

const tiers = new Set(translations.map((r) => r.translation.tier));
assert(tiers.size >= 1, `至少一种分级 tier（${[...tiers].join(',')})`);

const unparsed = translations.filter((r) => r.translation.unparsed);
const parsed = translations.filter((r) => !r.translation.unparsed);
assert(
  unparsed.every((r) => r.translation.analogyLabel === '未解析载荷'),
  '未解析项显示未解析载荷'
);
if (unparsed.length) {
  assert(
    unparsed.every((r) => r.translation.rawHex && r.translation.rawHex !== '—' || r.translation.basis.length),
    '未解析项含 hex 或依据'
  );
}

if (parsed.length) {
  assert(
    parsed.every((r) => r.translation.basis.length > 0),
    '已解析项含机制依据'
  );
}

const being = world.beings.find((b) => b.alive);
if (being) {
  const manual = translateSignal(
    { direction: 'TX', content: '[TX] 0x8E 0xBD 0x41', tick: world.tick, beingId: being.id },
    { being, world, recorder, profile: world.envProfile, nativeMode: false }
  );
  assert(manual.analogyLabel, 'translateSignal 返回类比标签');
  assert(manual.rawHex === '8ebd41', `TX hex 正确（${manual.rawHex}）`);
  assert(manual.analogyLabel.includes('8E·BD·41'), '主行含可读载荷');

  const rxHex = payloadHexFromSignal(
    '[RX] M-00-L20260730020002 [TX] 0xEB 0x30 0x1D'
  );
  assert(rxHex === 'eb301d', `RX 内嵌 TX hex 正确（${rxHex}）`);

  const rxManual = translateSignal(
    {
      direction: 'RX',
      content: '[RX] M-00-L20260730020002 [TX] 0xEB 0x30 0x1D',
      tick: world.tick,
      beingId: being.id,
      meta: { fromId: 'M-00-L20260730020002' },
    },
    { being, world, recorder, profile: world.envProfile, nativeMode: false }
  );
  assert(rxManual.analogyLabel.includes('收信'), 'RX 主行为收信');
  assert(rxManual.analogyLabel.includes('EB·30·1D'), 'RX 主行含载荷');
}

const translateSrc = readFileSync(
  new URL('../src/ui/sem-analogy-translate.js', import.meta.url),
  'utf8'
);
assert(!translateSrc.includes('from \'./codex-data'), '翻译模块不引用 codex-data');
assert(translateSrc.includes('sem-domain'), '翻译引用 sem-domain');

const panelSrc = readFileSync(new URL('../src/ui/sem-signal-stream.js', import.meta.url), 'utf8');
assert(panelSrc.includes('sem-signal-panel'), '信号类比面板已定义');
const analogySrc = readFileSync(new URL('../src/ui/analogy.js', import.meta.url), 'utf8');
assert(
  analogySrc.includes('semSignalDigest') && analogySrc.includes('摘要'),
  '类比标签含语义摘要'
);

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('initSemSignalStreamPanel'), '观察台已挂载信号类比面板');
assert(observerSrc.includes('btn-sem-signal-toggle'), '观察台有信号类比按钮');

const codexData = readFileSync(new URL('../src/ui/codex-data.js', import.meta.url), 'utf8');
assert(
  !codexData.includes('sem-analogy') && !codexData.includes('类比译文'),
  'codex-data 未写入类比词典'
);

console.log(
  `\n信号流：${signals.length} 条 · 已解析 ${parsed.length} · 未解析 ${unparsed.length}`
);

if (failed) process.exit(1);
console.log('\n✓ 信号类比流 UI 验证通过');
