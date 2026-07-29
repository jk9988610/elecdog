#!/usr/bin/env node
/**
 * Phase 76 — W4 谱系记忆回响田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE76_TREATMENTS, applyPhase76Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeMemLineageEcho,
  compareMemEchoOnVsOff,
  verifyMemEchoFieldBatch,
} from './lib/phase76-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE76_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase76Treatment,
    treatmentId,
    seed,
    phase: 76,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeMemLineageEcho(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 76 W4 谱系记忆回响：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
    label: PHASE76_TREATMENTS[tid].label,
    meanMemLin: meanTreatment(runs, (r) => r.metrics.memLinCount),
    meanWithEcho: meanTreatment(runs, (r) => r.metrics.withEchoCount),
    meanEchoAct: meanTreatment(runs, (r) => r.metrics.meanEchoAct),
    meanExternalRate: meanTreatment(runs, (r) => r.metrics.externalRate),
    meanEchoOffspringRate: meanTreatment(runs, (r) => r.metrics.echoOffspringRate),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const off = byTreatment.w4_mem_echo_off.find((r) => r.seed === seed);
  const on = byTreatment.w4_mem_echo_on.find((r) => r.seed === seed);
  return { seed, ...compareMemEchoOnVsOff(off.metrics, on.metrics) };
});

const batchVerdict = verifyMemEchoFieldBatch(comparisons);

const report = {
  runAt: new Date().toISOString(),
  phase: 76,
  extension: 'w4_mem_lineage_echo',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE76_TREATMENTS,
  aggregate,
  comparisons,
  batchVerdict,
  shortTermGoal: 'W4 谱系记忆回响',
  roadmap: 'docs/PHASE76_LINEAGE_MEMORY.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase76-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(20), 'MEM-LIN', 'echo#', 'echoAct', '对外率', '回响子代');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(20),
    String(a.meanMemLin ?? '—').padStart(7),
    String(a.meanWithEcho ?? '—').padStart(6),
    String(a.meanEchoAct ?? '—').padStart(8),
    String(a.meanExternalRate ?? '—').padStart(7),
    String(a.meanEchoOffspringRate ?? '—').padStart(9)
  );
}

console.log('\n=== 批次判定 ===');
console.log(`H1 MEM-LIN可观察: ${batchVerdict.h1Support}/${batchVerdict.seedsCompared}`);
console.log(`H2 回响播种: ${batchVerdict.h2Support}/${batchVerdict.seedsCompared}`);
console.log(`H3 W1行为联动: ${batchVerdict.h3Support}/${batchVerdict.seedsCompared}`);
console.log(`H4 子代差异: ${batchVerdict.h4Support}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase76-report.json');

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

await maybeUploadFieldReport({ phase: 76, report });
