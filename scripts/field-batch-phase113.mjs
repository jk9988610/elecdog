#!/usr/bin/env node
/**
 * Phase 113 — GAP-13 加长混合 tick + 墙钟截止守卫
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE113_TREATMENTS, applyPhase113Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeCoopRobustness,
  verifyCoopRobustBatch,
  slimCarryChainMetrics,
} from './lib/phase113-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE113_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase113Treatment,
    treatmentId,
    seed,
    phase: 113,
    ticks: FIELD_MED_TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeCoopRobustness(recorder, beings, world, ctx),
  });
  const flag = run.deadlineHit ? ' ⏱' : '';
  process.stdout.write(` ✓ ${run.durationLabel} mixed${run.mixedTicks}${flag}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 113 合作因果稳健性：标准混合${FIELD_MED_TICKS} vs 加长${FIELD_LONG_TICKS} · 截止 ${formatFieldDuration(MAX_MS)}/次 · tick顶 ${FIELD_MAX_TICKS_PER_PASS}`
);
console.log('');

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
    label: PHASE113_TREATMENTS[tid].label,
    mixedTicks: PHASE113_TREATMENTS[tid].mixedTicks,
    meanCorr: meanTreatment(runs, (r) => r.metrics.crossRxCoopCorr),
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    meanTicksDone: meanTreatment(runs, (r) => r.metrics.mixedTicksCompleted),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyCoopRobustBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 113,
  extension: 'gap13_coop_robust_deadline',
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  aggregate,
  batchVerdict,
  shortTermGoal: '加长混合 tick + 墙钟/tick 截止防无限循环',
  roadmap: 'docs/PHASE113_COOP_ROBUST.md',
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase113-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 113 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid} (mixed${agg.mixedTicks}): corr ${agg.meanCorr} COOP ${agg.meanCoop} done ${agg.meanTicksDone} deadline${agg.deadlineHits}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7)`);
console.log(`  H1 标准无截止: ${batchVerdict.h1StdNoDeadline ? '✓' : '✗'}`);
console.log(`  H2 加长无截止: ${batchVerdict.h2LongNoDeadline ? '✓' : '✗'}`);
console.log(`  H3 加长 tick 完成: ${batchVerdict.h3LongTicksComplete ? '✓' : '✗'}`);
console.log(`  H4 相关可测: ${batchVerdict.h4CorrMeasurable ? '✓' : '✗'}`);
console.log(`  H5 相关稳健: ${batchVerdict.h5CorrStable ? '✓' : '✗'} (long ${batchVerdict.longMeanCorr} vs std ${batchVerdict.stdMeanCorr})`);
console.log(`  H6 无REN: ${batchVerdict.h6NoRen ? '✓' : '✗'}`);
console.log(`  H7 COOP稳健: ${batchVerdict.h7CoopRobust ? '✓' : '✗'}`);

await maybeUploadFieldReport(report, { phase: 113, label: 'field-phase113' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 113 合作因果稳健性田野完成');
