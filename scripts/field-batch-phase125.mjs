#!/usr/bin/env node
/**
 * Phase 125 — GAP-PAIR-1 半态排入环境场
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE125_TREATMENTS, applyPhase125Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { analyzePairFieldRepro, verifyPairFieldBatch } from './lib/phase125-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE125_TREATMENTS);
const TICKS = FIELD_MED_TICKS;

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase125Treatment,
    treatmentId,
    seed,
    phase: 125,
    ticks: TICKS,
    analyze: analyzePairFieldRepro,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} fld${m.fldReleaseCount} in${m.fldInCount} exp${m.expCount}\n`
  );
  return run;
}

console.log(`Phase 125 GAP-PAIR-1：半态排入场 · ${TICKS} tick × ${FIELD_SEEDS.length} 种子\n`);

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
    label: PHASE125_TREATMENTS[tid].label,
    meanFld: meanTreatment(runs, (r) => r.metrics.fldReleaseCount),
    meanFldIn: meanTreatment(runs, (r) => r.metrics.fldInCount),
    meanFusIn: meanTreatment(runs, (r) => r.metrics.fusInCount),
    meanExp: meanTreatment(runs, (r) => r.metrics.expCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const batchVerdict = verifyPairFieldBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 125,
  extension: 'gap_pair_field_release',
  gap: 'GAP-PAIR-1',
  ticks: TICKS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/GAP_PAIR_REPRO.md',
};

writeFileSync(new URL('../docs/field-phase125-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 125 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(`${tid}: fld ${agg.meanFld} fldIn ${agg.meanFldIn} fusIn ${agg.meanFusIn} exp ${agg.meanExp}`);
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 125, report, label: 'field-phase125' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 125 GAP-PAIR-1 田野完成');
