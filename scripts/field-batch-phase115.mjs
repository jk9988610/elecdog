#!/usr/bin/env node
/**
 * Phase 115 — 五环境留置链
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE115_TREATMENTS, applyPhase115Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_SHORT_TICKS } from './lib/field-cohort.js';
import {
  analyzePentaChain,
  verifyPentaChainBatch,
  slimCarryChainMetrics,
} from './lib/phase115-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE115_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const MIDDLE = FIELD_SHORT_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase115Treatment,
    treatmentId,
    seed,
    phase: 115,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) => analyzePentaChain(recorder, beings, world, ctx),
  });
  const flag = run.deadlineHit ? ' ⏱' : '';
  process.stdout.write(` ✓ ${run.durationLabel} chain${run.carries?.[0]?.chainLen ?? 0}${flag}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 115 五环境链：塑形${TICKS}+中间通行+混合${TICKS} · 截止 ${formatFieldDuration(MAX_MS)} · tick顶 ${FIELD_MAX_TICKS_PER_PASS}`
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
    label: PHASE115_TREATMENTS[tid].label,
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.maxChainDepth),
    meanStages: meanTreatment(runs, (r) => r.metrics.chainStageCount),
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyPentaChainBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 115,
  extension: 'gap_evo_carry_penta_chain',
  chain: 'harsh → wisdom(SEM) → fertile(COOP) → wisdom(refine) → wisdom(mix)',
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/PHASE115_PENTA_CHAIN.md',
  goalDistance: 'docs/GOAL_DISTANCE.md',
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase115-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 115 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(`${tid}: depth ${agg.meanChainDepth} stages ${agg.meanStages} COOP ${agg.meanCoop} deadline${agg.deadlineHits}`);
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7)`);

await maybeUploadFieldReport(report, { phase: 115, label: 'field-phase115' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 115 五环境留置链田野完成');
