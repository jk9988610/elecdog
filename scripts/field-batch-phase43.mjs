#!/usr/bin/env node
/**
 * Phase 43 — 重组 × 续行 + live-donor 配对（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE43_TREATMENTS, applyPhase43Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeRecombRenew,
  compareRenBoost,
  compareDonorFix,
} from './lib/phase43-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE43_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase43Treatment,
    treatmentId,
    seed,
    phase: 43,
    ticks: FIELD_TICKS,
    analyze: analyzeRecombRenew,
  });
}

console.log(
  `Phase 43 重组×续行（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE43_TREATMENTS[tid].label,
    meanMei: meanTreatment(runs, (r) => r.metrics.meiEventCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanLiveFus: meanTreatment(runs, (r) => r.metrics.liveFusCount),
    meanRen: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanBacklog: meanTreatment(runs, (r) => r.metrics.packetBacklog),
    meanFusPerMei: meanTreatment(runs, (r) => r.metrics.fusPerMei),
    meanEntriesKept: meanTreatment(runs, (r) => r.entriesKept),
    runs,
  };
}

const comparisons = byTreatment.mei_fus.map((r) => {
  const ren = byTreatment.mei_fus_ren.find((x) => x.seed === r.seed);
  const strict = byTreatment.mei_strict.find((x) => x.seed === r.seed);
  const fixed = byTreatment.mei_strict_ren_donor.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    renBoost: compareRenBoost(r.metrics, ren.metrics),
    donorFix: compareDonorFix(strict.metrics, fixed.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 43,
  extension: 'recomb_renew_live_donor',
  gaps: ['GAP-18', 'GAP-19'],
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE43_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    liveDonor: 'packet 持有者 + 有 RPL 的 live 供体 → FUS（无需双 packet）',
    ren: 'RPL 见底后续行 → 更多 MEI 循环',
  },
  roadmap: 'docs/PHASE43_RECOMB_RENEW.md',
};

writeFileSync(
  new URL('../docs/field-phase43-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(26), 'MEI', 'FUS', 'live', 'REN', '存活', '积压', 'F/M', '日志');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(26),
    String(a.meanMei ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanLiveFus ?? '—').padStart(5),
    String(a.meanRen ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanBacklog ?? '—').padStart(5),
    String(a.meanFusPerMei ?? '—').padStart(5),
    String(a.meanEntriesKept ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase43-report.json');
await maybeUploadFieldReport({ phase: 43, report });
