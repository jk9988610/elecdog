#!/usr/bin/env node
/**
 * Phase 52 — 四层档案整合（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE52_TREATMENTS, applyPhase52Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeProfileStack,
  compareStackObserveVsNone,
  compareStackFeedbackVsObserve,
  compareStackDual,
} from './lib/phase52-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE52_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase52Treatment,
    treatmentId,
    seed,
    phase: 52,
    ticks: FIELD_TICKS,
    analyze: analyzeProfileStack,
  });
}

console.log(
  `Phase 52 档案整合（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE52_TREATMENTS[tid].label,
    meanTotalLayers: meanTreatment(runs, (r) => r.metrics.totalLayerTransitions),
    meanExp: meanTreatment(runs, (r) => r.metrics.expTransitions),
    meanReg: meanTreatment(runs, (r) => r.metrics.regTransitions),
    meanMtb: meanTreatment(runs, (r) => r.metrics.mtbTransitions),
    meanCoop: meanTreatment(runs, (r) => r.metrics.coopTransitions),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const none = byTreatment.fertile_no_stack.find((r) => r.seed === seed);
  const observe = byTreatment.fertile_stack_observe.find((r) => r.seed === seed);
  const feedback = byTreatment.fertile_stack_feedback.find((r) => r.seed === seed);
  const dual = byTreatment.fertile_stack_dual.find((r) => r.seed === seed);
  return {
    seed,
    observeVsNone: compareStackObserveVsNone(none.metrics, observe.metrics),
    feedbackVsObserve: compareStackFeedbackVsObserve(observe.metrics, feedback.metrics),
    dualVsFeedback: compareStackDual(feedback.metrics, dual.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 52,
  extension: 'profile_stack_integration',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE52_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    layers: 'EXP + REG + MTB + COOP 同时启用',
    dual: '四层 + 多细胞双路径竞争',
  },
  roadmap: 'docs/PHASE52_PROFILE_STACK.md',
};

writeFileSync(
  new URL('../docs/field-phase52-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(26),
  'LAY',
  'EXP',
  'REG',
  'MTB',
  'COOP',
  '存活',
  'FISS',
  'FUS'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(26),
    String(a.meanTotalLayers ?? '—').padStart(5),
    String(a.meanExp ?? '—').padStart(5),
    String(a.meanReg ?? '—').padStart(5),
    String(a.meanMtb ?? '—').padStart(5),
    String(a.meanCoop ?? '—').padStart(6),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase52-report.json');
await maybeUploadFieldReport({ phase: 52, report });
