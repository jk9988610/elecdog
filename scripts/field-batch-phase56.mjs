#!/usr/bin/env node
/**
 * Phase 56 — 六层人格栈整合（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE56_TREATMENTS, applyPhase56Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzePersonaStack,
  comparePersonaObserveVsTri,
  comparePersonaFeedbackVsObserve,
  comparePersonaCoherence,
} from './lib/phase56-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE56_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase56Treatment,
    treatmentId,
    seed,
    phase: 56,
    ticks: FIELD_TICKS,
    analyze: analyzePersonaStack,
  });
}

console.log(
  `Phase 56 人格栈（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE56_TREATMENTS[tid].label,
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanLayers: meanTreatment(runs, (r) => r.metrics.totalLayerTransitions),
    meanRpr: meanTreatment(runs, (r) => r.metrics.rprTransitionCount),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const tri = byTreatment.persona_tri_only.find((r) => r.seed === seed);
  const observe = byTreatment.persona_observe.find((r) => r.seed === seed);
  const feedback = byTreatment.persona_feedback.find((r) => r.seed === seed);
  const coherence = byTreatment.persona_coherence.find((r) => r.seed === seed);
  return {
    seed,
    observeVsTri: comparePersonaObserveVsTri(tri.metrics, observe.metrics),
    feedbackVsObserve: comparePersonaFeedbackVsObserve(observe.metrics, feedback.metrics),
    coherenceVsFeedback: comparePersonaCoherence(feedback.metrics, coherence.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 56,
  extension: 'persona_stack_integration',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE56_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    persona: 'EXP + REG + MTB + COOP + RPR + EHU 六层整合',
    cloud: 'field:stack:full:cloud 扩展归档至 Phase 55',
  },
  roadmap: 'docs/PHASE56_PERSONA_STACK.md',
};

writeFileSync(
  new URL('../docs/field-phase56-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(22),
  'PSN',
  'EHU',
  'LAY',
  'RPR',
  'FISS',
  'FUS',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanPersona ?? '—').padStart(5),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanLayers ?? '—').padStart(5),
    String(a.meanRpr ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase56-report.json');
await maybeUploadFieldReport({ phase: 56, report });
