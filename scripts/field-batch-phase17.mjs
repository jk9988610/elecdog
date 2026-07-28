#!/usr/bin/env node
/**
 * Phase 17 — 自助求生 + 谱系续行
 * A. 观察者 solo 800 tick（多代 END/LINEAGE）
 * B. 四体 300 tick（种群压力）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability, populationTimeline } from './lib/viability-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase17 solo] 自助求生');
  performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  return {
    entries: recorder.entries,
    ticks,
    alive: world.beings.filter((b) => b.alive).length,
    total: world.beings.length,
    maxGen: Math.max(0, ...world.beings.map((b) => b.generation || 0)),
  };
}

function runFour(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase17 四体]');
  [
    { name: '观察者', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
    { name: '002', code: '002' },
    { name: '003', code: '003' },
    { name: '001-乙', code: '001' },
  ].forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return {
    entries: recorder.entries,
    ticks,
    alive: world.beings.filter((b) => b.alive).length,
    ends: world.beings.filter((b) => !b.alive).length,
  };
}

const solo = runSolo(800);
const four = runFour(300);

const soloV = analyzeViability(solo.entries, solo.ticks);
const fourV = analyzeViability(four.entries, four.ticks);
const soloPop = populationTimeline(solo.entries, solo.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 17,
  extension: 'viability_feedback_end_lineage',
  solo800: { viability: soloV, population: soloPop, alive: solo.alive, maxGen: solo.maxGen },
  four300: { viability: fourV, alive: four.alive, dead: four.ends },
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase17-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 17 自助求生完成');
console.log('\nsolo 800:');
console.log('  END:', soloV.endCount, 'LINEAGE:', soloV.lineageCount, '最高代:', solo.maxGen);
console.log('  存活:', solo.alive, '/', solo.total);
console.log('  SVV:', soloV.svvCount);
console.log('\n四体 300:');
console.log('  END:', fourV.endCount, 'LINEAGE:', fourV.lineageCount, '存活:', four.alive);
