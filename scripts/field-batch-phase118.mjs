#!/usr/bin/env node
/**
 * Phase 118 — GAP-13 六环境+链 × 多批次合作因果定律
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE118_TREATMENTS, applyPhase118Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeCoopCausalLaw,
  verifyCoopCausalLawBatch,
  slimCarryChainMetrics,
} from './lib/phase118-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE118_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase118Treatment,
    treatmentId,
    seed,
    phase: 118,
    ticks: FIELD_TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeCoopCausalLaw(recorder, beings, world, ctx),
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
  `Phase 118 GAP-13 因果定律：六环境+链 mixed${FIELD_TICKS} × ${FIELD_SEEDS.length} 种子 · 截止 ${formatFieldDuration(MAX_MS)}`
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
    label: PHASE118_TREATMENTS[tid].label,
    mixedTicks: PHASE118_TREATMENTS[tid].mixedTicks,
    meanCarryAdv: meanTreatment(runs, (r) => r.metrics.carryCoopAdvantage),
    meanCorr: meanTreatment(runs, (r) => r.metrics.crossRxCoopCorr),
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.maxChainDepth),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyCoopCausalLawBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 118,
  extension: 'gap13_coop_causal_law',
  chain: 'hexa + mixed COOP/SOC',
  seeds: FIELD_SEEDS,
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/PHASE118_COOP_LAW.md',
  goalDistance: 'docs/GOAL_DISTANCE.md',
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase118-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 118 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: adv ${agg.meanCarryAdv} corr ${agg.meanCorr} COOP ${agg.meanCoop} depth ${agg.meanChainDepth} deadline${agg.deadlineHits}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7)`);
console.log(`  H4 留置优势定律(≥3/4): ${batchVerdict.h4CarryAdvLaw ? '✓' : '✗'} (${batchVerdict.carryAdvPositiveSeeds}/4)`);
console.log(`  H5 相关符号一致(≥3/4): ${batchVerdict.h5CorrSignLaw ? '✓' : '✗'} (${batchVerdict.corrSignConsistentSeeds}/4)`);
console.log(`  H6 on>off: ${batchVerdict.h6OnBeatsOff ? '✓' : '✗'} (on ${batchVerdict.meanCarryAdvOn} vs off ${batchVerdict.meanCarryAdvOff})`);

await maybeUploadFieldReport(report, { phase: 118, label: 'field-phase118' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 118 GAP-13 合作因果定律田野完成');
