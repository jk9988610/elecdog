#!/usr/bin/env node
/**
 * Phase 78 — L6b 多情境开放泛化田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE78_TREATMENTS, applyPhase78Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeWisdomOpenField,
  compareContextGeneralizationForSeed,
  verifyContextGeneralizationBatch,
} from './lib/phase78-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE78_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase78Treatment,
    treatmentId,
    seed,
    phase: 78,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeWisdomOpenField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 78 L6b 多情境泛化：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 情境`
);
console.log(`单次实验上限：${formatFieldDuration(MAX_MS)}\n`);

const batchStartedAt = performance.now();
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
    label: PHASE78_TREATMENTS[tid].label,
    contextId: PHASE78_TREATMENTS[tid].wisdomContextId,
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanPrd: meanTreatment(runs, (r) => r.metrics.prdCount),
    meanSocEnc: meanTreatment(runs, (r) => r.metrics.socEncCount),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const perSeed = {};
  for (const tid of TREATMENT_IDS) {
    perSeed[tid] = byTreatment[tid].find((r) => r.seed === seed).metrics;
  }
  return { seed, ...compareContextGeneralizationForSeed(perSeed) };
});

const batchVerdict = verifyContextGeneralizationBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 78,
  extension: 'l6b_context_generalization',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE78_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'L6b 多情境开放泛化',
  roadmap: 'docs/PHASE78_CONTEXT_GENERALIZATION.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase78-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 情境均值 ===');
console.log('treatment'.padEnd(18), 'context', 'alive', 'PRD', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(18),
    String(a.contextId ?? '—').padStart(8),
    String(a.meanAlive ?? '—').padStart(6),
    String(a.meanPrd ?? '—').padStart(6),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 ===');
console.log(`H1 全情境存活: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 智慧层可观察: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 情境敏感行为: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 非单吸引子: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase78-report.json');

const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));
const totalBatchMs = performance.now() - batchStartedAt;
console.log(
  `时长：单次最慢 ${formatFieldDuration(maxRunMs)} · 合计 ${formatFieldDuration(totalBatchMs)}`
);
if (maxRunMs > MAX_MS) {
  console.error(`\n✗ 存在超时单次实验，田野不通过`);
  process.exit(1);
}
console.log('✓ 全部单次实验在预算内');

await maybeUploadFieldReport({ phase: 78, report });
