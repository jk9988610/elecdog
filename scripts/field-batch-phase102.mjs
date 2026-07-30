#!/usr/bin/env node
/**
 * Phase 102 — WL2 [SEM-LIN] 谱系约定持久田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE102_TREATMENTS, applyPhase102Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeSemLineage,
  compareSemLinOnVsOff,
  verifySemLineageBatch,
  slimSemMetrics,
} from './lib/phase102-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE102_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase102Treatment,
    treatmentId,
    seed,
    phase: 102,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeSemLineage(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimSemMetrics(run.metrics) };
}

console.log(
  `Phase 102 WL2 SEM-LIN：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE102_TREATMENTS[tid].label,
    meanSemLin: meanTreatment(runs, (r) => r.metrics.semLinCount),
    meanTraceWeight: meanTreatment(runs, (r) => r.metrics.meanTraceWeight),
    meanTop1Cond: meanTreatment(runs, (r) => r.metrics.top1CondProb),
    meanFbHits: meanTreatment(runs, (r) => r.metrics.meanFbHits),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    runs: runs.map(slimRun),
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const off = byTreatment.sem_lin_off.find((r) => r.seed === seed);
  const on = byTreatment.sem_lin_on.find((r) => r.seed === seed);
  return { seed, ...compareSemLinOnVsOff(off.metrics, on.metrics) };
});

const batchVerdict = verifySemLineageBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 102,
  extension: 'wl2_sem_lineage',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE102_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'WL2 [SEM-LIN] 谱系约定持久',
  roadmap: 'docs/PHASE102_SEM_LINEAGE.md',
  wisdomLanguage: 'docs/WISDOM_LANGUAGE.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase102-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(16), 'SEM-LIN', 'traceW', 'top1Cond', 'fbHits', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(16),
    String(a.meanSemLin ?? '—').padStart(7),
    String(a.meanTraceWeight ?? '—').padStart(7),
    String(a.meanTop1Cond ?? '—').padStart(9),
    String(a.meanFbHits ?? '—').padStart(7),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 (sem_lin_off vs sem_lin_on) ===');
console.log(`H1 支持: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 支持: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 支持: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 支持: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`H5 支持: ${batchVerdict.h5Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase102-report.json');

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

await maybeUploadFieldReport({ phase: 102, report });
