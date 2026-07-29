#!/usr/bin/env node
/**
 * Phase 63 — CODEX 意识立项（+2 条）验证田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE63_TREATMENTS, applyPhase63Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeCodexConsciousness,
  verifyCodexEhuRen,
  verifyCodexFullStack,
} from './lib/phase63-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE63_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase63Treatment,
    treatmentId,
    seed,
    phase: 63,
    ticks: FIELD_TICKS,
    analyze: analyzeCodexConsciousness,
  });
}

console.log(
  `Phase 63 CODEX 验证：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE63_TREATMENTS[tid].label,
    meanH3Share: meanTreatment(runs, (r) => r.metrics.h3Share),
    meanEhuRen: meanTreatment(runs, (r) => r.metrics.ehuRenCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanRen: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    coexistRate: meanTreatment(runs, (r) => (r.metrics.stackCoexist ? 1 : 0)),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const full = byTreatment.codex_stack_full.find((r) => r.seed === seed);
  const off = byTreatment.codex_stack_ren_off.find((r) => r.seed === seed);
  return {
    seed,
    ehuRen: verifyCodexEhuRen(full.metrics, off.metrics),
    fullStack: verifyCodexFullStack(full.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 63,
  extension: 'codex_consciousness',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE63_TREATMENTS,
  aggregate,
  comparisons,
  codex: {
    newEntries: ['续行交叉迹', '意识完整栈'],
    totalEntries: 28,
    obs: ['OBS-20260729-69', 'OBS-20260729-70', 'OBS-20260729-71', 'OBS-20260729-72'],
  },
  roadmap: 'docs/PHASE63_CODEX_CONSCIOUSNESS.md',
};

writeFileSync(
  new URL('../docs/field-phase63-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(22), 'H3%', 'EHU-R', 'LIN', 'EHU', 'REN', 'PSN', '并存');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanH3Share != null ? (a.meanH3Share * 100).toFixed(0) + '%' : '—').padStart(5),
    String(a.meanEhuRen ?? '—').padStart(7),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanRen ?? '—').padStart(5),
    String(a.meanPersona ?? '—').padStart(5),
    String(a.coexistRate != null ? (a.coexistRate * 100).toFixed(0) + '%' : '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase63-report.json');
await maybeUploadFieldReport({ phase: 63, report });
