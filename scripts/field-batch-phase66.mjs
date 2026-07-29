#!/usr/bin/env node
/**
 * Phase 66 — 意识可持续：谱系×续行×H3 跨代并存
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE66_TREATMENTS, applyPhase66Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_XLONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeConsciousnessSustain,
  verifyConsciousnessSustain,
} from './lib/phase66-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE66_TREATMENTS);
const TICKS = FIELD_XLONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase66Treatment,
    treatmentId,
    seed,
    phase: 66,
    ticks: TICKS,
    analyze: analyzeConsciousnessSustain,
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 66 意识可持续：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
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
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
}

const aggregate = {};
for (const [tid, runs] of Object.entries(byTreatment)) {
  aggregate[tid] = {
    label: PHASE66_TREATMENTS[tid].label,
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanMaxGen: meanTreatment(runs, (r) => r.metrics.maxGeneration),
    meanLineageH3: meanTreatment(runs, (r) => r.metrics.h3InLineage),
    meanEhuRen: meanTreatment(runs, (r) => r.metrics.ehuRenCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    sustainRate: meanTreatment(runs, (r) => (r.metrics.sustainCoexist ? 1 : 0)),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const full = byTreatment.cn_sustain_full_3840.find((r) => r.seed === seed);
  const off = byTreatment.cn_sustain_lin_off_3840.find((r) => r.seed === seed);
  return {
    seed,
    sustain: verifyConsciousnessSustain(full.metrics, off.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 66,
  extension: 'consciousness_sustain',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE66_TREATMENTS,
  aggregate,
  comparisons,
  shortTermGoal: 'T6 跨代可持续',
  roadmap: 'docs/PHASE66_CONSCIOUSNESS_SUSTAIN.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase66-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(26), 'H3%', 'maxGen', '谱系H3', 'EHU-R', 'LIN', '可持续');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(26),
    String(a.meanH3Share != null ? (a.meanH3Share * 100).toFixed(0) + '%' : '—').padStart(5),
    String(a.meanMaxGen ?? '—').padStart(7),
    String(a.meanLineageH3 ?? '—').padStart(7),
    String(a.meanEhuRen ?? '—').padStart(7),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.sustainRate != null ? (a.sustainRate * 100).toFixed(0) + '%' : '—').padStart(7)
  );
}

console.log('\n报告已写入 docs/field-phase66-report.json');

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

await maybeUploadFieldReport({ phase: 66, report });
