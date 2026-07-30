#!/usr/bin/env node
/**
 * Phase 134 — WL-R4 繁殖载荷域迹 CODEX 立项验证
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';

const reports = [
  { path: '../docs/field-phase131-report.json', phase: 131, key: 'phase131' },
  { path: '../docs/field-phase132-report.json', phase: 132, key: 'phase132' },
  { path: '../docs/field-phase133-report.json', phase: 133, key: 'phase133' },
];
const codexPath = new URL('../docs/CODEX.md', import.meta.url);
const obsPath = new URL('../docs/OBSERVATION_LOG.md', import.meta.url);
const codexDataPath = new URL('../src/ui/codex-data.js', import.meta.url);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const verdicts = {};
for (const { path, phase, key } of reports) {
  const url = new URL(path, import.meta.url);
  if (!existsSync(url)) {
    console.error(`✗ 缺少 field-phase${phase}-report.json — 请先运行对应田野批次`);
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(url, 'utf8'));
  verdicts[key] = report.batchVerdict?.verdict ?? 'unknown';
}

const codex = readFileSync(codexPath, 'utf8');
const codexData = readFileSync(codexDataPath, 'utf8');
const obsLog = readFileSync(obsPath, 'utf8');

const hasCodexEntry = codex.includes('## 繁殖载荷域迹');
const hasCodexData = codexData.includes("title: '繁殖载荷域迹'");
const forbidden = ['## 智慧语言', '## 语言', '## 对话', '## 繁殖语言'].some((t) => codex.includes(t));

const obsIds = [
  'OBS-20260730-103',
  'OBS-20260730-104',
  'OBS-20260730-105',
  'OBS-20260730-106',
];
for (const id of obsIds) {
  assert(obsLog.includes(`## ${id}`), `观察日志含 ${id}`);
}

assert(verdicts.phase131 === 'support', `Phase 131 田野 support（${verdicts.phase131}）`);
assert(verdicts.phase132 === 'support', `Phase 132 田野 support（${verdicts.phase132}）`);
assert(verdicts.phase133 === 'support', `Phase 133 田野 support（${verdicts.phase133}）`);
assert(!forbidden, 'CODEX 无禁止地球式语言条名');
assert(hasCodexEntry, 'CODEX.md 已写入繁殖载荷域迹');
assert(hasCodexData, 'codex-data.js 已同步繁殖载荷域迹');
assert(codex.includes('延伸「载荷共现迹」'), '繁殖载荷域迹备注链至载荷共现迹');

const review = {
  runAt: new Date().toISOString(),
  phase: 134,
  extension: 'wl_r4_repro_codex',
  fieldPhases: [131, 132, 133],
  fieldVerdicts: verdicts,
  codexEntry: hasCodexEntry ? '繁殖载荷域迹' : null,
  codexEntryNumber: 33,
  codexReady: hasCodexEntry && hasCodexData && verdicts.phase131 === 'support' && verdicts.phase132 === 'support' && verdicts.phase133 === 'support',
  wlRStatus: 'converged_codex',
  obs: obsIds,
  roadmap: 'docs/PHASE134_WLR_CODEX.md',
};

writeFileSync(
  new URL('../docs/gap-wlr-repro-codex-report.json', import.meta.url),
  JSON.stringify(review, null, 2)
);

console.log('\nWL-R4 繁殖载荷域迹 CODEX 立项\n');
console.log(`Phase 131–133：${verdicts.phase131} / ${verdicts.phase132} / ${verdicts.phase133}`);
console.log(`CODEX 第 33 条：${hasCodexEntry ? '繁殖载荷域迹 ✓' : '缺失 ✗'}`);
console.log(`立项就绪：${review.codexReady ? '✓ support' : '✗ 未通过'}`);
console.log('\n报告已写入 docs/gap-wlr-repro-codex-report.json');

if (!review.codexReady || failed) process.exit(1);
