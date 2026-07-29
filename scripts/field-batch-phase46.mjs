#!/usr/bin/env node
/**
 * Phase 46 — 子域积压路由（统计田野：12体×960tick）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE46_TREATMENTS, applyPhase46Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_TICKS } from './lib/field-cohort.js';
import {
  analyzeSubunitRoute,
  compareSubunitRoute,
  compareRouteRen,
} from './lib/phase46-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const TREATMENT_IDS = Object.keys(PHASE46_TREATMENTS);

function runOne(treatmentId, seed) {
  return runFieldScenario({
    createWorld,
    applyTreatment: applyPhase46Treatment,
    treatmentId,
    seed,
    phase: 46,
    ticks: FIELD_TICKS,
    analyze: analyzeSubunitRoute,
  });
}

console.log(
  `Phase 46 子域路由（统计田野）：12体 ${FIELD_TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
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
    label: PHASE46_TREATMENTS[tid].label,
    meanMei: meanTreatment(runs, (r) => r.metrics.meiEventCount),
    meanFus: meanTreatment(runs, (r) => r.metrics.fusEventCount),
    meanFusPerMei: meanTreatment(runs, (r) => r.metrics.fusPerMei),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanBacklog: meanTreatment(runs, (r) => r.metrics.packetBacklog),
    meanIspl: meanTreatment(runs, (r) => r.metrics.isplEventCount),
    meanXbcn: meanTreatment(runs, (r) => r.metrics.xbcnEventCount),
    meanLiveFus: meanTreatment(runs, (r) => r.metrics.liveFusCount),
    runs,
  };
}

const comparisons = byTreatment.multicell_sub_fix.map((r) => {
  const route = byTreatment.multicell_sub_route.find((x) => x.seed === r.seed);
  const routeRen = byTreatment.multicell_sub_route_ren.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    route: compareSubunitRoute(r.metrics, route.metrics),
    routeRen: compareRouteRen(route.metrics, routeRen.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 46,
  extension: 'subunit_fus_route',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: FIELD_TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE46_TREATMENTS,
  aggregate,
  comparisons,
  phase45Baseline: { subFixBacklog: 29.25 },
  design: {
    ispl: '胞内子域 RPL 通量（富→枯）',
    xbcn: '跨子域信标（packet 来源子域）',
    donorMode: 'any — live-donor 任一子域有配额即可',
  },
  roadmap: 'docs/PHASE46_SUBUNIT_ROUTE.md',
};

writeFileSync(
  new URL('../docs/field-phase46-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(28), 'MEI', 'FUS', 'F/M', '积压', 'ISPL', 'XBCN', 'live');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(28),
    String(a.meanMei ?? '—').padStart(5),
    String(a.meanFus ?? '—').padStart(5),
    String(a.meanFusPerMei ?? '—').padStart(5),
    String(a.meanBacklog ?? '—').padStart(5),
    String(a.meanIspl ?? '—').padStart(5),
    String(a.meanXbcn ?? '—').padStart(5),
    String(a.meanLiveFus ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase46-report.json');
await maybeUploadFieldReport({ phase: 46, report });
