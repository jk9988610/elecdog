#!/usr/bin/env node
/**
 * Phase 77 — W5 长时开放演化田野（1920 vs 8192 tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE77_TREATMENTS, applyPhase77Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import {
  FIELD_SEEDS,
  FIELD_LONG_TICKS,
  FIELD_WISDOM_OPEN_TICKS,
} from './lib/field-cohort.js';
import {
  analyzeWisdomOpenField,
  compareOpen8192vs1920,
  verifyOpenFieldBatch,
} from './lib/phase77-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE77_TREATMENTS);
const MAX_MS = getFieldRunMaxMs();

const TICKS_BY_TREATMENT = {
  w5_std_1920: FIELD_LONG_TICKS,
  w5_open_8192: FIELD_WISDOM_OPEN_TICKS,
};

function runOne(treatmentId, seed) {
  const ticks = TICKS_BY_TREATMENT[treatmentId] ?? FIELD_LONG_TICKS;
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase77Treatment,
    treatmentId,
    seed,
    phase: 77,
    ticks,
    analyze: (recorder, beings, world, ctx) =>
      analyzeWisdomOpenField(recorder, beings, world, { ticks: ctx?.ticks ?? ticks }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 77 W5 长时开放演化：12体 ${FIELD_LONG_TICKS}/${FIELD_WISDOM_OPEN_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE77_TREATMENTS[tid].label,
    ticks: TICKS_BY_TREATMENT[tid],
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanMaxGen: meanTreatment(runs, (r) => r.metrics.maxGeneration),
    meanPrd: meanTreatment(runs, (r) => r.metrics.prdCount),
    meanSocEnc: meanTreatment(runs, (r) => r.metrics.socEncCount),
    meanMemLin: meanTreatment(runs, (r) => r.metrics.memLinCount),
    meanModeDiv: meanTreatment(runs, (r) => r.metrics.modeDiversity),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const short = byTreatment.w5_std_1920.find((r) => r.seed === seed);
  const long = byTreatment.w5_open_8192.find((r) => r.seed === seed);
  return { seed, ...compareOpen8192vs1920(short.metrics, long.metrics) };
});

const batchVerdict = verifyOpenFieldBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 77,
  extension: 'w5_open_longfield',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: { standard: FIELD_LONG_TICKS, open: FIELD_WISDOM_OPEN_TICKS },
  seeds: FIELD_SEEDS,
  treatments: PHASE77_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'W5 长时开放演化',
  roadmap: 'docs/PHASE77_LONGFIELD_OPEN.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase77-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(18), 'ticks', 'alive', 'maxGen', 'PRD', 'SOC', 'mode', '对外率');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(18),
    String(a.ticks ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(6),
    String(a.meanMaxGen ?? '—').padStart(7),
    String(a.meanPrd ?? '—').padStart(6),
    String(a.meanSocEnc ?? '—').padStart(6),
    String(a.meanModeDiv ?? '—').padStart(5),
    String(a.meanExternalRate ?? '—').padStart(7)
  );
}

console.log('\n=== 批次判定 ===');
console.log(`H1 种群持续: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 智慧层可观察: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 更深演化: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 行为开放: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase77-report.json');

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

await maybeUploadFieldReport({ phase: 77, report });
