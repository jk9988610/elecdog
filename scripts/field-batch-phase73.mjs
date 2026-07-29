#!/usr/bin/env node
/**
 * Phase 73 — W3 预测误差 [PRD] 记录层田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE73_TREATMENTS, applyPhase73Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzePrediction,
  comparePrdOnVsOff,
  verifyPrdFieldBatch,
} from './lib/phase73-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE73_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase73Treatment,
    treatmentId,
    seed,
    phase: 73,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzePrediction(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 73 W3 预测误差：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE73_TREATMENTS[tid].label,
    meanPrdCount: meanTreatment(runs, (r) => r.metrics.prdCount),
    meanCumError: meanTreatment(runs, (r) => r.metrics.meanCumError),
    meanHighTicks: meanTreatment(runs, (r) => r.metrics.meanHighErrorTicks),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const off = byTreatment.w3_prd_off.find((r) => r.seed === seed);
  const on = byTreatment.w3_prd_on.find((r) => r.seed === seed);
  return { seed, ...comparePrdOnVsOff(off.metrics, on.metrics) };
});

const batchVerdict = verifyPrdFieldBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 73,
  extension: 'w3_prediction_record',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE73_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'W3 预测误差记录 [PRD]',
  roadmap: 'docs/PHASE73_PREDICTION_RECORD.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase73-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(16), 'PRD', 'meanErr', 'highTk', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(16),
    String(a.meanPrdCount ?? '—').padStart(6),
    String(a.meanCumError ?? '—').padStart(8),
    String(a.meanHighTicks ?? '—').padStart(7),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 ===');
console.log(`H1 支持: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 支持: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 支持: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase73-report.json');

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

await maybeUploadFieldReport({ phase: 73, report });
