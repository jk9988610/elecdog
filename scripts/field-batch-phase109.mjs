#!/usr/bin/env node
/**
 * Phase 109 — 三环境留置链：harsh 塑形 → SEM 孵化 → 第三环境混合
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE109_TREATMENTS, applyPhase109Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_SHORT_TICKS } from './lib/field-cohort.js';
import {
  analyzeTripleChain,
  verifyTripleChainBatch,
  slimCarryChainMetrics,
} from './lib/phase109-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE109_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const INCUBATE = FIELD_SHORT_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase109Treatment,
    treatmentId,
    seed,
    phase: 109,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeTripleChain(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel} carry${run.carryCount}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 109 三环境链：塑形${TICKS}+孵化${INCUBATE}+混合${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
  const envId = PHASE109_TREATMENTS[tid].mixedEnvId ?? PHASE109_TREATMENTS[tid].envId;
  aggregate[tid] = {
    label: PHASE109_TREATMENTS[tid].label,
    mixedEnvId: envId,
    meanSem: meanTreatment(runs, (r) => r.metrics.semCount),
    meanTraceCarry: meanTreatment(runs, (r) => r.metrics.meanTraceWeightCarry),
    meanTraceNaive: meanTreatment(runs, (r) => r.metrics.meanTraceWeightNaive),
    meanCarryWithTrace: meanTreatment(runs, (r) => r.metrics.carryWithTrace),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.meanChainDepth),
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyTripleChainBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 109,
  extension: 'gap_evo_carry_triple_chain',
  mode: 'field_stat',
  cohort: '10 naive + ≤2 carry triple chain',
  ticks: TICKS,
  incubateTicks: INCUBATE,
  seeds: FIELD_SEEDS,
  treatmentIds: TREATMENT_IDS,
  aggregate,
  batchVerdict,
  shortTermGoal: '三环境留置链 + 第三环境混合对照',
  roadmap: 'docs/PHASE109_TRIPLE_CHAIN.md',
  runBudgetMs: MAX_MS,
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase109-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 109 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid} (${agg.mixedEnvId}): SEM ${agg.meanSem} traceC ${agg.meanTraceCarry} fiss ${agg.meanFiss} chain ${agg.meanChainDepth}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/6)`);
console.log(`  H1 链导入: ${batchVerdict.h1ChainImport ? '✓' : '✗'}`);
console.log(`  H2 无REN: ${batchVerdict.h2NoRen ? '✓' : '✗'}`);
console.log(`  H3 SEM可观测: ${batchVerdict.h3SemObservable ? '✓' : '✗'}`);
console.log(`  H4 留置有迹: ${batchVerdict.h4CarryTrace ? '✓' : '✗'}`);
console.log(`  H5 链深度: ${batchVerdict.h5ChainDepth ? '✓' : '✗'}`);
console.log(`  H6 环境对照: ${batchVerdict.h6EnvContrast ? '✓' : '✗'} (fertile fiss ${batchVerdict.fertileMeanFiss} vs ctrl ${batchVerdict.ctrlMeanFiss})`);

await maybeUploadFieldReport(report, { phase: 109, label: 'field-phase109' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 109 三环境留置链田野完成');
