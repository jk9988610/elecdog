#!/usr/bin/env node
/**
 * Phase 97 — GAP-11+ [DSP] 耗散分流 CODEX 立项验证
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';

const fieldPath = new URL('../docs/field-phase95-report.json', import.meta.url);
const codexPath = new URL('../docs/CODEX.md', import.meta.url);

if (!existsSync(fieldPath)) {
  console.error('✗ 缺少 docs/field-phase95-report.json — 请先运行 npm run field:phase95');
  process.exit(1);
}

const fieldReport = JSON.parse(readFileSync(fieldPath, 'utf8'));
const codex = readFileSync(codexPath, 'utf8');
const hasCodexEntry = codex.includes('## 耗散分流');
const batch = fieldReport.batchVerdict ?? {};
const verdict = batch.verdict ?? 'unknown';
const yieldSupport = batch.yieldSupport ?? 0;

const review = {
  runAt: new Date().toISOString(),
  phase: 97,
  extension: 'gap11_dsp_codex',
  fieldPhase: 95,
  fieldVerdict: verdict,
  yieldSupport,
  dspObserved: batch.dspObserved ?? false,
  codexEntry: hasCodexEntry ? '耗散分流' : null,
  codexReady: hasCodexEntry && verdict === 'support' && yieldSupport >= 3,
  gap11Status: 'partial_closed',
  obs: ['OBS-20260729-95', 'OBS-20260729-96'],
  roadmap: 'docs/PHASE97_DSP_CODEX.md',
};

writeFileSync(
  new URL('../docs/gap11-dsp-codex-report.json', import.meta.url),
  JSON.stringify(review, null, 2)
);

console.log('GAP-11+ 耗散分流 CODEX 立项\n');
console.log(`Phase 95 田野：${verdict}（yield ${yieldSupport}/4）`);
console.log(`CODEX 新条：${hasCodexEntry ? '耗散分流 ✓' : '缺失 ✗'}`);
console.log(`立项就绪：${review.codexReady ? '✓ support' : '✗ 未通过'}`);
console.log('\n报告已写入 docs/gap11-dsp-codex-report.json');

if (!review.codexReady) process.exit(1);
