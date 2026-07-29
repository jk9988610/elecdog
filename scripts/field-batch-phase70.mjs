#!/usr/bin/env node
/**
 * Phase 70 — W1 记忆→行为闭环：mem on/off 多种子田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE70_TREATMENTS, applyPhase70Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeMemoryFeedback,
  compareMemOnVsOff,
  verifyMemFieldBatch,
} from './lib/phase70-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE70_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase70Treatment,
    treatmentId,
    seed,
    phase: 70,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeMemoryFeedback(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 70 W1 记忆闭环：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`单次实验上限：${formatFieldDuration(MAX_MS)}（超时即不通过）\n`);

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
    label: PHASE70_TREATMENTS[tid].label,
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    meanActShare: meanTreatment(runs, (r) => r.metrics.actShare),
    meanMemRxLoad: meanTreatment(runs, (r) => r.metrics.meanMemRxLoad),
    meanMemActLoad: meanTreatment(runs, (r) => r.metrics.meanMemActLoad),
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const off = byTreatment.wisdom_mem_off.find((r) => r.seed === seed);
  const on = byTreatment.wisdom_mem_on.find((r) => r.seed === seed);
  return {
    seed,
    ...compareMemOnVsOff(off.metrics, on.metrics),
  };
});

const batchVerdict = verifyMemFieldBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 70,
  extension: 'wisdom_memory_feedback',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE70_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'W1 记忆→行为闭环',
  roadmap: 'docs/PHASE70_MEMORY_FEEDBACK.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase70-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(22),
  '对外率',
  'ACT占比',
  'memRx',
  'memAct',
  'H3%',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanExternalRate ?? '—').padStart(6),
    String(a.meanActShare ?? '—').padStart(7),
    String(a.meanMemRxLoad ?? '—').padStart(6),
    String(a.meanMemActLoad ?? '—').padStart(7),
    String(a.meanH3Share != null ? (a.meanH3Share * 100).toFixed(0) + '%' : '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n=== 批次判定 ===');
console.log(`H1 支持种子: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`方向一致: ${batchVerdict.signConsistent ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase70-report.json');

const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));
const totalBatchMs = performance.now() - batchStartedAt;
console.log(
  `时长：单次最慢 ${formatFieldDuration(maxRunMs)} · 合计 ${formatFieldDuration(totalBatchMs)} · 上限 ${formatFieldDuration(MAX_MS)}/次`
);
if (maxRunMs > MAX_MS) {
  console.error(`\n✗ 存在超时单次实验，田野不通过`);
  process.exit(1);
}
console.log('✓ 全部单次实验在预算内');

await maybeUploadFieldReport({ phase: 70, report });
