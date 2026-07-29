#!/usr/bin/env node
/**
 * Phase 40 — 多细胞 × RPL 续行（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE40_TREATMENTS, applyPhase40Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeMulticellRenew,
  compareOrgVsSubRenew,
  comparePlgEffect,
} from './lib/phase40-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE40_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase40Treatment,
    treatmentId,
    seed,
    phase: 40,
    ticks: FIELD_TICKS,
    analyze: analyzeMulticellRenew,
  });
}

console.log(
  `Phase 40 多细胞×续行（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE40_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanMulticell: meanTreatment(runs, (r) => r.metrics.multicellAlive),
    meanSubUnits: meanTreatment(runs, (r) => r.metrics.subCellUnits),
    meanRenEvents: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlgEvents: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanExhausted: meanTreatment(runs, (r) => r.metrics.exhaustedCount),
    meanEntriesKept: meanTreatment(runs, (r) => r.entriesKept),
    runs,
  };
}

const comparisons = byTreatment.multicell_org_ren.map((r) => {
  const sub = byTreatment.multicell_sub_ren.find((x) => x.seed === r.seed);
  const orgPlg = byTreatment.multicell_org_ren_plg.find((x) => x.seed === r.seed);
  const subPlg = byTreatment.multicell_sub_ren_plg.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    orgVsSub: compareOrgVsSubRenew(r.metrics, sub.metrics),
    orgPlg: comparePlgEffect(r.metrics, orgPlg.metrics),
    subPlg: comparePlgEffect(sub.metrics, subPlg.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 40,
  extension: 'multicell_rpl_renew',
  gaps: ['GAP-17', 'GAP-18'],
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE40_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    matrix: '2×2：rplScope(organism|subunit) × renewal(REN|REN+PLG)',
    subunitFix: 'REN/PLG 在子域任一耗尽时触发（非仅总和≤0）',
  },
  roadmap: 'docs/PHASE40_MULTICELL_RENEW.md',
};

writeFileSync(
  new URL('../docs/field-phase40-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(28), 'FISS', '存活', '多细胞', '子域', 'REN', 'PLG', '耗尽', '日志');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(28),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanMulticell ?? '—').padStart(6),
    String(a.meanSubUnits ?? '—').padStart(5),
    String(a.meanRenEvents ?? '—').padStart(5),
    String(a.meanPlgEvents ?? '—').padStart(5),
    String(a.meanExhausted ?? '—').padStart(5),
    String(a.meanEntriesKept ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase40-report.json');
await maybeUploadFieldReport({ phase: 40, report });
