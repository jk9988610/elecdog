#!/usr/bin/env node
/**
 * Phase 38 — 多细胞 × RPL：有机体共享 vs 子域分摊
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { PHASE38_TREATMENTS, applyPhase38Treatment } from '../src/world/env-profile.js';
import {
  analyzeMulticellRpl,
  compareMulticellRpl,
  compareSubunitRpl,
} from './lib/phase38-analyze.js';
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
const TREATMENT_IDS = Object.keys(PHASE38_TREATMENTS);

function runScenario(treatmentId, seed) {
  const world = createWorld(`01-p38-${treatmentId}-${seed}`);
  applyPhase38Treatment(world, treatmentId);
  world.envProfile.fieldLiteLog = true;
  const recorder = new Recorder();
  recorder.system(0, `[Phase38 ${treatmentId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const metrics = analyzeMulticellRpl(recorder.entries, world.beings);
  return { treatmentId, seed, treatment: PHASE38_TREATMENTS[treatmentId], metrics, entries: recorder.entries.length };
}

console.log(`Phase 38 多细胞×RPL：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`);

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
    label: PHASE38_TREATMENTS[tid].label,
    meanFiss: meanTreatment(runs, (r) => r.metrics.fissCount),
    meanAlive: meanTreatment(runs, (r) => r.metrics.aliveTotal),
    meanIntra: meanTreatment(runs, (r) => r.metrics.intraCount),
    meanMulticell: meanTreatment(runs, (r) => r.metrics.multicellAlive),
    meanSubUnits: meanTreatment(runs, (r) => r.metrics.subCellUnits),
    meanExhausted: meanTreatment(runs, (r) => r.metrics.exhaustedAlive),
    runs,
  };
}

const comparisons = byTreatment.unicell_rpl.map((r) => {
  const mc = byTreatment.multicell_rpl.find((x) => x.seed === r.seed);
  const sub = byTreatment.multicell_subrpl.find((x) => x.seed === r.seed);
  return {
    seed: r.seed,
    unicellVsMulticell: compareMulticellRpl(r.metrics, mc.metrics),
    organismVsSubunit: compareSubunitRpl(mc.metrics, sub.metrics),
  };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 38,
  extension: 'multicell_rpl_scope',
  gaps: ['GAP-15', 'GAP-17'],
  ticks: TICKS,
  seeds: SEEDS,
  treatments: PHASE38_TREATMENTS,
  aggregate,
  comparisons,
  design: {
    organism: '1 being 共享一套 rplRemaining（多子域不单独计数）',
    subunit: '每个 subCell 分摊 rpl；任一子域归零则不可 FISS',
  },
  roadmap: 'docs/PHASE38_MULTICELL_RPL.md',
};

writeFileSync(
  new URL('../docs/field-phase38-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值 ===');
console.log('treatment'.padEnd(22), 'FISS', '存活', 'INTRA', '多细胞', '子域', '耗尽');
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanIntra ?? '—').padStart(6),
    String(a.meanMulticell ?? '—').padStart(6),
    String(a.meanSubUnits ?? '—').padStart(5),
    String(a.meanExhausted ?? '—').padStart(5)
  );
}

console.log('\n报告已写入 docs/field-phase38-report.json');
await maybeUploadFieldReport({ phase: 38, report });
