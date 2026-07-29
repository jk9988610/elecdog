#!/usr/bin/env node
/**
 * Phase 55 — 电子人层 [EHU]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE55_TREATMENTS, applyPhase55Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeElectronicHuman,
  compareEhuObserveVsNone,
  compareEhuFeedbackVsObserve,
  compareEhuNarrative,
} from './lib/phase55-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE55_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase55Treatment,
    treatmentId,
    seed,
    phase: 55,
    ticks: FIELD_TICKS,
    analyze: analyzeElectronicHuman,
  });
}

console.log(
  `Phase 55 电子人（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE55_TREATMENTS[tid].label,
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanArc: meanTreatment(runs, (r) => r.metrics.meanEhuArc),
    meanLayers: meanTreatment(runs, (r) => r.metrics.totalLayerTransitions),
    meanRpr: meanTreatment(runs, (r) => r.metrics.rprTransitionCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const none = byTreatment.stack_tri_no_ehu.find((r) => r.seed === seed);
  const observe = byTreatment.stack_ehu_observe.find((r) => r.seed === seed);
  const feedback = byTreatment.stack_ehu_feedback.find((r) => r.seed === seed);
  const narrative = byTreatment.stack_ehu_narrative.find((r) => r.seed === seed);
  return {
    seed,
    observeVsNone: compareEhuObserveVsNone(none.metrics, observe.metrics),
    feedbackVsObserve: compareEhuFeedbackVsObserve(observe.metrics, feedback.metrics),
    narrativeVsFeedback: compareEhuNarrative(feedback.metrics, narrative.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 55,
  extension: 'electronic_human_layer',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE55_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    ehu: '自我连续性 H0–H3（连贯/区分/叙事弧）',
    stack: '四层档案 + RPR 三路径基线',
    outline: 'OUTLINE Phase 4 kickoff',
  },
  roadmap: 'docs/PHASE55_ELECTRONIC_HUMAN.md',
};

writeFileSync(
  new URL('../docs/field-phase55-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(24),
  'EHU',
  'ARC',
  'LAY',
  'RPR',
  'FISS',
  'FUS',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanArc ?? '—').padStart(5),
    String(a.meanLayers ?? '—').padStart(5),
    String(a.meanRpr ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase55-report.json');
await maybeUploadFieldReport({ phase: 55, report });
