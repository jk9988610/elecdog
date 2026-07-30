#!/usr/bin/env node
/**
 * Phase 103 — WL3 SEM × 社会知识正交对照（640 tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE103_TREATMENTS, applyPhase103Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeSemSocOrthogonal,
  compareFactorialCell,
  verifySemSocOrthogonalBatch,
  slimSemMetrics,
} from './lib/phase103-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE103_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase103Treatment,
    treatmentId,
    seed,
    phase: 103,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeSemSocOrthogonal(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimSemMetrics(run.metrics) };
}

console.log(
  `Phase 103 WL3 正交对照：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE103_TREATMENTS[tid].label,
    meanPairKinds: meanTreatment(runs, (r) => r.metrics.pairKinds),
    meanTop1Cond: meanTreatment(runs, (r) => r.metrics.top1CondProb),
    meanSocEnc: meanTreatment(runs, (r) => r.metrics.socEncCount),
    meanSocLin: meanTreatment(runs, (r) => r.metrics.socLinCount),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    runs: runs.map(slimRun),
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const cells = {
    offOff: byTreatment.w3_off_off.find((r) => r.seed === seed).metrics,
    offOn: byTreatment.w3_off_on.find((r) => r.seed === seed).metrics,
    onOff: byTreatment.w3_on_off.find((r) => r.seed === seed).metrics,
    onOn: byTreatment.w3_on_on.find((r) => r.seed === seed).metrics,
  };
  return { seed, ...compareFactorialCell(cells) };
});

const batchVerdict = verifySemSocOrthogonalBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 103,
  extension: 'wl3_sem_soc_orthogonal',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE103_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'WL3 SEM × SOC 正交对照',
  roadmap: 'docs/PHASE103_SEM_SOC_ORTHOGONAL.md',
  wisdomLanguage: 'docs/WISDOM_LANGUAGE.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase103-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(12), 'pairs', 'top1Cond', 'SOC-ENC', 'SOC-LIN', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(12),
    String(a.meanPairKinds ?? '—').padStart(6),
    String(a.meanTop1Cond ?? '—').padStart(9),
    String(a.meanSocEnc ?? '—').padStart(8),
    String(a.meanSocLin ?? '—').padStart(8),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 (2×2 factorial) ===');
console.log(`H1 SEM主效应: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 SOC主效应: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 SEM正交: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 SOC正交: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`H5 双开稳定: ${batchVerdict.h5Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase103-report.json');

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

await maybeUploadFieldReport({ phase: 103, report });
