#!/usr/bin/env node
/**
 * 信号语义摘要 — 田野/观察台 CLI 代读
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { buildQuadChainCohort, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { buildSignalDigest, formatDigestPlainText } from '../src/ui/sem-signal-digest.js';
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

const world = createWorld('M-DIGEST');
applyEnvProfile(world, 'observer_wlr_stack');
initEnvStackModules(world);
const recorder = new Recorder();

for (const spec of buildQuadChainCohort(0)) {
  spawnBeing(world, recorder, spec);
}

for (let i = 0; i < FIELD_MED_TICKS; i++) {
  stepWorld(world, recorder);
}

const digest = buildSignalDigest(recorder, world, { windowTicks: 48 });
assert(digest.lines.length >= 5, `摘要至少 5 行（${digest.lines.length}）`);
assert(digest.lines[0].includes('语义摘要'), '含摘要标题');
assert(digest.lines.some((l) => l.includes('繁殖阶段')), '含繁殖阶段行');
assert(
  digest.lines.some((l) => l.includes('收信') || l.includes('发信')),
  '含收发聚合'
);

const text = formatDigestPlainText(digest);
assert(text.length > 80, '纯文本输出非空');

const lexSrc = readFileSync(new URL('../src/ui/observer-lexicon.js', import.meta.url), 'utf8');
assert(!lexSrc.includes('from \'./codex-data'), '释义表不引用 codex-data');

const codexData = readFileSync(new URL('../src/ui/codex-data.js', import.meta.url), 'utf8');
assert(!codexData.includes('observer-lexicon'), 'codex-data 未写入观察者释义');

const panelSrc = readFileSync(new URL('../src/ui/sem-signal-stream.js', import.meta.url), 'utf8');
assert(panelSrc.includes('buildSignalDigest'), '面板默认摘要模式');
assert(panelSrc.includes('btn-sig-view-digest'), '摘要/明细切换');

console.log('\n--- 语义摘要样例 ---\n');
console.log(text);
console.log('');

if (failed) process.exit(1);
console.log('✓ 信号语义摘要验证通过');
