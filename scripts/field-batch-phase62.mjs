#!/usr/bin/env node
/**
 * Phase 62 — 内在流观察 UI + 3840 tick 超长时田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE62_TREATMENTS, applyPhase62Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS, FIELD_XLONG_TICKS } from './lib/field-cohort.js';
import {
  analyzeConsciousnessField,
  compareConsciousness1920vs3840,
} from './lib/phase62-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE62_TREATMENTS);

const TICKS_BY_TREATMENT = {
  cn_full_1920: FIELD_LONG_TICKS,
  cn_full_3840: FIELD_XLONG_TICKS,
};

function runOne(treatmentId, seed) {
  const ticks = TICKS_BY_TREATMENT[treatmentId] ?? FIELD_LONG_TICKS;
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase62Treatment,
    treatmentId,
    seed,
    phase: 62,
    ticks,
    analyze: analyzeConsciousnessField,
  });
}

console.log(
  `Phase 62 意识超长时：12体 × ${FIELD_LONG_TICKS}/${FIELD_XLONG_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE62_TREATMENTS[tid].label,
    ticks: TICKS_BY_TREATMENT[tid] ?? FIELD_LONG_TICKS,
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanH3: meanTreatment(runs, (r) => r.metrics.h3Alive),
    meanEhuRen: meanTreatment(runs, (r) => r.metrics.ehuRenCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const short = byTreatment.cn_full_1920.find((r) => r.seed === seed);
  const long = byTreatment.cn_full_3840.find((r) => r.seed === seed);
  return {
    seed,
    long1920vs3840: compareConsciousness1920vs3840(short.metrics, long.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 62,
  extension: 'mind_stream_ultra_long',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: { long: FIELD_LONG_TICKS, xlong: FIELD_XLONG_TICKS },
  seeds: FIELD_SEEDS,
  treatments: PHASE62_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    mindStreamUi: '观察台内在流面板：internal + [EHU*] + MEM + signal',
    ultraLong: '3840 tick 验证意识完整栈 H3 持续性',
  },
  roadmap: 'docs/PHASE62_MIND_STREAM.md',
};

writeFileSync(
  new URL('../docs/field-phase62-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(16), 'tick', 'H3%', 'H3', 'EHU-R', 'LIN', 'EHU', 'PSN', '存活');
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
    String(a.meanPersona ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase62-report.json');
await maybeUploadFieldReport({ phase: 62, report });
