#!/usr/bin/env node
/**
 * Phase 48 — 阅历层 [EXP]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE48_TREATMENTS, applyPhase48Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeExperience,
  compareExpRecordVsNone,
  compareExpFeedbackVsRecord,
  compareExpDual,
} from './lib/phase48-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE48_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase48Treatment,
    treatmentId,
    seed,
    phase: 48,
    ticks: FIELD_TICKS,
    analyze: analyzeExperience,
  });
}

console.log(
  `Phase 48 阅历层（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE48_TREATMENTS[tid].label,
    meanExpTransitions: meanTreatment(runs, (r) => r.metrics.expTransitionCount),
    meanExpAct: meanTreatment(runs, (r) => r.metrics.meanExpAct),
    meanExpLoad: meanTreatment(runs, (r) => r.metrics.meanExpLoad),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const noExp = byTreatment.fertile_no_exp.find((r) => r.seed === seed);
  const record = byTreatment.fertile_exp_record.find((r) => r.seed === seed);
  const feedback = byTreatment.fertile_exp_feedback.find((r) => r.seed === seed);
  const dual = byTreatment.fertile_exp_dual.find((r) => r.seed === seed);
  return {
    seed,
    recordVsNone: compareExpRecordVsNone(noExp.metrics, record.metrics),
    feedbackVsRecord: compareExpFeedbackVsRecord(record.metrics, feedback.metrics),
    dualVsFeedback: compareExpDual(dual.metrics, feedback.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 48,
  extension: 'experience_layer',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE48_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    stages: 'E0 初态 → E1 积累 → E2 稳态 → E3 磨损',
    feedback: '阅历阶段调制 ACT 阈值与偏好（非预制感受）',
  },
  roadmap: 'docs/PHASE48_EXPERIENCE.md',
};

writeFileSync(
  new URL('../docs/field-phase48-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(24),
  'EXP',
  'expAct',
  'expLoad',
  '存活',
  'FISS',
  'FUS'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanExpTransitions ?? '—').padStart(5),
    String(a.meanExpAct ?? '—').padStart(7),
    String(a.meanExpLoad ?? '—').padStart(8),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase48-report.json');
await maybeUploadFieldReport({ phase: 48, report });
