#!/usr/bin/env node
/**
 * Phase 35 — 多细胞个体 / 延迟独立 / 种群区分（GAP-14 对照 + GAP-15）
 * harsh_combined · 四体 3000 tick × 4 种子 × 4 处理组
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { PHASE35_TREATMENTS, applyFieldTreatment } from '../src/world/env-profile.js';
import {
  analyzePhase35,
  compareNursedVsInstant,
  distinguishOrganismVsPopulation,
} from './lib/phase35-analyze.js';
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
const TREATMENT_IDS = Object.keys(PHASE35_TREATMENTS);

function runScenario(treatmentId, seed) {
  const world = createWorld(`01-p35-${treatmentId}-${seed}`);
  applyFieldTreatment(world, treatmentId);
  const recorder = new Recorder();
  recorder.system(0, `[Phase35 ${treatmentId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const juvenileWindow = world.envProfile?.juvenileTicks ?? 80;
  const metrics = analyzePhase35(recorder.entries, world.beings, { juvenileWindow });
  const distinction = distinguishOrganismVsPopulation(metrics, world.beings);
  return {
    treatmentId,
    seed,
    treatment: PHASE35_TREATMENTS[treatmentId],
    metrics,
    distinction,
    entries: recorder.entries.length,
  };
}

console.log(
  `Phase 35：harsh_combined · 四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组\n`
);

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
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4) : null;
}

const aggregate = {};
for (const [tid, runs] of Object.entries(byTreatment)) {
  aggregate[tid] = {
    label: PHASE35_TREATMENTS[tid].label,
    meanJuvenileEndRate: meanTreatment(runs, (r) => r.metrics.juvenileEndRate),
    meanNetLineage: meanTreatment(runs, (r) => r.metrics.netLineage),
    meanAliveLineage: meanTreatment(runs, (r) => r.metrics.aliveLineage),
    meanIntraCount: meanTreatment(runs, (r) => r.metrics.intraCount),
    meanNurCount: meanTreatment(runs, (r) => r.metrics.nurCount),
    meanMulticellAlive: meanTreatment(runs, (r) => r.metrics.multicellAlive),
    runs,
  };
}

const nursedComparisons = {
  unicell: compareNursedVsInstant(
    {
      juvenileEndRate: aggregate.unicell_instant.meanJuvenileEndRate,
      netLineage: aggregate.unicell_instant.meanNetLineage,
      aliveLineage: aggregate.unicell_instant.meanAliveLineage,
    },
    {
      juvenileEndRate: aggregate.unicell_nursed.meanJuvenileEndRate,
      netLineage: aggregate.unicell_nursed.meanNetLineage,
      aliveLineage: aggregate.unicell_nursed.meanAliveLineage,
    }
  ),
  multicell: compareNursedVsInstant(
    {
      juvenileEndRate: aggregate.multicell_instant.meanJuvenileEndRate,
      netLineage: aggregate.multicell_instant.meanNetLineage,
      aliveLineage: aggregate.multicell_instant.meanAliveLineage,
    },
    {
      juvenileEndRate: aggregate.multicell_nursed.meanJuvenileEndRate,
      netLineage: aggregate.multicell_nursed.meanNetLineage,
      aliveLineage: aggregate.multicell_nursed.meanAliveLineage,
    }
  ),
};

const report = {
  runAt: new Date().toISOString(),
  phase: 35,
  extension: 'multicell_nurture_organism_distinction',
  gaps: ['GAP-14', 'GAP-15'],
  ticks: TICKS,
  seeds: SEEDS,
  treatments: PHASE35_TREATMENTS,
  aggregate,
  nursedComparisons,
  analogy: {
    unicell: '1 being = 1 代谢域（现行 cellBoundary）',
    multicell: '1 being = 多 subCell 子域，共享身份证，一次 END 终止整 organism',
    population: '多个独立 being（独立 ID、社会位、各自 LINEAGE）',
    intra: 'subCell 间 [INTRA] 通量分工（draw/act/balance 轮值）',
    nur: '谱系幼体 [NUR] 亲代寄存器种子 + 依赖期通量',
  },
  roadmap: 'docs/PHASE35_MULTICELL.md',
};

writeFileSync(
  new URL('../docs/field-phase35-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组均值（四种子）===');
console.log(
  'treatment'.padEnd(22),
  '幼体END率',
  '净谱系',
  '存活谱系',
  'INTRA',
  'NUR'
);
for (const tid of TREATMENT_IDS) {
  const a = aggregate[tid];
  console.log(
    tid.padEnd(22),
    String(a.meanJuvenileEndRate ?? '—').padStart(10),
    String(a.meanNetLineage ?? '—').padStart(7),
    String(a.meanAliveLineage ?? '—').padStart(10),
    String(a.meanIntraCount ?? '—').padStart(7),
    String(a.meanNurCount ?? '—').padStart(6)
  );
}

console.log('\n=== 延迟独立 vs 即时独立（均值）===');
for (const [kind, cmp] of Object.entries(nursedComparisons)) {
  console.log(
    `${kind}: 幼体END ${cmp.juvenileEndRate.verdict} | 净谱系 ${cmp.netLineage.verdict} | 存活 ${cmp.aliveLineage.verdict}`
  );
}

console.log('\n报告已写入 docs/field-phase35-report.json');

await maybeUploadFieldReport({ phase: 35, report });
