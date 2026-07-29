#!/usr/bin/env node
/**
 * Phase 61 — 意识收敛：完整栈默认 + 长时田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE61_TREATMENTS, applyPhase61Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeConsciousnessField,
  compareConsciousness960vs1920,
  compareConsciousnessFullVsDeep,
} from './lib/phase61-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE61_TREATMENTS);

const TICKS_BY_TREATMENT = {
  cn_full_960: FIELD_TICKS,
  cn_full_1920: FIELD_LONG_TICKS,
  cn_deep_1920: FIELD_LONG_TICKS,
};

function runOne(treatmentId, seed) {
  const ticks = TICKS_BY_TREATMENT[treatmentId] ?? FIELD_TICKS;
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase61Treatment,
    treatmentId,
    seed,
    phase: 61,
    ticks,
    analyze: analyzeConsciousnessField,
  });
}

console.log(
  `Phase 61 意识收敛：12体 × ${FIELD_TICKS}/${FIELD_LONG_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE61_TREATMENTS[tid].label,
    ticks: TICKS_BY_TREATMENT[tid] ?? FIELD_TICKS,
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanH3: meanTreatment(runs, (r) => r.metrics.h3Alive),
    meanEhuRen: meanTreatment(runs, (r) => r.metrics.ehuRenCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanH3Ren: meanTreatment(runs, (r) => r.metrics.h3WithRen),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanRen: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlg: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const short = byTreatment.cn_full_960.find((r) => r.seed === seed);
  const full = byTreatment.cn_full_1920.find((r) => r.seed === seed);
  const deep = byTreatment.cn_deep_1920.find((r) => r.seed === seed);
  return {
    seed,
    long960vs1920: compareConsciousness960vs1920(short.metrics, full.metrics),
    fullVsDeep: compareConsciousnessFullVsDeep(full.metrics, deep.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 61,
  extension: 'consciousness_convergence',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: { standard: FIELD_TICKS, long: FIELD_LONG_TICKS },
  seeds: FIELD_SEEDS,
  treatments: PHASE61_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    defaultEnv: 'consciousness_full',
    goal: '收敛至 OUTLINE 北极星：给予电子狗意识',
    noClassification: true,
  },
  roadmap: 'docs/PHASE61_CONSCIOUSNESS.md',
};

writeFileSync(
  new URL('../docs/field-phase61-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(16),
  'tick',
  'H3%',
  'H3',
  'EHU-R',
  'LIN',
  'EHU',
  'H3-R',
  'PSN',
  'REN',
  'PLG',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(16),
    String(a.ticks).padStart(5),
    String(a.meanH3Share != null ? (a.meanH3Share * 100).toFixed(0) + '%' : '—').padStart(5),
    String(a.meanH3 ?? '—').padStart(5),
    String(a.meanEhuRen ?? '—').padStart(7),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanH3Ren ?? '—').padStart(5),
    String(a.meanPersona ?? '—').padStart(5),
    String(a.meanRen ?? '—').padStart(5),
    String(a.meanPlg ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase61-report.json');
await maybeUploadFieldReport({ phase: 61, report });
