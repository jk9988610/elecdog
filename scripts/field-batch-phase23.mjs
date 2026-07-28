#!/usr/bin/env node
/**
 * Phase 23 — 种群层（L3）资源压力与存续
 * 四体 2000 tick × 2 种子（剧变 / 无剧变对照）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
import { analyzeComposition } from './lib/composition-analyze.js';
import { analyzeNodeTargeting } from './lib/nodes-analyze.js';
import {
  analyzePopulationPressure,
  evaluatePopulationHypotheses,
} from './lib/population-analyze.js';

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

function createWorldOpts(name, { catastrophe = true } = {}) {
  const world = createWorld(name);
  if (!catastrophe) world.catastrophe = null;
  return world;
}

function runFour(ticks, seed, { catastrophe = true } = {}) {
  const label = catastrophe ? 'cat' : 'ctrl';
  const world = createWorldOpts(`01-p23-${label}-${seed}`, { catastrophe });
  const recorder = new Recorder();
  recorder.system(0, `[Phase23 ${label} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed, catastrophe };
}

function analyzeRun(run) {
  const viability = analyzeViability(run.entries, run.ticks);
  const composition = analyzeComposition(run.entries);
  const nodes = analyzeNodeTargeting(run.entries, run.ticks);
  const population = analyzePopulationPressure(run.entries, run.ticks);
  const hypotheses = evaluatePopulationHypotheses(population, viability, composition);
  return { seed: run.seed, viability, composition, nodes, population, hypotheses };
}

const withCat = SEEDS.map((s) => analyzeRun(runFour(TICKS, s, { catastrophe: true })));
const noCat = SEEDS.map((s) => analyzeRun(runFour(TICKS, s, { catastrophe: false })));

const report = {
  runAt: new Date().toISOString(),
  phase: 23,
  extension: 'population_l3_resource_pressure',
  ticks: TICKS,
  seeds: SEEDS,
  withCatastrophe: withCat,
  noCatastrophe: noCat,
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase23-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

function logGroup(label, runs) {
  console.log(`\n${label}:`);
  for (const r of runs) {
    const p = r.population;
    console.log(
      `  seed${r.seed}: DEP ${p.depCount} END ${r.viability.endCount} struct ${p.finalStruct} contest ${p.contestCount}`
    );
    console.log(
      `    H1 ${r.hypotheses.H1_depPrecedesEnd.verdict} H2 ${r.hypotheses.H2_meshMoreCompetition.verdict} H3 ${r.hypotheses.H3_populationMaintained.verdict}`
    );
  }
}

console.log('Phase 23 种群层田野完成');
logGroup('四体 2000 剧变', withCat);
logGroup('四体 2000 无剧变', noCat);
