#!/usr/bin/env node
/**
 * Phase 126 — GAP-PAIR-2 许可握手 [PRQ]/[PGR]
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE126_TREATMENTS, applyPhase126Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { analyzePairHandshakeRepro, verifyPairHandshakeBatch } from './lib/phase126-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE126_TREATMENTS);
const TICKS = FIELD_MED_TICKS;

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase126Treatment,
    treatmentId,
    seed,
    phase: 126,
    ticks: TICKS,
    analyze: analyzePairHandshakeRepro,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} prq${m.prqCount} pgr${m.pgrCount} fld${m.fldReleaseCount} exp${m.expCount}\n`
  );
  return run;
}

console.log(`Phase 126 GAP-PAIR-2：许可握手 · ${TICKS} tick × ${FIELD_SEEDS.length} 种子\n`);

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
    label: PHASE126_TREATMENTS[tid].label,
    meanPrq: meanTreatment(runs, (r) => r.metrics.prqCount),
    meanPgr: meanTreatment(runs, (r) => r.metrics.pgrCount),
    meanFld: meanTreatment(runs, (r) => r.metrics.fldReleaseCount),
    meanFldIn: meanTreatment(runs, (r) => r.metrics.fldInCount),
    meanExp: meanTreatment(runs, (r) => r.metrics.expCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const batchVerdict = verifyPairHandshakeBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 126,
  extension: 'gap_pair_handshake',
  gap: 'GAP-PAIR-2',
  ticks: TICKS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/GAP_PAIR_REPRO.md',
};

writeFileSync(new URL('../docs/field-phase126-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 126 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: prq ${agg.meanPrq} pgr ${agg.meanPgr} fld ${agg.meanFld} fldIn ${agg.meanFldIn} exp ${agg.meanExp}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 126, report, label: 'field-phase126' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 126 GAP-PAIR-2 田野完成');
