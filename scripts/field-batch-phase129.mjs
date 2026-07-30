#!/usr/bin/env node
/**
 * Phase 129 — 六环境链 × PAIR-0 混合繁殖
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE129_TREATMENTS, applyPhase129Treatment } from '../src/world/env-profile.js';
import { runFieldCarryScenario } from './lib/field-carry-run.js';
import { FIELD_SEEDS, FIELD_MED_TICKS } from './lib/field-cohort.js';
import {
  analyzeChainPair,
  verifyChainPairBatch,
  slimCarryChainMetrics,
} from './lib/phase129-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs, FIELD_MAX_TICKS_PER_PASS } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE129_TREATMENTS);
const TICKS = FIELD_MED_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldCarryScenario({
    createWorld,
    applyTreatment: applyPhase129Treatment,
    treatmentId,
    seed,
    phase: 129,
    ticks: TICKS,
    analyze: analyzeChainPair,
  });
  const m = run.metrics;
  const flag = run.deadlineHit ? ' ⏱' : '';
  process.stdout.write(
    ` ✓ ${run.durationLabel} carry${run.carryCount} fusIn${m.fusInCount ?? 0} exp${m.expCount ?? 0}${flag}\n`
  );
  return run;
}

function slimRun(run) {
  return { ...run, metrics: slimCarryChainMetrics(run.metrics) };
}

console.log(
  `Phase 129 六环境链×PAIR：塑形+5中间+混合 · 截止 ${formatFieldDuration(MAX_MS)} · tick顶 ${FIELD_MAX_TICKS_PER_PASS}\n`
);

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
    label: PHASE129_TREATMENTS[tid].label,
    meanCarry: meanTreatment(runs, (r) => r.carryCount),
    meanChainDepth: meanTreatment(runs, (r) => r.metrics.maxChainDepth),
    meanFusIn: meanTreatment(runs, (r) => r.metrics.fusInCount),
    meanExp: meanTreatment(runs, (r) => r.metrics.expCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    deadlineHits: runs.filter((r) => r.deadlineHit).length,
    runs: runs.map(slimRun),
  };
}

const batchVerdict = verifyChainPairBatch(byTreatment);
const report = {
  runAt: new Date().toISOString(),
  phase: 129,
  extension: 'gap_chain_pair',
  gap: 'GAP-CHAIN-PAIR',
  chain: 'harsh → wisdom(SEM) → fertile(COOP) → refine → stress-echo → SOC → mixed(PAIR|FISS)',
  fieldRunDeadlineMs: MAX_MS,
  aggregate,
  batchVerdict,
  roadmap: 'docs/PHASE129_CHAIN_PAIR.md',
};

writeFileSync(new URL('../docs/field-phase129-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('\n--- Phase 129 汇总 ---');
for (const [tid, agg] of Object.entries(aggregate)) {
  console.log(
    `${tid}: carry ${agg.meanCarry} depth ${agg.meanChainDepth} fusIn ${agg.meanFusIn} exp ${agg.meanExp} fiss ${agg.meanFiss}`
  );
}
console.log(`\n批次结论：${batchVerdict.verdict} (${batchVerdict.passed}/${batchVerdict.total})`);

await maybeUploadFieldReport({ phase: 129, report, label: 'field-phase129' });

if (batchVerdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 129 六环境链×PAIR 田野完成');
