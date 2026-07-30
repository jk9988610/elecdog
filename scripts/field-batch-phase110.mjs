#!/usr/bin/env node
/**
 * Phase 110 — GAP-13 留置链 × COOP/SOC 合作因果
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE110_TREATMENTS, applyPhase110Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS, FIELD_SHORT_TICKS } from './lib/field-cohort.js';
import {
  analyzeCoopCausalChain,
  verifyCoopCausalBatch,
  slimCarryChainMetrics,
} from './lib/phase110-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE110_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const INCUBATE = FIELD_SHORT_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase110Treatment,
    treatmentId,
    seed,
    phase: 110,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) => analyzeCoopCausalChain(recorder, beings, world, ctx),
  });
  process.stdout.write(` ✓ ${run.durationLabel} carry${run.carryCount}\n`);
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 110 合作因果：塑形${TICKS}+孵化${INCUBATE}+混合${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE110_TREATMENTS[tid].label,
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    meanSocEnc: meanTreatment(runs, (r) => r.metrics.socEncCount),
    meanCrossRx: meanTreatment(runs, (r) => r.metrics.meanCrossRx),
    meanCarryCoopAdv: meanTreatment(runs, (r) => r.metrics.carryCoopAdvantage),
    meanCarryCrossAdv: meanTreatment(runs, (r) => r.metrics.carryCrossRxAdvantage),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanCorr: meanTreatment(runs, (r) => r.metrics.crossRxCoopCorr),
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyCoopCausalBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 110,
  extension: 'gap13_coop_causal_carry_chain',
  mode: 'field_stat',
  cohort: '10 naive + ≤2 carry × COOP/SOC factorial',
  ticks: TICKS,
  incubateTicks: INCUBATE,
  mixedEnvId: 'fertile_field',
  seeds: FIELD_SEEDS,
  treatmentIds: TREATMENT_IDS,
  aggregate,
  batchVerdict,
  shortTermGoal: '留置链田野上叠加 COOP/SOC 合作因果度量',
  roadmap: 'docs/PHASE110_COOP_CAUSAL.md',
  runBudgetMs: MAX_MS,
  batchDurationMs: performance.now() - batchStartedAt,
};

writeFileSync(new URL('../docs/field-phase110-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 110 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: COOP ${agg.meanCoop} SOC-ENC ${agg.meanSocEnc} carryAdv ${agg.meanCarryCoopAdv} corr ${agg.meanCorr}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.support}/7) coopLift ${batchVerdict.coopLift}`);
console.log(`  H1 链导入: ${batchVerdict.h1ChainImport ? '✓' : '✗'}`);
console.log(`  H2 无REN: ${batchVerdict.h2NoRen ? '✓' : '✗'}`);
console.log(`  H3 COOP可观测: ${batchVerdict.h3CoopObservable ? '✓' : '✗'}`);
console.log(`  H4 SOC可观测: ${batchVerdict.h4SocObservable ? '✓' : '✗'}`);
console.log(`  H5 留置合作优势: ${batchVerdict.h5CarryCoopAdvantage ? '✓' : '✗'}`);
console.log(`  H6 MESH/RIVAL: ${batchVerdict.h6MeshRival ? '✓' : '✗'}`);
console.log(`  H7 跨位RX↔COOP相关: ${batchVerdict.h7CrossRxCoopCorr ? '✓' : '✗'}`);

await maybeUploadFieldReport(report, { phase: 110, label: 'field-phase110' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 110 合作因果留置链田野完成');
