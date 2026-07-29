#!/usr/bin/env node
/**
 * Phase 53 — 繁殖路径层 [RPR]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE53_TREATMENTS, applyPhase53Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeReproductionPath,
  compareRprObserveVsNone,
  compareRprFissVsObserve,
  compareRprTri,
} from './lib/phase53-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE53_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase53Treatment,
    treatmentId,
    seed,
    phase: 53,
    ticks: FIELD_TICKS,
    analyze: analyzeReproductionPath,
  });
}

console.log(
  `Phase 53 繁殖路径（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE53_TREATMENTS[tid].label,
    meanRpr: meanTreatment(runs, (r) => r.metrics.rprTransitionCount),
    meanLayers: meanTreatment(runs, (r) => r.metrics.totalLayerTransitions),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const none = byTreatment.stack_no_rpr.find((r) => r.seed === seed);
  const observe = byTreatment.stack_rpr_observe.find((r) => r.seed === seed);
  const fiss = byTreatment.stack_rpr_fiss.find((r) => r.seed === seed);
  const tri = byTreatment.stack_rpr_tri.find((r) => r.seed === seed);
  return {
    seed,
    observeVsNone: compareRprObserveVsNone(none.metrics, observe.metrics),
    fissVsObserve: compareRprFissVsObserve(observe.metrics, fiss.metrics),
    triVsFiss: compareRprTri(fiss.metrics, tri.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 53,
  extension: 'reproduction_path_layer',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE53_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    paths: 'LINEAGE / FISS / RCM 起源与亲代活动',
    stack: '四层档案反馈同时启用',
  },
  roadmap: 'docs/PHASE53_REPRO_PATH.md',
};

writeFileSync(
  new URL('../docs/field-phase53-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(22),
  'RPR',
  'LAY',
  'FISS',
  'FUS',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanRpr ?? '—').padStart(5),
    String(a.meanLayers ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase53-report.json');
await maybeUploadFieldReport({ phase: 53, report });
