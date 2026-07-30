#!/usr/bin/env node
/**
 * Phase 116 — 加长塑形 tick + 截止守卫（五环境链）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE116_TREATMENTS, applyPhase116Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeSculptRobustness,
  verifySculptRobustBatch,
  slimCarryChainMetrics,
} from './lib/phase116-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE116_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase116Treatment,
    treatmentId,
    seed,
    phase: 116,
    ticks: FIELD_MED_TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeSculptRobustness(recorder, beings, world, ctx),
  });
  const flag = run.deadlineHit ? ' ⏱' : '';
  process.stdout.write(` ✓ ${run.durationLabel} sculpt${run.sculptTicks}${flag}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 116 塑形加长：标准${FIELD_MED_TICKS} vs 加长${FIELD_LONG_TICKS}（五环境链）· 截止 ${formatFieldDuration(MAX_MS)} · tick顶 ${FIELD_MAX_TICKS_PER_PASS}`
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
    label: PHASE116_TREATMENTS[tid].label,
    sculptTicks: PHASE116_TREATMENTS[tid].sculptTicks,
    meanGenCarry: meanTreatment(runs, (r) => r.metrics.meanGenCarry),
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.maxChainDepth),
    meanSculptDone: meanTreatment(runs, (r) => r.sculptTicksCompleted),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifySculptRobustBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 116,
  extension: 'gap_evo_carry_long_sculpt',
  chain: 'harsh(sculpt) → wisdom(SEM) → fertile(COOP) → wisdom(refine) → wisdom(mix)',
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  aggregate,
  batchVerdict,
  shortTermGoal: '加长塑形 tick + 墙钟/tick 截止防无限循环',
  roadmap: 'docs/PHASE116_LONG_SCULPT.md',
  goalDistance: 'docs/GOAL_DISTANCE.md',
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase116-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 116 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid} (sculpt${agg.sculptTicks}): genCarry ${agg.meanGenCarry} depth ${agg.meanChainDepth} done ${agg.meanSculptDone} deadline${agg.deadlineHits}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7)`);
console.log(`  H1 标准无截止: ${batchVerdict.h1StdNoDeadline ? '✓' : '✗'}`);
console.log(`  H2 加长无截止: ${batchVerdict.h2LongNoDeadline ? '✓' : '✗'}`);
console.log(`  H3 加长塑形完成: ${batchVerdict.h3LongSculptComplete ? '✓' : '✗'}`);
console.log(`  H4 留置导入: ${batchVerdict.h4CarryImported ? '✓' : '✗'}`);
console.log(`  H5 加长代次更高: ${batchVerdict.h5LongHigherGen ? '✓' : '✗'} (long ${batchVerdict.longMeanGenCarry} vs std ${batchVerdict.stdMeanGenCarry})`);
console.log(`  H6 无REN: ${batchVerdict.h6NoRen ? '✓' : '✗'}`);
console.log(`  H7 五环境链深度: ${batchVerdict.h7PentaChainDepth ? '✓' : '✗'}`);

await maybeUploadFieldReport(report, { phase: 116, label: 'field-phase116' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 116 加长塑形田野完成');
