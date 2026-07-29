#!/usr/bin/env node
/**
 * Phase 44 — 汇合瓶颈突破（统计田野：12体×960tick，无仪式）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE44_TREATMENTS, applyPhase44Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeFusBottleneck,
  compareBottleneckFix,
  compareBeaconOnly,
} from './lib/phase44-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE44_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase44Treatment,
    treatmentId,
    seed,
    phase: 44,
    ticks: FIELD_TICKS,
    analyze: analyzeFusBottleneck,
  });
}

console.log(
  `Phase 44 汇合瓶颈（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE44_TREATMENTS[tid].label,
    meanMei: meanTreatment(runs, (r) => r.metrics.meiEventCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanOrphanFus: meanTreatment(runs, (r) => r.metrics.orphanFusCount),
    meanBcn: meanTreatment(runs, (r) => r.metrics.bcnEventCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanFusPerMei: meanTreatment(runs, (r) => r.metrics.fusPerMei),
    meanEntriesKept: meanTreatment(runs, (r) => r.entriesKept),
    runs,
  };
}

const comparisons = byTreatment.mei_strict.map((r) => {
  const beacon = byTreatment.mei_strict_beacon.find((x) => x.seed === r.seed);
  const fix = byTreatment.mei_strict_fix.find((x) => x.seed === r.seed);
  const fixRen = byTreatment.mei_strict_fix_ren.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    beacon: compareBeaconOnly(r.metrics, beacon.metrics),
    fix: compareBottleneckFix(r.metrics, fix.metrics),
    fixRen: compareBottleneckFix(fix.metrics, fixRen.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 44,
  extension: 'fus_bottleneck_fix',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE44_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    fieldStatMode: '无诞生仪式；StatsRecorder 聚合计数',
    bcn: 'MEI 后信标广播',
    orphan: 'END 时 packet 入池',
  },
  roadmap: 'docs/PHASE44_FUS_BOTTLENECK.md',
};

writeFileSync(
  new URL('../docs/field-phase44-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(24), 'MEI', 'FUS', 'orph', 'BCN', '存活', 'F/M', '日志');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanMei ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanOrphanFus ?? '—').padStart(5),
    String(a.meanBcn ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanFusPerMei ?? '—').padStart(5),
    String(a.meanEntriesKept ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase44-report.json');
await maybeUploadFieldReport({ phase: 44, report });
