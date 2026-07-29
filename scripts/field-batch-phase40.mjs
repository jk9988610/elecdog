#!/usr/bin/env node
/**
 * Phase 40 — 多细胞 × RPL 续行：共享 vs 子域 × REN / REN+PLG
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { PHASE40_TREATMENTS, applyPhase40Treatment } from '../src/world/env-profile.js';
import {
  analyzeMulticellRenew,
  compareOrgVsSubRenew,
  comparePlgEffect,
} from './lib/phase40-analyze.js';
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
const TREATMENT_IDS = Object.keys(PHASE40_TREATMENTS);

function runScenario(treatmentId, seed) {
  const world = createWorld(`01-p40-${treatmentId}-${seed}`);
  applyPhase40Treatment(world, treatmentId);
  world.envProfile.fieldLiteLog = true;
  const recorder = new Recorder();
  recorder.system(0, `[Phase40 ${treatmentId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const metrics = analyzeMulticellRenew(recorder.entries, world.beings);
  return { treatmentId, seed, treatment: PHASE40_TREATMENTS[treatmentId], metrics, entries: recorder.entries.length };
}

console.log(`Phase 40 多细胞×续行：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`);

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
    label: PHASE40_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanMulticell: meanTreatment(runs, (r) => r.metrics.multicellAlive),
    meanSubUnits: meanTreatment(runs, (r) => r.metrics.subCellUnits),
    meanRenEvents: meanTreatment(runs, (r) => r.metrics.renEventCount),
    meanPlgEvents: meanTreatment(runs, (r) => r.metrics.plgEventCount),
    meanExhausted: meanTreatment(runs, (r) => r.metrics.exhaustedCount),
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
  ticks: TICKS,
  seeds: SEEDS,
  treatments: PHASE40_TREATMENTS,
  aggregate,
  comparisons,
  phase38Baseline: {
    multicell_rpl_noRenew: { fiss: 12, alive: 16 },
    multicell_subrpl_noRenew: { fiss: 7.5, alive: 11.5 },
  },
  design: {
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
console.log('treatment'.padEnd(28), 'FISS', '存活', '多细胞', '子域', 'REN', 'PLG', '耗尽');
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
    String(a.meanExhausted ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase40-report.json');
await maybeUploadFieldReport({ phase: 40, report });
