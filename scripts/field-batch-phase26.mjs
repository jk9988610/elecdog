#!/usr/bin/env node
/**
 * Phase 26 — L4 环境筛选可观察层
 * 四体 3000 tick × 2 种子（剧变 / 无剧变对照）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
import { analyzeEvolution } from './lib/evolution-analyze.js';
import { analyzeSelection, evaluateSelectionHypotheses } from './lib/selection-analyze.js';

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
const TICKS = 3000;

function createWorldOpts(name, { catastrophe = true } = {}) {
  const world = createWorld(name);
  if (!catastrophe) world.catastrophe = null;
  return world;
}

function runFour(ticks, seed, { catastrophe = true } = {}) {
  const label = catastrophe ? 'cat' : 'ctrl';
  const world = createWorldOpts(`01-p26-${label}-${seed}`, { catastrophe });
  const recorder = new Recorder();
  recorder.system(0, `[Phase26 ${label} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed, catastrophe };
}

function analyzeRun(run) {
  const viability = analyzeViability(run.entries, run.ticks);
  const evolution = analyzeEvolution(run);
  const selection = analyzeSelection(run.entries, run.beings);
  const hypotheses = evaluateSelectionHypotheses(selection, viability);
  return { seed: run.seed, catastrophe: run.catastrophe, viability, evolution, selection, hypotheses };
}

const catRuns = SEEDS.map((s) => analyzeRun(runFour(TICKS, s, { catastrophe: true })));
const ctrlRuns = SEEDS.map((s) => analyzeRun(runFour(TICKS, s, { catastrophe: false })));

const report = {
  runAt: new Date().toISOString(),
  phase: 26,
  extension: 'l4_selection_observation',
  ticks: TICKS,
  seeds: SEEDS,
  catastrophe: catRuns,
  control: ctrlRuns,
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase26-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

function logRuns(label, runs) {
  console.log(`\n${label}:`);
  for (const r of runs) {
    console.log(
      `  seed${r.seed}: SEL ${r.selection.selCount} END ${r.viability.endCount} maxGen ${r.viability.maxGeneration} aliveGen ${r.selection.aliveMeanGen} corr ${r.selection.genStressCorr}`
    );
    console.log(`    H1 ${r.hypotheses.H1_genStressCorrelation.verdict} H2 ${r.hypotheses.H2_highGenLowerStressAtEnd.verdict} H3 ${r.hypotheses.H3_selectionChannelComplete.verdict}`);
  }
}

logRuns('剧变 3000', catRuns);
logRuns('对照 3000', ctrlRuns);
console.log('\n报告已写入 docs/field-phase26-report.json');
