#!/usr/bin/env node
/**
 * Phase 79 — W1 田野复核 + CODEX 立项验证
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { assessWisdomConditions } from './lib/wisdom-conditions.mjs';

const fieldPath = new URL('../docs/field-phase70-report.json', import.meta.url);
const codexPath = new URL('../docs/CODEX.md', import.meta.url);

if (!existsSync(fieldPath)) {
  console.error('✗ 缺少 docs/field-phase70-report.json — 请先运行 npm run field:phase70');
  process.exit(1);
}

const fieldReport = JSON.parse(readFileSync(fieldPath, 'utf8'));
const codex = readFileSync(codexPath, 'utf8');
const hasCodexEntry = codex.includes('## 记忆行为调制');
const batch = fieldReport.batchVerdict ?? {};
const h1 = batch.h1Support ?? 0;
const verdict = batch.verdict ?? 'unknown';

const review = {
  runAt: new Date().toISOString(),
  phase: 79,
  extension: 'w1_codex_review',
  fieldPhase: 70,
  fieldVerdict: verdict,
  h1Support: h1,
  signConsistent: batch.signConsistent ?? null,
  codexEntry: hasCodexEntry ? '记忆行为调制' : null,
  codexReady: hasCodexEntry && verdict === 'support' && h1 >= 2,
  assessment: assessWisdomConditions({ phase70FieldVerdict: verdict }),
  obs: ['OBS-20260729-81', 'OBS-20260729-90'],
  roadmap: 'docs/PHASE79_W1_CODEX_REVIEW.md',
};

writeFileSync(
  new URL('../docs/w1-codex-review-report.json', import.meta.url),
  JSON.stringify(review, null, 2)
);

console.log('W1 田野复核 + CODEX 立项\n');
console.log(`田野批次：${verdict}（H1 ${h1}/4）`);
console.log(`CODEX 新条：${hasCodexEntry ? '记忆行为调制 ✓' : '缺失 ✗'}`);
console.log(`立项就绪：${review.codexReady ? '✓ support' : '✗ 未通过'}`);
console.log('\n报告已写入 docs/w1-codex-review-report.json');

if (!review.codexReady) process.exit(1);
