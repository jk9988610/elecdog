#!/usr/bin/env node
/**
 * Phase 133 — WL-R3 四域×繁殖核 2×2 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE133_TREATMENTS, applyPhase133Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeWlrFourDomainFactorial,
  verifyWlrFourDomainBatch,
  slimWlrFourDomainMetrics,
} from './lib/phase133-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE133_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase133Treatment,
    treatmentId,
    seed,
    phase: 133,
    ticks: FIELD_MED_TICKS,
    analyze: analyzeWlrFourDomainFactorial,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} carry${run.carryCount} couple${m.semCoreRFourCouplePairs} four${m.fourDomainCoupleTotal}\n`
  );
  return run;
}

console.log(`Phase 133 WL-R3 四域×繁殖核 2×2 · 截止 ${formatFieldDuration(MAX_MS)}\n`);

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
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
}

const aggregate = {};
for (const [tid, runs] of Object.entries(byTreatment)) {
  aggregate[tid] = {
    label: PHASE133_TREATMENTS[tid].label,
    meanCarry: meanTreatment(runs, (r) => r.carryCount),
    meanCoreR: meanTreatment(runs, (r) => r.metrics.semCoreR),
    meanCouplePairs: meanTreatment(runs, (r) => r.metrics.semCoreRFourCouplePairs),
    meanFourTotal: meanTreatment(runs, (r) => r.metrics.fourDomainCoupleTotal),
    runs: runs.map((r) => ({ ...r, metrics: slimWlrFourDomainMetrics(r.metrics) })),
  };
}

const batchVerdict = verifyWlrFourDomainBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 133,
  extension: 'wl_r3_four_domain_factorial',
  design: '2x2 semDomainTag x semFourDomainCouple',
  aggregate,
  batchVerdict,
  roadmap: 'docs/WL_REPRO_CENTER.md',
};

writeFileSync(new URL('../docs/field-phase133-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 133 2×2 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(`${tid}: coreR ${agg.meanCoreR} couple ${agg.meanCouplePairs} four ${agg.meanFourTotal}`);
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 133, report, label: 'field-phase133' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 133 田野完成');
