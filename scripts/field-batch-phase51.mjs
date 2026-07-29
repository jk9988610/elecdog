#!/usr/bin/env node
/**
 * Phase 51 — 社会合作层 [COOP]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE51_TREATMENTS, applyPhase51Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeCooperationLayer,
  compareCoopObserveVsNone,
  compareCoopFeedbackVsObserve,
  compareCoopDense,
} from './lib/phase51-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE51_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase51Treatment,
    treatmentId,
    seed,
    phase: 51,
    ticks: FIELD_TICKS,
    analyze: analyzeCooperationLayer,
  });
}

console.log(
  `Phase 51 社会合作（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE51_TREATMENTS[tid].label,
    meanCoopTransitions: meanTreatment(runs, (r) => r.metrics.coopTransitionCount),
    meanCrossRx: meanTreatment(runs, (r) => r.metrics.meanCrossRx),
    meanContest: meanTreatment(runs, (r) => r.metrics.meanContest),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const noCoop = byTreatment.fertile_no_coop.find((r) => r.seed === seed);
  const observe = byTreatment.fertile_coop_observe.find((r) => r.seed === seed);
  const feedback = byTreatment.fertile_coop_feedback.find((r) => r.seed === seed);
  const dense = byTreatment.fertile_coop_dense.find((r) => r.seed === seed);
  return {
    seed,
    observeVsNone: compareCoopObserveVsNone(noCoop.metrics, observe.metrics),
    feedbackVsObserve: compareCoopFeedbackVsObserve(observe.metrics, feedback.metrics),
    denseVsFeedback: compareCoopDense(feedback.metrics, dense.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 51,
  extension: 'social_cooperation_layer',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE51_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    modes: 'S0/SOLO/MESH/RIVAL/ECHO — 社会迹聚合，非角色名',
    feedback: '模式调制 ACT 阈值与偏好',
  },
  roadmap: 'docs/PHASE51_COOPERATION.md',
};

writeFileSync(
  new URL('../docs/field-phase51-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(24),
  'COOP',
  'crossRx',
  'contest',
  '存活',
  'FISS'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanCoopTransitions ?? '—').padStart(5),
    String(a.meanCrossRx ?? '—').padStart(8),
    String(a.meanContest ?? '—').padStart(8),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase51-report.json');
await maybeUploadFieldReport({ phase: 51, report });
