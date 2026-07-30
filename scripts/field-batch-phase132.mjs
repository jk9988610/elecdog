#!/usr/bin/env node
/**
 * Phase 132 — WL-R2 链×PAIR 混编跨代繁殖载荷迹
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE132_TREATMENTS, applyPhase132Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeWlrReproLineage,
  verifyWlrReproLineageBatch,
  slimWlrReproLineageMetrics,
} from './lib/phase132-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE132_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase132Treatment,
    treatmentId,
    seed,
    phase: 132,
    ticks: FIELD_MED_TICKS,
    analyze: analyzeWlrReproLineage,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} carry${run.carryCount} lin${m.semLinPairExp} repro${m.meanReproTraceCarryOffspring}\n`
  );
  return run;
}

console.log(`Phase 132 WL-R2 繁殖域跨代迹 · 截止 ${formatFieldDuration(MAX_MS)}\n`);

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
    label: PHASE132_TREATMENTS[tid].label,
    meanCarry: meanTreatment(runs, (r) => r.carryCount),
    meanSemLinPairExp: meanTreatment(runs, (r) => r.metrics.semLinPairExp),
    meanReproTraceCarry: meanTreatment(runs, (r) => r.metrics.meanReproTraceCarryOffspring),
    meanReproTracePairExp: meanTreatment(runs, (r) => r.metrics.meanReproTracePairExp),
    runs: runs.map((r) => ({ ...r, metrics: slimWlrReproLineageMetrics(r.metrics) })),
  };
}

const batchVerdict = verifyWlrReproLineageBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 132,
  extension: 'wl_r2_repro_lineage',
  aggregate,
  batchVerdict,
  roadmap: 'docs/WL_REPRO_CENTER.md',
};

writeFileSync(new URL('../docs/field-phase132-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 132 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: linPairExp ${agg.meanSemLinPairExp} reproCarry ${agg.meanReproTraceCarry} pairExp ${agg.meanReproTracePairExp}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 132, report, label: 'field-phase132' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 132 田野完成');
