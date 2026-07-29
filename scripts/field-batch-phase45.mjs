#!/usr/bin/env node
/**
 * Phase 45 — 多细胞 × 重组（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE45_TREATMENTS, applyPhase45Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeMulticellRecomb,
  compareOrgVsSubRecomb,
  compareMulticellFix,
} from './lib/phase45-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE45_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase45Treatment,
    treatmentId,
    seed,
    phase: 45,
    ticks: FIELD_TICKS,
    analyze: analyzeMulticellRecomb,
  });
}

console.log(
  `Phase 45 多细胞×重组（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE45_TREATMENTS[tid].label,
    meanMei: meanTreatment(runs, (r) => r.metrics.meiEventCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanFusPerMei: meanTreatment(runs, (r) => r.metrics.fusPerMei),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanMulticell: meanTreatment(runs, (r) => r.metrics.multicellAlive),
    meanRecombMc: meanTreatment(runs, (r) => r.metrics.recombinedMulticell),
    meanBacklog: meanTreatment(runs, (r) => r.metrics.packetBacklog),
    meanIntra: meanTreatment(runs, (r) => r.metrics.intraCount),
    meanOrphanFus: meanTreatment(runs, (r) => r.metrics.orphanFusCount),
    runs,
  };
}

const comparisons = byTreatment.multicell_org_mei.map((r) => {
  const sub = byTreatment.multicell_sub_mei.find((x) => x.seed === r.seed);
  const orgFix = byTreatment.multicell_org_mei_fix.find((x) => x.seed === r.seed);
  const subFix = byTreatment.multicell_sub_mei_fix.find((x) => x.seed === r.seed);
  const anchor = byTreatment.unicell_mei_fix.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    orgVsSub: compareOrgVsSubRecomb(r.metrics, sub.metrics),
    orgFix: compareMulticellFix(r.metrics, orgFix.metrics),
    subFix: compareMulticellFix(sub.metrics, subFix.metrics),
    anchorFus: anchor.metrics.fusEventCount,
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 45,
  extension: 'multicell_mei_fus',
  gaps: ['GAP-15', 'GAP-19'],
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE45_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    meiRplDeduct: '子域模式扣当前子域；共享模式扣整体',
    fixPack: 'Phase44 BCN/孤儿/live-donor/激进配对',
  },
  roadmap: 'docs/PHASE45_MULTICELL_RECOMB.md',
};

writeFileSync(
  new URL('../docs/field-phase45-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(28),
  'MEI',
  'FUS',
  'F/M',
  '存活',
  '多细胞',
  '重组MC',
  '积压',
  'INTRA'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(28),
    String(a.meanMei ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanFusPerMei ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanMulticell ?? '—').padStart(6),
    String(a.meanRecombMc ?? '—').padStart(7),
    String(a.meanBacklog ?? '—').padStart(5),
    String(a.meanIntra ?? '—').padStart(6)
  );
}

console.log('\n报告已写入 docs/field-phase45-report.json');
await maybeUploadFieldReport({ phase: 45, report });
