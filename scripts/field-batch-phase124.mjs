#!/usr/bin/env node
/**
 * Phase 124 — GAP-PAIR-0 体内合胞双源繁殖（无握手·关FISS）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE124_TREATMENTS, applyPhase124Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import { analyzePairRepro, verifyPairReproBatch } from './lib/phase124-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE124_TREATMENTS);
const TICKS = FIELD_MED_TICKS;

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase124Treatment,
    treatmentId,
    seed,
    phase: 124,
    ticks: TICKS,
    analyze: analyzePairRepro,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} fusIn${m.fusInCount} exp${m.expCount} off${m.pairOffspringAlive}\n`
  );
  return run;
}

console.log(`Phase 124 GAP-PAIR-0：4体(2A+2B) · ${TICKS} tick × ${FIELD_SEEDS.length} 种子\n`);

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
    label: PHASE124_TREATMENTS[tid].label,
    meanFusIn: meanTreatment(runs, (r) => r.metrics.fusInCount),
    meanExp: meanTreatment(runs, (r) => r.metrics.expCount),
    meanEmb: meanTreatment(runs, (r) => r.metrics.embCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanOffspring: meanTreatment(runs, (r) => r.metrics.pairOffspringAlive),
    runs,
  };
}

const batchVerdict = verifyPairReproBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 124,
  extension: 'gap_pair_repro_min',
  gap: 'GAP-PAIR-0',
  ticks: TICKS,
  cohort: '4 beings (2 morphA + 2 morphB)',
  treatmentIds: TREATMENT_IDS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/GAP_PAIR_REPRO.md',
};

writeFileSync(new URL('../docs/field-phase124-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 124 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: fusIn ${agg.meanFusIn} exp ${agg.meanExp} fiss ${agg.meanFiss} offspring ${agg.meanOffspring}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 124, report, label: 'field-phase124' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 124 GAP-PAIR-0 田野完成');
