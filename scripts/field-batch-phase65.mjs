#!/usr/bin/env node
/**
 * Phase 65 — 意识交叉验证：EHU × 长时 × 四体信号链
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE65_TREATMENTS, applyPhase65Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_XLONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeConsciousnessCrossValidate,
  verifyConsciousnessCrossValidate,
} from './lib/phase65-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE65_TREATMENTS);
const TICKS = FIELD_XLONG_TICKS;

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase65Treatment,
    treatmentId,
    seed,
    phase: 65,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeConsciousnessCrossValidate(recorder, beings, world, { ...ctx, ticks: TICKS }),
  });
}

console.log(
  `Phase 65 意识交叉验证：四体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE65_TREATMENTS[tid].label,
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanEhuRen: meanTreatment(runs, (r) => r.metrics.ehuRenCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanTx: meanTreatment(runs, (r) => r.metrics.txCount),
    meanRx: meanTreatment(runs, (r) => r.metrics.rxCount),
    meanThreeHop: meanTreatment(runs, (r) => r.metrics.threeHopChains),
    meanTwoPlusHop: meanTreatment(runs, (r) => r.metrics.twoPlusHopChains),
    meanCrossRx: meanTreatment(runs, (r) => r.metrics.meanCrossRx),
    coexistRate: meanTreatment(runs, (r) => (r.metrics.stackCoexist ? 1 : 0)),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const full = byTreatment.cn_xv_quad_3840.find((r) => r.seed === seed);
  const off = byTreatment.cn_xv_ehu_off_quad.find((r) => r.seed === seed);
  return {
    seed,
    crossValidate: verifyConsciousnessCrossValidate(full.metrics, off.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 65,
  extension: 'consciousness_cross_validate',
  mode: 'field_stat_chain',
  cohort: '4 beings (001–004 quad chain)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE65_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    crossValidate: 'EHU 完整栈 × 3840 tick × 四体信号链',
    control: '同队列无 EHU 对照',
    signalMetrics: '初始四体 socTx/socRx/socCrossRx（无全量日志）',
  },
  roadmap: 'docs/PHASE65_CONSCIOUSNESS_CROSSVAL.md',
};

writeFileSync(
  new URL('../docs/field-phase65-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(22),
  'H3%',
  'EHU-R',
  'TX',
  'RX',
  '2+跳',
  '3跳',
  'crossRx',
  '并存'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanH3Share != null ? (a.meanH3Share * 100).toFixed(0) + '%' : '—').padStart(5),
    String(a.meanEhuRen ?? '—').padStart(7),
    String(a.meanTx ?? '—').padStart(5),
    String(a.meanRx ?? '—').padStart(5),
    String(a.meanTwoPlusHop ?? '—').padStart(5),
    String(a.meanThreeHop ?? '—').padStart(5),
    String(a.meanCrossRx ?? '—').padStart(7),
    String(a.coexistRate != null ? (a.coexistRate * 100).toFixed(0) + '%' : '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase65-report.json');
await maybeUploadFieldReport({ phase: 65, report });
