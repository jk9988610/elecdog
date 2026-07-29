#!/usr/bin/env node
/**
 * Phase 49 — 寄存器语义层 [REG]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE49_TREATMENTS, applyPhase49Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeRegisterLayer,
  compareRegObserveVsNone,
  compareRegCoupleVsObserve,
  compareHarshRegCouple,
} from './lib/phase49-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE49_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase49Treatment,
    treatmentId,
    seed,
    phase: 49,
    ticks: FIELD_TICKS,
    analyze: analyzeRegisterLayer,
  });
}

console.log(
  `Phase 49 寄存器语义（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE49_TREATMENTS[tid].label,
    meanRegTransitions: meanTreatment(runs, (r) => r.metrics.regTransitionCount),
    meanGap: meanTreatment(runs, (r) => r.metrics.meanGapMean),
    meanDrift: meanTreatment(runs, (r) => r.metrics.meanDriftVel),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const noReg = byTreatment.fertile_no_reg.find((r) => r.seed === seed);
  const observe = byTreatment.fertile_reg_observe.find((r) => r.seed === seed);
  const couple = byTreatment.fertile_reg_couple.find((r) => r.seed === seed);
  const harsh = byTreatment.harsh_reg_couple.find((r) => r.seed === seed);
  return {
    seed,
    observeVsNone: compareRegObserveVsNone(noReg.metrics, observe.metrics),
    coupleVsObserve: compareRegCoupleVsObserve(observe.metrics, couple.metrics),
    harshVsFertile: compareHarshRegCouple(couple.metrics, harsh.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 49,
  extension: 'register_semantics_layer',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE49_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    modes: 'SYNC / LAG / SCATTER / LOCK — 纯数值模式，非感受映射',
    feedback: '模式调制基底耦合系数（0.02 ± δ）',
  },
  roadmap: 'docs/PHASE49_REGISTER.md',
};

writeFileSync(
  new URL('../docs/field-phase49-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(24),
  'REG',
  'gap',
  'drift',
  '存活',
  'FISS'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanRegTransitions ?? '—').padStart(5),
    String(a.meanGap ?? '—').padStart(6),
    String(a.meanDrift ?? '—').padStart(7),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase49-report.json');
await maybeUploadFieldReport({ phase: 49, report });
