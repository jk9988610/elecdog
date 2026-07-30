#!/usr/bin/env node
/**
 * Phase 128 — GAP-PAIR-4 多维激素向量 h_k
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE128_TREATMENTS, applyPhase128Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { analyzePairHormvecRepro, verifyPairHormvecBatch } from './lib/phase128-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE128_TREATMENTS);
const TICKS = FIELD_MED_TICKS;

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase128Treatment,
    treatmentId,
    seed,
    phase: 128,
    ticks: TICKS,
    analyze: analyzePairHormvecRepro,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} hrm${m.hrmCount} pgr${m.pgrCount} inCh${m.fldInChCount} exp${m.expCount}\n`
  );
  return run;
}

console.log(`Phase 128 GAP-PAIR-4：多维激素 · ${TICKS} tick × ${FIELD_SEEDS.length} 种子\n`);

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
    label: PHASE128_TREATMENTS[tid].label,
    meanHrm: meanTreatment(runs, (r) => r.metrics.hrmCount),
    meanPgr: meanTreatment(runs, (r) => r.metrics.pgrCount),
    meanFldInCh: meanTreatment(runs, (r) => r.metrics.fldInChCount),
    meanExp: meanTreatment(runs, (r) => r.metrics.expCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const batchVerdict = verifyPairHormvecBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 128,
  extension: 'gap_pair_hormone_vector',
  gap: 'GAP-PAIR-4',
  ticks: TICKS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/GAP_PAIR_REPRO.md',
};

writeFileSync(new URL('../docs/field-phase128-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 128 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: hrm ${agg.meanHrm} pgr ${agg.meanPgr} inCh ${agg.meanFldInCh} exp ${agg.meanExp}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 128, report, label: 'field-phase128' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 128 GAP-PAIR-4 田野完成');
