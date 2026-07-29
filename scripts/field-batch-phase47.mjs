#!/usr/bin/env node
/**
 * Phase 47 — 多细胞双路径竞争（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE47_TREATMENTS, applyPhase47Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeDualPath,
  compareDualVsFissOnly,
  compareDualVsRecombOnly,
  compareDualOrgVsSub,
} from './lib/phase47-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE47_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase47Treatment,
    treatmentId,
    seed,
    phase: 47,
    ticks: FIELD_TICKS,
    analyze: analyzeDualPath,
  });
}

console.log(
  `Phase 47 双路径竞争（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE47_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanMei: meanTreatment(runs, (r) => r.metrics.meiEventCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanUnique: meanTreatment(runs, (r) => r.metrics.uniqueDnaSeqs),
    meanFissShare: meanTreatment(runs, (r) => r.metrics.fissShare),
    meanFusShare: meanTreatment(runs, (r) => r.metrics.fusShare),
    meanFissChildren: meanTreatment(runs, (r) => r.metrics.fissChildrenAlive),
    meanRecombChildren: meanTreatment(runs, (r) => r.metrics.recombinedMulticell),
    meanBacklog: meanTreatment(runs, (r) => r.metrics.packetBacklog),
    runs,
  };
}

const comparisons = byTreatment.multicell_fiss_only.map((r) => {
  const recomb = byTreatment.multicell_recomb_only.find((x) => x.seed === r.seed);
  const dualSub = byTreatment.multicell_dual_sub.find((x) => x.seed === r.seed);
  const dualOrg = byTreatment.multicell_dual_org.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    dualVsFiss: compareDualVsFissOnly(r.metrics, dualSub.metrics),
    dualVsRecomb: compareDualVsRecombOnly(recomb.metrics, dualSub.metrics),
    orgVsSub: compareDualOrgVsSub(dualOrg.metrics, dualSub.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 47,
  extension: 'multicell_dual_path',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE47_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    competition: '共享 RPL 池上 [FISS] 与 [MEI]/[FUS] 竞争',
    subRoute: '子域双路径含 Phase46 路由包',
  },
  roadmap: 'docs/PHASE47_DUAL_PATH.md',
};

writeFileSync(
  new URL('../docs/field-phase47-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log(
  'treatment'.padEnd(28),
  'FISS',
  'MEI',
  'FUS',
  '存活',
  '唯一DNA',
  'FISS%',
  'FUS%',
  '积压'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(28),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanMei ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanUnique ?? '—').padStart(8),
    String(a.meanFissShare ?? '—').padStart(6),
    String(a.meanFusShare ?? '—').padStart(6),
    String(a.meanBacklog ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase47-report.json');
await maybeUploadFieldReport({ phase: 47, report });
