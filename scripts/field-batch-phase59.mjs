#!/usr/bin/env node
/**
 * Phase 59 — 观察台 CODEX UI + EHU×谱系代次田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE59_TREATMENTS, applyPhase59Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeEhuGeneration,
  compareEhuGenLin,
  compareEhuGenFull,
} from './lib/phase59-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE59_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase59Treatment,
    treatmentId,
    seed,
    phase: 59,
    ticks: FIELD_TICKS,
    analyze: analyzeEhuGeneration,
  });
}

console.log(
  `Phase 59 EHU×谱系代次：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE59_TREATMENTS[tid].label,
    meanMaxGen: meanTreatment(runs, (r) => r.metrics.maxGeneration),
    meanGen: meanTreatment(runs, (r) => r.metrics.meanGeneration),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanBind: meanTreatment(runs, (r) => r.metrics.meanSocialBind),
    meanH3: meanTreatment(runs, (r) => r.metrics.ehuStages?.H3 ?? 0),
    meanLineageH3: meanTreatment(runs, (r) => r.metrics.h3InLineage),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const base = byTreatment.ehu_gen_base.find((r) => r.seed === seed);
  const lin = byTreatment.ehu_gen_lin.find((r) => r.seed === seed);
  const full = byTreatment.ehu_gen_full.find((r) => r.seed === seed);
  return {
    seed,
    linVsBase: compareEhuGenLin(base.metrics, lin.metrics),
    fullVsLin: compareEhuGenFull(lin.metrics, full.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 59,
  extension: 'codex_ui_ehu_generation',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE59_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    codexUi: '观察台内嵌 26 条 CODEX，可搜索/展开',
    ehuGen: '谱系代次 × EHU 阶段 / [EHU-LIN] 交叉统计',
  },
  roadmap: 'docs/PHASE59_CODEX_UI.md',
};

writeFileSync(
  new URL('../docs/field-phase59-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(18),
  'maxGen',
  'meanGen',
  'EHU',
  'LIN',
  'BIND',
  'H3',
  'L-H3',
  'PSN',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(18),
    String(a.meanMaxGen ?? '—').padStart(6),
    String(a.meanGen ?? '—').padStart(7),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.meanBind ?? '—').padStart(5),
    String(a.meanH3 ?? '—').padStart(5),
    String(a.meanLineageH3 ?? '—').padStart(5),
    String(a.meanPersona ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase59-report.json');
await maybeUploadFieldReport({ phase: 59, report });
