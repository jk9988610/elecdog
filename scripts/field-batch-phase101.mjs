#!/usr/bin/env node
/**
 * Phase 101 — WL1 [SEM] 反馈偏置田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE101_TREATMENTS, applyPhase101Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeSemFeedback,
  compareSemFeedbackVsRecord,
  verifySemFeedbackBatch,
  slimSemMetrics,
} from './lib/phase101-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE101_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase101Treatment,
    treatmentId,
    seed,
    phase: 101,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeSemFeedback(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimSemMetrics(run.metrics) };
}

console.log(
  `Phase 101 WL1 SEM反馈：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`单次实验上限：${formatFieldDuration(MAX_MS)}\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

function meanTreatment(runs, pick) {
  const vals = runs.map(pick).filter((v) => v != null);
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4) : null;
}

const aggregate = {};
for (const [tid, runs] of Object.entries(byTreatment)) {
  aggregate[tid] = {
    label: PHASE101_TREATMENTS[tid].label,
    meanSemCount: meanTreatment(runs, (r) => r.metrics.semCount),
    meanTop1Cond: meanTreatment(runs, (r) => r.metrics.top1CondProb),
    meanFbHits: meanTreatment(runs, (r) => r.metrics.meanFbHits),
    meanTxRatio: meanTreatment(runs, (r) => r.metrics.txActRatio),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    meanPairEvents: meanTreatment(runs, (r) => r.metrics.totalPairEvents),
    runs: runs.map(slimRun),
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const record = byTreatment.sem_record.find((r) => r.seed === seed);
  const feedback = byTreatment.sem_feedback.find((r) => r.seed === seed);
  return { seed, ...compareSemFeedbackVsRecord(record.metrics, feedback.metrics) };
});

const batchVerdict = verifySemFeedbackBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 101,
  extension: 'wl1_sem_feedback',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE101_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'WL1 semFeedbackEnabled 行为偏置',
  roadmap: 'docs/PHASE101_SEM_FEEDBACK.md',
  wisdomLanguage: 'docs/WISDOM_LANGUAGE.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase101-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(16), 'SEM', 'top1Cond', 'fbHits', 'TX比', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(16),
    String(a.meanSemCount ?? '—').padStart(6),
    String(a.meanTop1Cond ?? '—').padStart(9),
    String(a.meanFbHits ?? '—').padStart(7),
    String(a.meanTxRatio ?? '—').padStart(6),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 (sem_record vs sem_feedback) ===');
console.log(`H1 支持: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 支持: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 支持: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 支持: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`H5 支持: ${batchVerdict.h5Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase101-report.json');

const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));
const totalBatchMs = performance.now() - batchStartedAt;
console.log(
  `时长：单次最慢 ${formatFieldDuration(maxRunMs)} · 合计 ${formatFieldDuration(totalBatchMs)}`
);
if (maxRunMs > MAX_MS) {
  console.error(`\n✗ 存在超时单次实验，田野不通过`);
  process.exit(1);
}
console.log('✓ 全部单次实验在预算内');

await maybeUploadFieldReport({ phase: 101, report });
