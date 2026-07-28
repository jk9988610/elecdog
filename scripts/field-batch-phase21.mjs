#!/usr/bin/env node
/**
 * Phase 21 — 多代进化定律（田野）
 * A. solo 2000 tick × 2 种子
 * B. 四体 1500 tick × 2 种子
 * C. 四体 2000 tick（剧变）× 2 种子
 * D. 四体 1500 tick（无剧变对照）× 2 种子
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeEvolution, evaluateHypotheses, compareRuns } from './lib/evolution-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

const FOUR = [
  { name: '观察者', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002', code: '002' },
  { name: '003', code: '003' },
  { name: '001-乙', code: '001' },
];

function createWorldOpts(name, { catastrophe = true } = {}) {
  const world = createWorld(name);
  if (!catastrophe) world.catastrophe = null;
  return world;
}

function runSolo(ticks, seed) {
  const world = createWorldOpts(`01-solo-${seed}`);
  const recorder = new Recorder();
  recorder.system(0, `[Phase21 A solo seed${seed}]`);
  performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed };
}

function runFour(ticks, seed, { catastrophe = true } = {}) {
  const label = catastrophe ? 'BC' : 'D';
  const world = createWorldOpts(`01-four-${label}-${seed}`, { catastrophe });
  const recorder = new Recorder();
  recorder.system(0, `[Phase21 ${label} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks, seed, catastrophe };
}

function analyzeRun(run) {
  const evolution = analyzeEvolution(run);
  const hypotheses = evaluateHypotheses(evolution);
  return { ...run, evolution, hypotheses };
}

const seeds = [0, 1];

const A = seeds.map((s) => analyzeRun(runSolo(2000, s)));
const B = seeds.map((s) => analyzeRun(runFour(1500, s, { catastrophe: true })));
const C = seeds.map((s) => analyzeRun(runFour(2000, s, { catastrophe: true })));
const D = seeds.map((s) => analyzeRun(runFour(1500, s, { catastrophe: false })));

const report = {
  runAt: new Date().toISOString(),
  phase: 21,
  extension: 'multi_generation_evolution_field',
  scenarios: {
    A_solo2000: A.map(({ seed, evolution, hypotheses }) => ({ seed, evolution, hypotheses })),
    B_four1500: B.map(({ seed, evolution, hypotheses }) => ({ seed, evolution, hypotheses })),
    C_four2000_catastrophe: C.map(({ seed, evolution, hypotheses }) => ({ seed, evolution, hypotheses })),
    D_four1500_no_catastrophe: D.map(({ seed, evolution, hypotheses }) => ({ seed, evolution, hypotheses })),
  },
  crossSeed: {
    A: compareRuns(A),
    B: compareRuns(B),
    C: compareRuns(C),
    D: compareRuns(D),
  },
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase21-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

function summarize(label, runs) {
  const r = runs[0].evolution;
  console.log(`\n${label} (seed0):`);
  console.log('  END:', r.viability.endCount, 'LINEAGE:', r.viability.lineageCount);
  console.log('  最高代:', r.dna.maxGeneration, '存活:', r.dna.aliveCount, '/', r.dna.totalCount);
  console.log('  DNA漂移(存活vs代0):', JSON.stringify(r.dna.driftAliveVsGen0));
  console.log('  structDrift:', r.composition.structDrift, 'avgInt:', r.cell.avgIntegrity);
  console.log('  H1:', runs[0].hypotheses.H1_dnaDrift.verdict, 'H2:', runs[0].hypotheses.H2_endLineageBalance.verdict);
}

console.log('Phase 21 多代进化田野完成');
summarize('A solo 2000', A);
summarize('B 四体 1500', B);
summarize('C 四体 2000 剧变', C);
summarize('D 四体 1500 无剧变', D);
console.log('\n跨种子一致性:');
console.log('  A:', report.crossSeed.A.signConsistent, 'avgDrift:', report.crossSeed.A.avgDrift);
console.log('  C:', report.crossSeed.C.signConsistent, 'avgDrift:', report.crossSeed.C.avgDrift);
