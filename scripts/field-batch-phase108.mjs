#!/usr/bin/env node
/**
 * Phase 108 — 多环境留置链 + SEM 载荷迹跨环境孵化
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE108_TREATMENTS, applyPhase108Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_SHORT_TICKS } from './lib/field-cohort.js';
import {
  analyzeCarryChainSem,
  verifyCarryChainSemBatch,
  slimCarryChainMetrics,
} from './lib/phase108-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE108_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const INCUBATE = FIELD_SHORT_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase108Treatment,
    treatmentId,
    seed,
    phase: 108,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeCarryChainSem(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel} carry${run.carryCount}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 108 留置链：塑形${TICKS}+孵化${INCUBATE}+混合${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE108_TREATMENTS[tid].label,
    meanSem: meanTreatment(runs, (r) => r.metrics.semCount),
    meanTraceCarry: meanTreatment(runs, (r) => r.metrics.meanTraceWeightCarry),
    meanTraceNaive: meanTreatment(runs, (r) => r.metrics.meanTraceWeightNaive),
    meanCarryWithTrace: meanTreatment(runs, (r) => r.metrics.carryWithTrace),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanRen: meanTreatment(runs, (r) => r.metrics.renCount),
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyCarryChainSemBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 108,
  extension: 'gap_evo_carry_chain_sem',
  mode: 'field_stat',
  cohort: '10 naive + ≤2 carry chain',
  ticks: TICKS,
  incubateTicks: INCUBATE,
  seeds: FIELD_SEEDS,
  treatmentIds: TREATMENT_IDS,
  aggregate,
  batchVerdict,
  shortTermGoal: '多环境留置链 + SEM 载荷迹跨环境',
  roadmap: 'docs/PHASE108_CARRY_CHAIN_SEM.md',
  runBudgetMs: MAX_MS,
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase108-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 108 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: SEM ${agg.meanSem} traceC ${agg.meanTraceCarry} traceN ${agg.meanTraceNaive} withTrace ${agg.meanCarryWithTrace}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/4) traceLift ${batchVerdict.traceLift}`);
console.log(`  H1 链导入: ${batchVerdict.h1ChainImport ? '✓' : '✗'}`);
console.log(`  H2 无REN: ${batchVerdict.h2NoRen ? '✓' : '✗'}`);
console.log(`  H3 SEM可观测: ${batchVerdict.h3SemObservable ? '✓' : '✗'}`);
console.log(`  H4 留置有迹: ${batchVerdict.h4CarryTrace ? '✓' : '✗'}`);
console.log(`  H5 留置迹>naive: ${batchVerdict.h5CarryTraceAboveNaive ? '✓' : '✗'}`);

await maybeUploadFieldReport(report, { phase: 108, label: 'field-phase108' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 108 留置链 SEM 田野完成');
