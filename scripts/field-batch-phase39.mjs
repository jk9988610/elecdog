#!/usr/bin/env node
/**
 * Phase 39 — [REN] 环境重置 / [PLG] 双体通量汇合（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE39_TREATMENTS, applyPhase39Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import { analyzeRenewPlg, compareRenPlg } from './lib/phase39-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE39_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase39Treatment,
    treatmentId,
    seed,
    phase: 39,
    ticks: FIELD_TICKS,
    analyze: analyzeRenewPlg,
  });
}

console.log(
  `Phase 39 REN/PLG（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE39_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanExhausted: meanTreatment(runs, (r) => r.metrics.exhaustedCount),
    meanRenEvents: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlgEvents: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanRplRemaining: meanTreatment(runs, (r) => r.metrics.meanRplRemaining),
    meanEntriesKept: meanTreatment(runs, (r) => r.entriesKept),
    runs,
  };
}

const comparisons = byTreatment.fertile_rpl.map((r) => {
  const ren = byTreatment.fertile_ren.find((x) => x.seed === r.seed);
  const renPlg = byTreatment.fertile_ren_plg.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    renPlg: compareRenPlg(r.metrics, ren.metrics, renPlg.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 39,
  extension: 'rpl_renew_pledge',
  gap: 'GAP-18',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE39_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    ren: '富足场 + 低胁迫 + RPL≤0 → 概率性 +1 配额（DNA bias）',
    plg: '同 tick 两体 RPL 耗尽 → 互赋配额 + 寄存器通量交换',
  },
  roadmap: 'docs/PHASE39_REN_PLG.md',
};

writeFileSync(
  new URL('../docs/field-phase39-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(22), 'FISS', '存活', '耗尽', 'REN', 'PLG', '均RPL', '日志');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanExhausted ?? '—').padStart(5),
    String(a.meanRenEvents ?? '—').padStart(5),
    String(a.meanPlgEvents ?? '—').padStart(5),
    String(a.meanRplRemaining ?? '—').padStart(7),
    String(a.meanEntriesKept ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase39-report.json');
await maybeUploadFieldReport({ phase: 39, report });
