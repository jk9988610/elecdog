#!/usr/bin/env node
/**
 * Phase 74 — W3 预测误差校正反馈田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE74_TREATMENTS, applyPhase74Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzePredictionFeedback,
  comparePrdFeedbackVsRecord,
  verifyPrdFeedbackBatch,
} from './lib/phase74-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE74_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase74Treatment,
    treatmentId,
    seed,
    phase: 74,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzePredictionFeedback(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 74 W3 校正反馈：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE74_TREATMENTS[tid].label,
    meanPrdCount: meanTreatment(runs, (r) => r.metrics.prdCount),
    meanCumError: meanTreatment(runs, (r) => r.metrics.meanCumError),
    meanLateError: meanTreatment(runs, (r) => r.metrics.meanLateError),
    meanHighTicks: meanTreatment(runs, (r) => r.metrics.meanHighErrorTicks),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const record = byTreatment.w3_prd_record.find((r) => r.seed === seed);
  const feedback = byTreatment.w3_prd_feedback.find((r) => r.seed === seed);
  return { seed, ...comparePrdFeedbackVsRecord(record.metrics, feedback.metrics) };
});

const batchVerdict = verifyPrdFeedbackBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 74,
  extension: 'w3_prediction_feedback',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE74_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'W3 预测误差→行为校正',
  roadmap: 'docs/PHASE74_PREDICTION_FEEDBACK.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase74-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(18), 'PRD', 'lateErr', 'highTk', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(18),
    String(a.meanPrdCount ?? '—').padStart(6),
    String(a.meanLateError ?? '—').padStart(8),
    String(a.meanHighTicks ?? '—').padStart(7),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 ===');
console.log(`H1 后期误差↓: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 行为调制: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 高误差减少: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 PRD可观察: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase74-report.json');

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

await maybeUploadFieldReport({ phase: 74, report });
