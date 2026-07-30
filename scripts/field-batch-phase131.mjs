#!/usr/bin/env node
/**
 * Phase 131 — WL-R1 繁殖邻域 SEM 域标记
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE131_TREATMENTS, applyPhase131Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeWlrSemDomain,
  verifyWlrSemDomainBatch,
  slimWlrSemDomainMetrics,
} from './lib/phase131-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE131_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase131Treatment,
    treatmentId,
    seed,
    phase: 131,
    ticks: FIELD_MED_TICKS,
    analyze: analyzeWlrSemDomain,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} carry${run.carryCount} coreR${m.semCoreR} ratio${m.semCoreRRatio}\n`
  );
  return run;
}

console.log(`Phase 131 WL-R1 SEM域标记 · 截止 ${formatFieldDuration(MAX_MS)}\n`);

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
    label: PHASE131_TREATMENTS[tid].label,
    meanCarry: meanTreatment(runs, (r) => r.carryCount),
    meanSemCoreR: meanTreatment(runs, (r) => r.metrics.semCoreR),
    meanSemCoreRRatio: meanTreatment(runs, (r) => r.metrics.semCoreRRatio),
    meanSemTagged: meanTreatment(runs, (r) => r.metrics.semTagged),
    meanPrq: meanTreatment(runs, (r) => r.metrics.prqCount),
    runs: runs.map((r) => ({ ...r, metrics: slimWlrSemDomainMetrics(r.metrics) })),
  };
}

const batchVerdict = verifyWlrSemDomainBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 131,
  extension: 'wl_r1_sem_domain',
  aggregate,
  batchVerdict,
  roadmap: 'docs/WL_REPRO_CENTER.md',
};

writeFileSync(new URL('../docs/field-phase131-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 131 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: coreR ${agg.meanSemCoreR} ratio ${agg.meanSemCoreRRatio} tagged ${agg.meanSemTagged} prq ${agg.meanPrq}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 131, report, label: 'field-phase131' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 131 田野完成');
