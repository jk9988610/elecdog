#!/usr/bin/env node
/**
 * Phase 22 — 多体 DNA 漂移可重复性验证
 * 四体 2500 tick × 4 种子（剧变 / 无剧变对照）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import {
  analyzeEvolution,
  evaluateHypotheses,
  compareRuns,
  majorityDriftConsensus,
} from './lib/evolution-analyze.js';

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
const TICKS = 2500;

function createWorldOpts(name, { catastrophe = true } = {}) {
  const world = createWorld(name);
  if (!catastrophe) world.catastrophe = null;
  return world;
}

function runFour(ticks, seed, { catastrophe = true } = {}) {
  const label = catastrophe ? 'cat' : 'ctrl';
  const world = createWorldOpts(`01-p22-${label}-${seed}`, { catastrophe });
  const recorder = new Recorder();
  recorder.system(0, `[Phase22 ${label} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed, catastrophe };
}

function analyzeRun(run) {
  const evolution = analyzeEvolution(run);
  const hypotheses = evaluateHypotheses(evolution);
  return { ...run, evolution, hypotheses };
}

const withCat = SEEDS.map((s) => analyzeRun(runFour(TICKS, s, { catastrophe: true })));
const noCat = SEEDS.map((s) => analyzeRun(runFour(TICKS, s, { catastrophe: false })));

const catConsensus = majorityDriftConsensus(withCat);
const ctrlConsensus = majorityDriftConsensus(noCat);

const report = {
  runAt: new Date().toISOString(),
  phase: 22,
  extension: 'multi_body_drift_repeatability',
  ticks: TICKS,
  seeds: SEEDS,
  withCatastrophe: {
    runs: withCat.map(({ seed, evolution, hypotheses }) => ({ seed, evolution, hypotheses })),
    compare: compareRuns(withCat),
    consensus: catConsensus,
  },
  noCatastrophe: {
    runs: noCat.map(({ seed, evolution, hypotheses }) => ({ seed, evolution, hypotheses })),
    compare: compareRuns(noCat),
    consensus: ctrlConsensus,
  },
  verdict: {
    h1MultiBodyRepeatable:
      catConsensus.allUnanimous && ctrlConsensus.allUnanimous ? 'support' : 'unsupport',
    gap10Candidate: !(catConsensus.allUnanimous || ctrlConsensus.allUnanimous),
  },
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase22-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

function logGroup(label, runs, consensus) {
  console.log(`\n${label}:`);
  for (const r of runs) {
    const e = r.evolution;
    console.log(
      `  seed${r.seed}: END ${e.viability.endCount} maxGen ${e.dna.maxGeneration} drift ${JSON.stringify(e.dna.driftAliveVsGen0)}`
    );
  }
  console.log('  signConsistent:', compareRuns(runs).signConsistent);
  console.log('  unanimousBases:', consensus.unanimousBases, '/ 4');
  console.log('  consensus:', JSON.stringify(consensus.consensus));
}

console.log('Phase 22 多体漂移可重复性验证完成');
logGroup('四体 2500 剧变', withCat, catConsensus);
logGroup('四体 2500 无剧变', noCat, ctrlConsensus);
console.log('\n裁定 H1 多体可重复:', report.verdict.h1MultiBodyRepeatable);
console.log('登记 GAP-10:', report.verdict.gap10Candidate);
