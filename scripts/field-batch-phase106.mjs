#!/usr/bin/env node
/**
 * Phase 106 — 进化留置队列 + 生态分裂（640 tick 塑形 + 640 tick 混合）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE106_TREATMENTS, applyPhase106Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeEvoCarry,
  verifyEvoCarryBatch,
  slimEvoCarryMetrics,
} from './lib/phase106-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE106_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase106Treatment,
    treatmentId,
    seed,
    phase: 106,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeEvoCarry(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel} carry${run.carryCount}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimEvoCarryMetrics(run.metrics) };
}

console.log(
  `Phase 106 进化留置：塑形${TICKS}+混合${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE106_TREATMENTS[tid].label,
    meanMei: meanTreatment(runs, (r) => r.metrics.meiCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusCount),
    meanRen: meanTreatment(runs, (r) => r.metrics.renCount),
    meanEcoFiss: meanTreatment(runs, (r) => r.metrics.ecoFissCount),
    meanCarryRen: meanTreatment(runs, (r) => r.metrics.carriedRenTicks),
    meanOffspring: meanTreatment(runs, (r) => r.metrics.offspringAlive),
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyEvoCarryBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 106,
  extension: 'gap_evo_carry',
  mode: 'field_stat',
  cohort: '10 naive + ≤2 carry (mixed)',
  ticks: TICKS,
  sculptTicks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE106_TREATMENTS,
  aggregate,
  batchVerdict,
  shortTermGoal: 'GAP-EVO-CARRY 留置个体 + 生态分裂',
  roadmap: 'docs/PHASE106_EVO_CARRY.md',
  runBudgetMs: MAX_MS,
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase106-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 106 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: MEI ${agg.meanMei} FISS ${agg.meanFiss} FUS ${agg.meanFus} REN ${agg.meanRen} ecoFISS ${agg.meanEcoFiss}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/4)`);
console.log(`  H1 留置导入: ${batchVerdict.h1CarryImported ? '✓' : '✗'}`);
console.log(`  H2 留置无REN: ${batchVerdict.h2NoCarryRen ? '✓' : '✗'}`);
console.log(`  H3 有丝分裂可观测: ${batchVerdict.h3MeiFusObserved ? '✓' : '✗'}`);
console.log(`  H4 生态FISS可观测: ${batchVerdict.h4EcoFissObserved ? '✓' : '✗'}`);
console.log(`  H5 后代超留置数: ${batchVerdict.h5OffspringBeyondCarry ? '✓' : '✗'}`);

await maybeUploadFieldReport(report, { phase: 106, label: 'field-phase106' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 106 进化留置田野完成');
