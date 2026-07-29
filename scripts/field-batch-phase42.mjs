#!/usr/bin/env node
/**
 * Phase 42 — [MEI] 减数缩减 / [FUS] 双源汇合（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE42_TREATMENTS, applyPhase42Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeRecombination,
  compareClonalVsRecomb,
  compareBothPaths,
} from './lib/phase42-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE42_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase42Treatment,
    treatmentId,
    seed,
    phase: 42,
    ticks: FIELD_TICKS,
    analyze: analyzeRecombination,
  });
}

console.log(
  `Phase 42 MEI/FUS（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE42_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanMei: meanTreatment(runs, (r) => r.metrics.meiEventCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanUnique: meanTreatment(runs, (r) => r.metrics.uniqueDnaSeqs),
    meanDiversity: meanTreatment(runs, (r) => r.metrics.diversityRatio),
    meanRecombined: meanTreatment(runs, (r) => r.metrics.recombinedAlive),
    meanEntriesKept: meanTreatment(runs, (r) => r.entriesKept),
    runs,
  };
}

const comparisons = byTreatment.fertile_clonal.map((r) => {
  const recomb = byTreatment.fertile_mei_fus.find((x) => x.seed === r.seed);
  const both = byTreatment.fertile_both.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    clonalVsRecomb: compareClonalVsRecomb(r.metrics, recomb.metrics),
    bothPaths: compareBothPaths(both.metrics, r.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 42,
  extension: 'mei_fus_recombination',
  gap: 'GAP-19',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE42_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    mei: '各位点随机解析 → meiPacket；消耗 1 RPL',
    fus: '双体 meiPacket 汇合 → 新个体重组 DNA',
  },
  roadmap: 'docs/PHASE42_MEI_FUS.md',
};

writeFileSync(
  new URL('../docs/field-phase42-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(26), 'FISS', 'MEI', 'FUS', '存活', '唯一DNA', '重组体', '日志');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(26),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanMei ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanUnique ?? '—').padStart(8),
    String(a.meanRecombined ?? '—').padStart(6),
    String(a.meanEntriesKept ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase42-report.json');
await maybeUploadFieldReport({ phase: 42, report });
