#!/usr/bin/env node
/**
 * Phase 123 — GAP-13 留置繁殖×SOC 继承交互假说（8192 · turbo）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE123_TREATMENTS, applyPhase123Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_WISDOM_OPEN_TICKS } from './lib/field-cohort.js';
import {
  analyzeCarryInteractionLaw,
  verifyCarryInteractionLawBatch,
  slimCarryChainMetrics,
} from './lib/phase123-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE123_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase123Treatment,
    treatmentId,
    seed,
    phase: 123,
    ticks: FIELD_WISDOM_OPEN_TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeCarryInteractionLaw(recorder, beings, world, ctx),
  });
  const flag = run.deadlineHit ? ' ⏱' : '';
  const yld = run.metrics?.carryReproSocYield ?? '?';
  process.stdout.write(` ✓ ${run.durationLabel} yield${yld}${flag}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 123 GAP-13 留置交互：COOP on/off · mixed${FIELD_WISDOM_OPEN_TICKS} turbo × ${FIELD_SEEDS.length} 种子 · 截止 ${formatFieldDuration(MAX_MS)}`
);
console.log('假说：留置繁殖×SOC 继承（carryReproSocYield = socLin / carriedFiss）\n');

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
    label: PHASE123_TREATMENTS[tid].label,
    mixedTicks: PHASE123_TREATMENTS[tid].mixedTicks,
    meanCarryReproSocYield: meanTreatment(runs, (r) => r.metrics.carryReproSocYield),
    meanSocLoad: meanTreatment(runs, (r) => r.metrics.meanSocLoad),
    meanSocLin: meanTreatment(runs, (r) => r.metrics.socLinCount),
    meanCarriedFiss: meanTreatment(runs, (r) => r.metrics.carriedFiss),
    meanCompletion: meanTreatment(runs, (r) => r.metrics.tickCompletionRate),
    meanDurationMs: meanTreatment(runs, (r) => r.durationMs),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyCarryInteractionLawBatch(byTreatment);
const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));

const report = {
  runAt: new Date().toISOString(),
  phase: 123,
  extension: 'gap13_carry_interaction_soc_yield',
  hypothesis: 'carry_repro_soc_yield',
  priorHypothesis: 'carry_coop_advantage',
  mixedTicks: FIELD_WISDOM_OPEN_TICKS,
  turbo: { fieldTurboMode: true, tickChunk: 16 },
  treatmentIds: TREATMENT_IDS,
  mixedEnvId: 'wisdom_evolution',
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  aggregate,
  batchVerdict,
  timing: { maxRunMs, batchDurationMs: performance.now() - batchStartedAt },
  roadmap: 'docs/PHASE123_COOP_INTERACT.md',
  goalDistance: 'docs/GOAL_DISTANCE.md',
};

writeFileSync(new URL('../docs/field-phase123-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 123 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: yield ${agg.meanCarryReproSocYield} socLoad ${agg.meanSocLoad} socLin ${agg.meanSocLin} fiss ${agg.meanCarriedFiss} avg ${formatFieldDuration(agg.meanDurationMs)} deadline${agg.deadlineHits}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);
console.log(
  `  H4 留置繁殖SOC产量: ${batchVerdict.h4CarryReproSocYieldLaw ? '✓' : '✗'} (${batchVerdict.carryReproSocYieldPositiveSeeds}/4 ≥8)`
);
console.log(
  `  H6 on>off: ${batchVerdict.h6InteractOnBeatsOff ? '✓' : '✗'} (on ${batchVerdict.meanCarryReproSocYieldOn} vs off ${batchVerdict.meanCarryReproSocYieldOff})`
);
console.log(`  H8 tick完成: ${batchVerdict.h8TickComplete ? '✓' : '✗'}`);
console.log(`时长：单次最慢 ${formatFieldDuration(maxRunMs)}`);

await maybeUploadFieldReport(report, { phase: 123, label: 'field-phase123' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
if (maxRunMs > MAX_MS) process.exit(1);
console.log('\n✓ Phase 123 GAP-13 留置交互假说田野完成');
