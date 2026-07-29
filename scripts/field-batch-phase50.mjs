#!/usr/bin/env node
/**
 * Phase 50 — 代谢通道层 [MTB]（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE50_TREATMENTS, applyPhase50Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeMetabolicLayer,
  compareMtbObserveVsNone,
  compareMtbFeedbackVsObserve,
  compareHarshMtb,
} from './lib/phase50-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE50_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase50Treatment,
    treatmentId,
    seed,
    phase: 50,
    ticks: FIELD_TICKS,
    analyze: analyzeMetabolicLayer,
  });
}

console.log(
  `Phase 50 代谢通道（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE50_TREATMENTS[tid].label,
    meanMtbTransitions: meanTreatment(runs, (r) => r.metrics.mtbTransitionCount),
    meanDomShare: meanTreatment(runs, (r) => r.metrics.meanDomShare),
    meanLowTotal: meanTreatment(runs, (r) => r.metrics.meanLowTotal),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const noMtb = byTreatment.fertile_no_mtb.find((r) => r.seed === seed);
  const observe = byTreatment.fertile_mtb_observe.find((r) => r.seed === seed);
  const feedback = byTreatment.fertile_mtb_feedback.find((r) => r.seed === seed);
  const harsh = byTreatment.harsh_mtb_feedback.find((r) => r.seed === seed);
  return {
    seed,
    observeVsNone: compareMtbObserveVsNone(noMtb.metrics, observe.metrics),
    feedbackVsObserve: compareMtbFeedbackVsObserve(observe.metrics, feedback.metrics),
    harshVsFertile: compareHarshMtb(feedback.metrics, harsh.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 50,
  extension: 'metabolic_channel_layer',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE50_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    profiles: 'N0 初采 / DOM 单通道主导 / BAL 均衡 / SCAR 匮乏型',
    feedback: '档案调制摄取倍率（非资源命名）',
  },
  roadmap: 'docs/PHASE50_METABOLIC.md',
};

writeFileSync(
  new URL('../docs/field-phase50-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(24),
  'MTB',
  'dom%',
  'LOW',
  '存活',
  'FISS'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanMtbTransitions ?? '—').padStart(5),
    String(a.meanDomShare != null ? (a.meanDomShare * 100).toFixed(0) + '%' : '—').padStart(6),
    String(a.meanLowTotal ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase50-report.json');
await maybeUploadFieldReport({ phase: 50, report });
