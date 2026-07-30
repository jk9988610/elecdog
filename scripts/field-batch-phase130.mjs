#!/usr/bin/env node
/**
 * Phase 130 — 六环境链 × PAIR-2/3/4 全栈
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE130_TREATMENTS, applyPhase130Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeChainPairFull,
  verifyChainPairFullBatch,
  slimCarryChainMetrics,
} from './lib/phase130-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE130_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase130Treatment,
    treatmentId,
    seed,
    phase: 130,
    ticks: FIELD_MED_TICKS,
    analyze: analyzeChainPairFull,
  });
  const m = run.metrics;
  process.stdout.write(
    ` ✓ ${run.durationLabel} carry${run.carryCount} prq${m.prqCount} fldCh${m.fldChCount} hrm${m.hrmCount}\n`
  );
  return run;
}

console.log(`Phase 130 六环境链×PAIR全栈 · 截止 ${formatFieldDuration(MAX_MS)}\n`);

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
    label: PHASE130_TREATMENTS[tid].label,
    meanCarry: meanTreatment(runs, (r) => r.carryCount),
    meanPrq: meanTreatment(runs, (r) => r.metrics.prqCount),
    meanFldCh: meanTreatment(runs, (r) => r.metrics.fldChCount),
    meanHrm: meanTreatment(runs, (r) => r.metrics.hrmCount),
    meanFusIn: meanTreatment(runs, (r) => r.metrics.fusInCount),
    runs: runs.map((r) => ({ ...r, metrics: slimCarryChainMetrics(r.metrics) })),
  };
}

const batchVerdict = verifyChainPairFullBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 130,
  extension: 'gap_chain_pair_full',
  aggregate,
  batchVerdict,
  roadmap: 'docs/PHASE129_CHAIN_PAIR.md',
};

writeFileSync(new URL('../docs/field-phase130-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 130 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(`${tid}: prq ${agg.meanPrq} fldCh ${agg.meanFldCh} hrm ${agg.meanHrm} fusIn ${agg.meanFusIn}`);
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 130, report, label: 'field-phase130' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 130 田野完成');
