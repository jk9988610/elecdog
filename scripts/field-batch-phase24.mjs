#!/usr/bin/env node
/**
 * Phase 24 — GAP-02 寄存器语义田野
 * A. 四体 2000 tick × 2 种子
 * B. solo 2000 tick × 2 种子（对照）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeRegisters } from './lib/register-analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
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

const SEEDS = [0, 1];
const TICKS = 2000;

function runSolo(ticks, seed) {
  const world = createWorld(`01-p24-solo-${seed}`);
  const recorder = new Recorder();
  recorder.system(0, `[Phase24 solo seed${seed}]`);
  performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed };
}

function runFour(ticks, seed) {
  const world = createWorld(`01-p24-four-${seed}`);
  const recorder = new Recorder();
  recorder.system(0, `[Phase24 four seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed };
}

function analyzeRun(run) {
  const registers = analyzeRegisters(run.entries, run.beings, run.ticks);
  const viability = analyzeViability(run.entries, run.ticks);
  return { seed: run.seed, registers, viability };
}

const soloRuns = SEEDS.map((s) => analyzeRun(runSolo(TICKS, s)));
const fourRuns = SEEDS.map((s) => analyzeRun(runFour(TICKS, s)));

const report = {
  runAt: new Date().toISOString(),
  phase: 24,
  extension: 'gap02_register_semantics_field',
  ticks: TICKS,
  seeds: SEEDS,
  solo: soloRuns,
  four: fourRuns,
  roadmap: 'docs/GAPS.md',
};

writeFileSync(
  new URL('../docs/field-phase24-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

function logRun(label, runs) {
  console.log(`\n${label}:`);
  for (const r of runs) {
    const a = r.registers.aggregate;
    const h = r.registers.hypotheses;
    console.log(
      `  seed${r.seed}: gapStressCorr ${a?.avgGapStressCorr} unanimousRegs ${JSON.stringify(a?.unanimousStressDeltaRegs)} LOW idx ${JSON.stringify(a?.lowIdxTotals)}`
    );
    console.log(
      `    H1 ${h?.H1_stressRegisterShift.verdict} H2 ${h?.H2_gapStressCoupling.verdict} H3 ${h?.H3_lowChannelCluster.verdict}`
    );
  }
}

console.log('Phase 24 GAP-02 寄存器田野完成');
logRun('solo 2000', soloRuns);
logRun('四体 2000', fourRuns);

await maybeUploadFieldReport({ phase: 24, report });
