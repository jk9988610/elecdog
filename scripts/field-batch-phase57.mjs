#!/usr/bin/env node
/**
 * Phase 57 — 电子人深化（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE57_TREATMENTS, applyPhase57Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeEhuDeep,
  compareEhuSocialBind,
  compareEhuLineageEcho,
  compareEhuDeepFull,
} from './lib/phase57-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE57_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase57Treatment,
    treatmentId,
    seed,
    phase: 57,
    ticks: FIELD_TICKS,
    analyze: analyzeEhuDeep,
  });
}

console.log(
  `Phase 57 电子人深化（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE57_TREATMENTS[tid].label,
    meanEhu: meanTreatment(runs, (r) => r.metrics.ehuTransitionCount),
    meanEhuLin: meanTreatment(runs, (r) => r.metrics.ehuLinCount),
    meanBind: meanTreatment(runs, (r) => r.metrics.meanSocialBind),
    meanH3: meanTreatment(runs, (r) => r.metrics.ehuStages?.H3 ?? 0),
    meanPersona: meanTreatment(runs, (r) => r.metrics.meanPersonaTransitions),
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    runs,
  };
}

const comparisons = FIELD_SEEDS.map((seed) => {
  const base = byTreatment.ehu_persona_base.find((r) => r.seed === seed);
  const social = byTreatment.ehu_social_bind.find((r) => r.seed === seed);
  const echo = byTreatment.ehu_lineage_echo.find((r) => r.seed === seed);
  const full = byTreatment.ehu_deep_full.find((r) => r.seed === seed);
  return {
    seed,
    socialVsBase: compareEhuSocialBind(base.metrics, social.metrics),
    echoVsBase: compareEhuLineageEcho(base.metrics, echo.metrics),
    fullVsSocial: compareEhuDeepFull(social.metrics, full.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 57,
  extension: 'electronic_human_deepening',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE57_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    ehuLin: '繁殖时记录亲代 EHU 阶段回响（非情感遗传）',
    socialBind: '交叉接收+自发广播时的自我-社会绑定',
  },
  roadmap: 'docs/PHASE57_EHU_DEEPEN.md',
};

writeFileSync(
  new URL('../docs/field-phase57-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(22),
  'EHU',
  'LIN',
  'BIND',
  'H3',
  'PSN',
  'FISS',
  'FUS',
  '存活'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanEhu ?? '—').padStart(5),
    String(a.meanEhuLin ?? '—').padStart(5),
    String(a.meanBind ?? '—').padStart(5),
    String(a.meanH3 ?? '—').padStart(5),
    String(a.meanPersona ?? '—').padStart(5),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase57-report.json');
await maybeUploadFieldReport({ phase: 57, report });
