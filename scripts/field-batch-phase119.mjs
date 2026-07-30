#!/usr/bin/env node
/**
 * Phase 119 — 8192 tick 长时稳健性（fieldTurboMode 空间换时间）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE119_TREATMENTS, applyPhase119Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_TICKS, FIELD_WISDOM_OPEN_TICKS } from './lib/field-cohort.js';
import {
  analyzeLongfieldRobustness,
  verifyLongfieldBatch,
  slimCarryChainMetrics,
} from './lib/phase119-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE119_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase119Treatment,
    treatmentId,
    seed,
    phase: 119,
    ticks: FIELD_TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeLongfieldRobustness(recorder, beings, world, ctx),
  });
  const flag = run.deadlineHit ? ' ⏱' : '';
  const turbo = PHASE119_TREATMENTS[treatmentId].fieldTurboMode ? '⚡' : '';
  process.stdout.write(` ✓ ${run.durationLabel}${turbo} done${run.metrics?.mixedTicksCompleted ?? '?'}${flag}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 119 长时稳健性：mixed${FIELD_WISDOM_OPEN_TICKS}(turbo) vs 960 × ${FIELD_SEEDS.length} 种子 · 截止 ${formatFieldDuration(MAX_MS)}`
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
    label: PHASE119_TREATMENTS[tid].label,
    mixedTicks: PHASE119_TREATMENTS[tid].mixedTicks,
    fieldTurboMode: PHASE119_TREATMENTS[tid].fieldTurboMode === true,
    meanCompletion: meanTreatment(runs, (r) => r.metrics.tickCompletionRate),
    meanMaxGen: meanTreatment(runs, (r) => r.metrics.maxGeneration),
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.maxChainDepth),
    meanDurationMs: meanTreatment(runs, (r) => r.durationMs),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyLongfieldBatch(byTreatment);
const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));
const batchDurationMs = performance.now() - batchStartedAt;

const report = {
  runAt: new Date().toISOString(),
  phase: 119,
  extension: 'gap_evo_carry_longfield_turbo',
  turbo: { fieldTurboMode: true, tickChunk: 16, recorderEntries: false },
  fieldRunDeadlineMs: MAX_MS,
  fieldMaxTicksPerPass: FIELD_MAX_TICKS_PER_PASS,
  treatmentIds: TREATMENT_IDS,
  mixedEnvId: 'wisdom_evolution',
  aggregate,
  batchVerdict,
  timing: { maxRunMs, batchDurationMs, maxRunLabel: formatFieldDuration(maxRunMs) },
  roadmap: 'docs/PHASE119_LONGFIELD_TURBO.md',
  goalDistance: 'docs/GOAL_DISTANCE.md',
};

writeFileSync(new URL('../docs/field-phase119-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 119 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: complete ${agg.meanCompletion} maxGen ${agg.meanMaxGen} depth ${agg.meanChainDepth} avg ${formatFieldDuration(agg.meanDurationMs)} deadline${agg.deadlineHits}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7)`);
console.log(`时长：单次最慢 ${formatFieldDuration(maxRunMs)} · 合计 ${formatFieldDuration(batchDurationMs)}`);

await maybeUploadFieldReport(report, { phase: 119, label: 'field-phase119' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
if (maxRunMs > MAX_MS) {
  console.error(`\n✗ 存在超时单次实验`);
  process.exit(1);
}
console.log('\n✓ Phase 119 长时稳健性田野完成');
