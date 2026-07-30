#!/usr/bin/env node
/**
 * Phase 127 — GAP-PAIR-3 subCell / r_k 通道绑定
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE127_TREATMENTS, applyPhase127Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { analyzePairChannelRepro, verifyPairChannelBatch } from './lib/phase127-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE127_TREATMENTS);
const TICKS = FIELD_MED_TICKS;

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase127Treatment,
    treatmentId,
    seed,
    phase: 127,
    ticks: TICKS,
    analyze: analyzePairChannelRepro,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} fldCh${m.fldChCount} inCh${m.fldInChCount} exp${m.expCount}\n`
  );
  return run;
}

console.log(`Phase 127 GAP-PAIR-3：通道绑定 · ${TICKS} tick × ${FIELD_SEEDS.length} 种子\n`);

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
    label: PHASE127_TREATMENTS[tid].label,
    meanFldCh: meanTreatment(runs, (r) => r.metrics.fldChCount),
    meanFldInCh: meanTreatment(runs, (r) => r.metrics.fldInChCount),
    meanExp: meanTreatment(runs, (r) => r.metrics.expCount),
    meanPrq: meanTreatment(runs, (r) => r.metrics.prqCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const batchVerdict = verifyPairChannelBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 127,
  extension: 'gap_pair_channel_bind',
  gap: 'GAP-PAIR-3',
  ticks: TICKS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/GAP_PAIR_REPRO.md',
};

writeFileSync(new URL('../docs/field-phase127-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 127 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: fldCh ${agg.meanFldCh} inCh ${agg.meanFldInCh} prq ${agg.meanPrq} exp ${agg.meanExp}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 127, report, label: 'field-phase127' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 127 GAP-PAIR-3 田野完成');
