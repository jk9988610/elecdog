#!/usr/bin/env node
/**
 * Phase 33 — GAP-13 社会合作田野
 * 四体 3000 tick × 4 种子，按社会位 S0–S3 统计
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
import {
  analyzeCooperation,
  evaluateCooperationHypotheses,
} from './lib/social-analyze.js';
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

function runFour(seed) {
  const world = createWorld(`01-p33-social-${seed}`);
  const recorder = new Recorder();
  recorder.system(0, `[Phase33 social seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  return { entries: recorder.entries, beings: world.beings, ticks: TICKS, seed };
}

function analyzeRun(run) {
  const viability = analyzeViability(run.entries, run.ticks);
  const cooperation = analyzeCooperation(run.entries, run.beings);
  const hypotheses = evaluateCooperationHypotheses(cooperation, viability);
  return {
    seed: run.seed,
    viability,
    cooperation: {
      bySlot: cooperation.bySlot,
      contestCount: cooperation.contestCount,
      divisionSkew: cooperation.divisionSkew,
      crossRxShare: cooperation.crossRxShare,
      rxLinks: cooperation.rxLinks,
      crossRx: cooperation.crossRx,
    },
    hypotheses,
  };
}

console.log(`Phase 33 社会合作田野：四体 ${TICKS} tick × ${SEEDS.length} 种子…`);

const runs = SEEDS.map((seed) => {
  console.log(`  运行 seed ${seed}…`);
  return analyzeRun(runFour(seed));
});

function aggregateSlots(runs) {
  const slots = ['S0', 'S1', 'S2', 'S3'];
  const agg = {};
  for (const sl of slots) {
    agg[sl] = {
      endCount: 0,
      lineageAsParent: 0,
      drw: 0,
      low: 0,
      tx: 0,
      tgt: 0,
      rx: 0,
      contestJoins: 0,
      aliveAtEnd: 0,
      beingsEver: 0,
    };
  }
  for (const r of runs) {
    for (const sl of slots) {
      const s = r.cooperation.bySlot[sl];
      if (!s) continue;
      for (const k of Object.keys(agg[sl])) {
        agg[sl][k] += s[k] ?? 0;
      }
    }
  }
  return agg;
}

const report = {
  runAt: new Date().toISOString(),
  phase: 33,
  extension: 'gap13_social_cooperation_field',
  gap: 'GAP-13',
  ticks: TICKS,
  seeds: SEEDS,
  runs,
  aggregate: {
    bySlot: aggregateSlots(runs),
    meanContest: +(runs.reduce((s, r) => s + r.cooperation.contestCount, 0) / runs.length).toFixed(1),
    meanEnd: +(runs.reduce((s, r) => s + r.viability.endCount, 0) / runs.length).toFixed(1),
    meanLineage: +(runs.reduce((s, r) => s + r.viability.lineageCount, 0) / runs.length).toFixed(1),
    meanDivisionSkew: +(runs.reduce((s, r) => s + r.cooperation.divisionSkew, 0) / runs.length).toFixed(1),
  },
  hypothesesAcrossSeeds: {
    H1: runs.map((r) => r.hypotheses.H1_slotEndRateSpread.verdict),
    H2: runs.map((r) => r.hypotheses.H2_rxCorrelatesAlive.verdict),
    H3: runs.map((r) => r.hypotheses.H3_contestCorrelatesEnd.verdict),
    H4: runs.map((r) => r.hypotheses.H4_socialDivisionSkew.verdict),
  },
  roadmap: 'docs/GAPS.md',
};

writeFileSync(
  new URL('../docs/field-phase33-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 按种子 ===');
for (const r of runs) {
  console.log(
    `seed${r.seed}: END ${r.viability.endCount} LINEAGE ${r.viability.lineageCount} contest ${r.cooperation.contestCount} skew ${r.cooperation.divisionSkew}`
  );
  for (const sl of ['S0', 'S1', 'S2', 'S3']) {
    const s = r.cooperation.bySlot[sl];
    if (!s) continue;
    console.log(
      `  ${sl}: END ${s.endCount} alive ${s.aliveAtEnd} RX ${s.rx} TGT ${s.tgt} contest ${s.contestJoins}`
    );
  }
  console.log(
    `  H1 ${r.hypotheses.H1_slotEndRateSpread.verdict} H2 ${r.hypotheses.H2_rxCorrelatesAlive.verdict} H3 ${r.hypotheses.H3_contestCorrelatesEnd.verdict} H4 ${r.hypotheses.H4_socialDivisionSkew.verdict}`
  );
}

console.log('\n=== 四种子合计（社会位）===');
for (const [sl, s] of Object.entries(report.aggregate.bySlot)) {
  console.log(
    `${sl}: END ${s.endCount} alive ${s.aliveAtEnd} RX ${s.rx} TGT ${s.tgt} contest ${s.contestJoins} DRW ${s.drw}`
  );
}

console.log('\n报告已写入 docs/field-phase33-report.json');

await maybeUploadFieldReport({ phase: 33, report });
