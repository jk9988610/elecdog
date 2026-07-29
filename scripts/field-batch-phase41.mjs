#!/usr/bin/env node
/**
 * Phase 41 — 续行代价 [RCO]：免费续行 vs 有代价续行
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { PHASE41_TREATMENTS, applyPhase41Treatment } from '../src/world/env-profile.js';
import { analyzeRenewCost, compareRenewCost, comparePlgCost } from './lib/phase41-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

const FOUR = [
  { name: '观察者', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002', code: '002' },
  { name: '003', code: '003' },
  { name: '001-乙', code: '001' },
];

const SEEDS = [0, 1, 2, 3];
const TICKS = 3000;
const TREATMENT_IDS = Object.keys(PHASE41_TREATMENTS);

function runScenario(treatmentId, seed) {
  const world = createWorld(`01-p41-${treatmentId}-${seed}`);
  applyPhase41Treatment(world, treatmentId);
  world.envProfile.fieldLiteLog = true;
  const recorder = new Recorder();
  recorder.system(0, `[Phase41 ${treatmentId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const metrics = analyzeRenewCost(recorder.entries, world.beings);
  return { treatmentId, seed, treatment: PHASE41_TREATMENTS[treatmentId], metrics, entries: recorder.entries.length };
}

console.log(`Phase 41 续行代价：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`);

const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…\n`);
    byTreatment[tid].push(runScenario(tid, seed));
  }
}

function meanTreatment(runs, pick) {
  const vals = runs.map(pick).filter((v) => v != null);
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
}

const aggregate = {};
for (const [tid, runs] of Object.entries(byTreatment)) {
  aggregate[tid] = {
    label: PHASE41_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanRen: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlg: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanRco: meanTreatment(runs, (r) => r.metrics.rcoEventCount),
    meanEnds: meanTreatment(runs, (r) => r.metrics.totalEnds),
    meanDebtEnds: meanTreatment(runs, (r) => r.metrics.renewDebtEnds),
    runs,
  };
}

const comparisons = byTreatment.fertile_ren_free.map((r) => {
  const cost = byTreatment.fertile_ren_cost.find((x) => x.seed === r.seed);
  const plgCost = byTreatment.fertile_ren_plg_cost.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    freeVsCost: compareRenewCost(r.metrics, cost.metrics),
    costVsPlgCost: comparePlgCost(cost.metrics, plgCost.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 41,
  extension: 'renewal_cost_rco',
  gap: 'GAP-18',
  ticks: TICKS,
  seeds: SEEDS,
  treatments: PHASE41_TREATMENTS,
  aggregate,
  comparisons,
  phase39Baseline: { renFree: { fiss: 32, alive: 36, ren: 56 } },
  design: {
    rco: 'REN/PLG 触发后：stressStreak↑、寄存器消耗、tickDebt↑、续行概率衰减、次数上限',
  },
  roadmap: 'docs/PHASE41_RENEW_COST.md',
};

writeFileSync(
  new URL('../docs/field-phase41-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(24), 'FISS', '存活', 'REN', 'PLG', 'RCO', 'END', '债务END');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(24),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanRen ?? '—').padStart(5),
    String(a.meanPlg ?? '—').padStart(5),
    String(a.meanRco ?? '—').padStart(5),
    String(a.meanEnds ?? '—').padStart(5),
    String(a.meanDebtEnds ?? '—').padStart(8)
  );
}

console.log('\n报告已写入 docs/field-phase41-report.json');
await maybeUploadFieldReport({ phase: 41, report });
