#!/usr/bin/env node
/**
 * Phase 39 — [REN] 环境重置 / [PLG] 双体通量汇合
 * 四体 3000 tick × 4 种子 × 3 处理组
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { PHASE39_TREATMENTS, applyPhase39Treatment } from '../src/world/env-profile.js';
import { analyzeRenewPlg, compareRenPlg } from './lib/phase39-analyze.js';
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
const TREATMENT_IDS = Object.keys(PHASE39_TREATMENTS);

function runScenario(treatmentId, seed) {
  const world = createWorld(`01-p39-${treatmentId}-${seed}`);
  applyPhase39Treatment(world, treatmentId);
  world.envProfile.fieldLiteLog = true;
  const recorder = new Recorder();
  recorder.system(0, `[Phase39 ${treatmentId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const metrics = analyzeRenewPlg(recorder.entries, world.beings);
  return { treatmentId, seed, treatment: PHASE39_TREATMENTS[treatmentId], metrics, entries: recorder.entries.length };
}

console.log(`Phase 39 REN/PLG：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`);

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
    label: PHASE39_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanExhausted: meanTreatment(runs, (r) => r.metrics.exhaustedCount),
    meanRenEvents: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlgEvents: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanRplRemaining: meanTreatment(runs, (r) => r.metrics.meanRplRemaining),
    runs,
  };
}

const comparisons = byTreatment.fertile_rpl.map((r) => {
  const ren = byTreatment.fertile_ren.find((x) => x.seed === r.seed);
  const renPlg = byTreatment.fertile_ren_plg.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    renPlg: compareRenPlg(r.metrics, ren.metrics, renPlg.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 39,
  extension: 'rpl_renew_pledge',
  gap: 'GAP-18',
  ticks: TICKS,
  seeds: SEEDS,
  treatments: PHASE39_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    ren: '富足场 + 低胁迫 + RPL≤0 → 概率性 +1 配额（DNA bias）',
    plg: '同 tick 两体 RPL 耗尽 → 互赋配额 + 寄存器通量交换',
  },
  roadmap: 'docs/PHASE39_REN_PLG.md',
};

writeFileSync(
  new URL('../docs/field-phase39-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(22), 'FISS', '存活', '耗尽', 'REN', 'PLG', '均RPL');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanExhausted ?? '—').padStart(5),
    String(a.meanRenEvents ?? '—').padStart(5),
    String(a.meanPlgEvents ?? '—').padStart(5),
    String(a.meanRplRemaining ?? '—').padStart(7)
  );
}

console.log('\n报告已写入 docs/field-phase39-report.json');
await maybeUploadFieldReport({ phase: 39, report });
