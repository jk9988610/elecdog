#!/usr/bin/env node
/**
 * Phase 121 — GAP-13 × 8192 tick 合作因果（六环境+链 · turbo）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE121_TREATMENTS, applyPhase121Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_WISDOM_OPEN_TICKS } from './lib/field-cohort.js';
import {
  analyzeCoopCausalLongLaw,
  verifyCoopCausalLongLawBatch,
  slimCarryChainMetrics,
} from './lib/phase121-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE121_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase121Treatment,
    treatmentId,
    seed,
    phase: 121,
    ticks: FIELD_WISDOM_OPEN_TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeCoopCausalLongLaw(recorder, beings, world, ctx),
  });
  const flag = run.deadlineHit ? ' ⏱' : '';
  const adv = run.metrics?.carryCoopAdvantage ?? '?';
  process.stdout.write(` ✓ ${run.durationLabel} adv${adv}${flag}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 121 GAP-13×8192：COOP on/off · mixed${FIELD_WISDOM_OPEN_TICKS} turbo × ${FIELD_SEEDS.length} 种子 · 截止 ${formatFieldDuration(MAX_MS)}`
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
    label: PHASE121_TREATMENTS[tid].label,
    mixedTicks: PHASE121_TREATMENTS[tid].mixedTicks,
    meanCarryAdv: meanTreatment(runs, (r) => r.metrics.carryCoopAdvantage),
    meanCorr: meanTreatment(runs, (r) => r.metrics.crossRxCoopCorr),
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    meanCompletion: meanTreatment(runs, (r) => r.metrics.tickCompletionRate),
    meanDurationMs: meanTreatment(runs, (r) => r.durationMs),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyCoopCausalLongLawBatch(byTreatment);
const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));

const report = {
  runAt: new Date().toISOString(),
  phase: 121,
  extension: 'gap13_coop_causal_long8192',
  mixedTicks: FIELD_WISDOM_OPEN_TICKS,
  turbo: { fieldTurboMode: true, tickChunk: 16 },
  treatmentIds: TREATMENT_IDS,
  mixedEnvId: 'wisdom_evolution',
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  aggregate,
  batchVerdict,
  timing: { maxRunMs, batchDurationMs: performance.now() - batchStartedAt },
  roadmap: 'docs/PHASE121_COOP_LONG8192.md',
  goalDistance: 'docs/GOAL_DISTANCE.md',
};

writeFileSync(new URL('../docs/field-phase121-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 121 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: adv ${agg.meanCarryAdv} corr ${agg.meanCorr} complete ${agg.meanCompletion} avg ${formatFieldDuration(agg.meanDurationMs)} deadline${agg.deadlineHits}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);
console.log(`  H4 留置优势定律: ${batchVerdict.h4CarryAdvLaw ? '✓' : '✗'} (${batchVerdict.carryAdvPositiveSeeds}/4)`);
console.log(`  H6 on>off: ${batchVerdict.h6OnBeatsOff ? '✓' : '✗'} (on ${batchVerdict.meanCarryAdvOn} vs off ${batchVerdict.meanCarryAdvOff})`);
console.log(`  H8 tick完成: ${batchVerdict.h8TickComplete ? '✓' : '✗'}`);
console.log(`时长：单次最慢 ${formatFieldDuration(maxRunMs)}`);

await maybeUploadFieldReport(report, { phase: 121, label: 'field-phase121' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
if (maxRunMs > MAX_MS) process.exit(1);
console.log('\n✓ Phase 121 GAP-13×8192 田野完成');
