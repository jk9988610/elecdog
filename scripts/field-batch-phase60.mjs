#!/usr/bin/env node
/**
 * Phase 60 — 电子人续行 [EHU-REN] × REN/PLG
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE60_TREATMENTS, applyPhase60Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeEhuRenew,
  compareEhuRenOffVsRen,
  compareEhuRenVsPlg,
} from './lib/phase60-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE60_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase60Treatment,
    treatmentId,
    seed,
    phase: 60,
    ticks: FIELD_TICKS,
    analyze: analyzeEhuRenew,
  });
}

console.log(
  `Phase 60 电子人续行：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE60_TREATMENTS[tid].label,
    meanRen: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlg: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanEhuRen: meanTreatment(runs, (r) => r.metrics.ehuRenCount),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanH3: meanTreatment(runs, (r) => r.metrics.ehuStages?.H3 ?? 0),
    meanH3Ren: meanTreatment(runs, (r) => r.metrics.h3WithRen),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const off = byTreatment.ehu_ren_off.find((r) => r.seed === seed);
  const ren = byTreatment.ehu_ren_only.find((r) => r.seed === seed);
  const plg = byTreatment.ehu_ren_plg.find((r) => r.seed === seed);
  return {
    seed,
    renVsOff: compareEhuRenOffVsRen(off.metrics, ren.metrics),
    plgVsRen: compareEhuRenVsPlg(ren.metrics, plg.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 60,
  extension: 'ehu_renew',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE60_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    ehuRen: '续行 [REN]/[PLG] 时记录 [EHU-REN] 阶段交叉迹',
    renOff: '对照组关闭 ehuRenewTraceEnabled',
  },
  roadmap: 'docs/PHASE60_EHU_RENEW.md',
};

writeFileSync(
  new URL('../docs/field-phase60-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(16),
  'REN',
  'PLG',
  'EHU-REN',
  'EHU',
  'LIN',
  'H3',
  'H3-R',
  'FISS',
  'FUS',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(16),
    String(a.meanRen ?? '—').padStart(5),
    String(a.meanPlg ?? '—').padStart(5),
    String(a.meanEhuRen ?? '—').padStart(7),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.meanH3 ?? '—').padStart(5),
    String(a.meanH3Ren ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase60-report.json');
await maybeUploadFieldReport({ phase: 60, report });
