#!/usr/bin/env node
/**
 * Phase 41 — 续行代价 [RCO]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE41_TREATMENTS, applyPhase41Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import { analyzeRenewCost, compareRenewCost, comparePlgCost } from './lib/phase41-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE41_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase41Treatment,
    treatmentId,
    seed,
    phase: 41,
    ticks: FIELD_TICKS,
    analyze: analyzeRenewCost,
  });
}

console.log(
  `Phase 41 续行代价（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
);

const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…\n`);
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
    label: PHASE41_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanRen: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlg: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanRco: meanTreatment(runs, (r) => r.metrics.rcoEventCount),
    meanEnds: meanTreatment(runs, (r) => r.metrics.totalEnds),
    meanDebtEnds: meanTreatment(runs, (r) => r.metrics.renewDebtEnds),
    meanEntriesKept: meanTreatment(runs, (r) => r.entriesKept),
    runs,
  };
}

const comparisons = byTreatment.fertile_ren_free.map((r) => {
  const cost = byTreatment.fertile_ren_cost.find((x) => x.seed === r.seed);
  const plgCost = byTreatment.fertile_ren_plg_cost.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    freeVsCost: compareRenewCost(r.metrics, cost.metrics),
    costVsPlgCost: comparePlgCost(cost.metrics, plgCost.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 41,
  extension: 'renewal_cost_rco',
  gap: 'GAP-18',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE41_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    rco: 'REN/PLG 触发后：stressStreak↑、寄存器消耗、tickDebt↑、续行概率衰减、次数上限',
  },
  roadmap: 'docs/PHASE41_RENEW_COST.md',
};

writeFileSync(
  new URL('../docs/field-phase41-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(24), 'FISS', '存活', 'REN', 'PLG', 'RCO', 'END', '债务END', '日志');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanRen ?? '—').padStart(5),
    String(a.meanPlg ?? '—').padStart(5),
    String(a.meanRco ?? '—').padStart(5),
    String(a.meanEnds ?? '—').padStart(5),
    String(a.meanDebtEnds ?? '—').padStart(8),
    String(a.meanEntriesKept ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase41-report.json');
await maybeUploadFieldReport({ phase: 41, report });
