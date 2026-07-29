#!/usr/bin/env node
/**
 * Phase 58 — CODEX 归纳 + 长时田野（1920 tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE58_TREATMENTS, applyPhase58Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeLongField,
  compareLong960vs1920,
  compareLongObserveVsDeep,
} from './lib/phase58-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE58_TREATMENTS);

const TICKS_BY_TREATMENT = {
  long_deep_960: FIELD_TICKS,
  long_deep_1920: FIELD_LONG_TICKS,
  long_observe_1920: FIELD_LONG_TICKS,
};

function runOne(treatmentId, seed) {
  const ticks = TICKS_BY_TREATMENT[treatmentId] ?? FIELD_TICKS;
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase58Treatment,
    treatmentId,
    seed,
    phase: 58,
    ticks,
    analyze: analyzeLongField,
  });
}

console.log(
  `Phase 58 长时田野：12体 × ${FIELD_TICKS}/${FIELD_LONG_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
  const ticks = TICKS_BY_TREATMENT[tid] ?? FIELD_TICKS;
  aggregate[tid] = {
    label: PHASE58_TREATMENTS[tid].label,
    ticks,
    meanH3: meanTreatment(runs, (r) => r.metrics.h3Alive),
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const short = byTreatment.long_deep_960.find((r) => r.seed === seed);
  const long = byTreatment.long_deep_1920.find((r) => r.seed === seed);
  const observe = byTreatment.long_observe_1920.find((r) => r.seed === seed);
  return {
    seed,
    long960vs1920: compareLong960vs1920(short.metrics, long.metrics),
    observeVsDeep1920: compareLongObserveVsDeep(observe.metrics, long.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 58,
  extension: 'codex_longfield',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: { standard: FIELD_TICKS, long: FIELD_LONG_TICKS },
  seeds: FIELD_SEEDS,
  treatments: PHASE58_TREATMENTS,
  aggregate,
  comparisons,
  codex: {
    newEntries: ['自我连续阶段', '谱系回响', '社会绑定迹', '人格跃迁弧'],
    obs: ['OBS-20260729-64', 'OBS-20260729-65', 'OBS-20260729-66', 'OBS-20260729-67'],
  },
  design: {
    goal: 'CODEX 归纳 Phase 55–57 + 验证 H3 长时持续性',
  },
  roadmap: 'docs/PHASE58_CODEX_LONGFIELD.md',
};

writeFileSync(
  new URL('../docs/field-phase58-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(22),
  'tick',
  'H3',
  'share',
  'EHU',
  'LIN',
  'PSN',
  'FISS',
  'FUS',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.ticks ?? '—').padStart(5),
    String(a.meanH3 ?? '—').padStart(5),
    String(a.meanH3Share ?? '—').padStart(5),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.meanPersona ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase58-report.json');
await maybeUploadFieldReport({ phase: 58, report });
