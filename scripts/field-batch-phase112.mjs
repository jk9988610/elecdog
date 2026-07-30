#!/usr/bin/env node
/**
 * Phase 112 — 四环境留置链：harsh → SEM 孵化 → 富足蓄积 → 混合
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE112_TREATMENTS, applyPhase112Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_SHORT_TICKS } from './lib/field-cohort.js';
import {
  analyzeQuadChain,
  verifyQuadChainBatch,
  slimCarryChainMetrics,
} from './lib/phase112-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE112_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const MIDDLE = FIELD_SHORT_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase112Treatment,
    treatmentId,
    seed,
    phase: 112,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeQuadChain(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel} carry${run.carryCount}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 112 四环境链：塑形${TICKS}+孵化${MIDDLE}+蓄积${MIDDLE}+混合${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE112_TREATMENTS[tid].label,
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.meanChainDepth),
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    meanTraceCarry: meanTreatment(runs, (r) => r.metrics.meanTraceWeightCarry),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyQuadChainBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 112,
  extension: 'gap_evo_carry_quad_chain',
  mode: 'field_stat',
  chain: 'harsh → wisdom(SEM) → fertile(COOP) → wisdom(mix)',
  ticks: TICKS,
  middleTicks: MIDDLE,
  seeds: FIELD_SEEDS,
  treatmentIds: TREATMENT_IDS,
  aggregate,
  batchVerdict,
  shortTermGoal: '四环境留置链 + 富足蓄积对照',
  roadmap: 'docs/PHASE112_QUAD_CHAIN.md',
  runBudgetMs: MAX_MS,
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase112-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 112 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: chain ${agg.meanChainDepth} COOP ${agg.meanCoop} traceC ${agg.meanTraceCarry} fiss ${agg.meanFiss}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7)`);
console.log(`  H1 链导入: ${batchVerdict.h1ChainImport ? '✓' : '✗'}`);
console.log(`  H2 无REN: ${batchVerdict.h2NoRen ? '✓' : '✗'}`);
console.log(`  H3 链深≥2: ${batchVerdict.h3ChainDepth2 ? '✓' : '✗'}`);
console.log(`  H4 留置有迹: ${batchVerdict.h4CarryTrace ? '✓' : '✗'}`);
console.log(`  H5 蓄积COOP: ${batchVerdict.h5CoopInAccrue ? '✓' : '✗'}`);
console.log(`  H6 四环境更深: ${batchVerdict.h6QuadDeeperChain ? '✓' : '✗'}`);
console.log(`  H7 四环境更多COOP: ${batchVerdict.h7QuadMoreCoop ? '✓' : '✗'} (quad ${batchVerdict.quadMeanCoop} vs ctrl ${batchVerdict.ctrlMeanCoop})`);

await maybeUploadFieldReport(report, { phase: 112, label: 'field-phase112' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 112 四环境留置链田野完成');
