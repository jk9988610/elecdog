#!/usr/bin/env node
/**
 * Phase 18 — 环境剧变（可观测场/节点脉冲）
 * A. 观察者 solo 500 tick（≥5 次脉冲）
 * B. 四体 300 tick（脉冲下 END/LINEAGE 与场压响应）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
import { analyzeCatastrophe } from './lib/catastrophe-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase18 solo] 环境剧变');
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
  recorder.system(0, '[Phase18 四体]');
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

const solo = runSolo(500);
const four = runFour(300);

const soloCat = analyzeCatastrophe(solo.entries, solo.ticks);
const fourCat = analyzeCatastrophe(four.entries, four.ticks);
const soloV = analyzeViability(solo.entries, solo.ticks);
const fourV = analyzeViability(four.entries, four.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 18,
  extension: 'catastrophe_pulse_shk_npl',
  solo500: {
    catastrophe: soloCat,
    viability: soloV,
    alive: solo.alive,
    maxGen: solo.maxGen,
  },
  four300: {
    catastrophe: fourCat,
    viability: fourV,
    alive: four.alive,
    dead: four.ends,
  },
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase18-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 18 环境剧变完成');
console.log('\nsolo 500:');
console.log('  SHK:', soloCat.shkCount, 'NPL:', soloCat.nplCount, '脉冲 tick:', soloCat.pulseTicks);
console.log('  END:', soloV.endCount, 'LINEAGE:', soloV.lineageCount, 'SVV:', soloV.svvCount);
console.log('  脉冲后平均 SVV:', soloCat.avgSvvAfterPulse.toFixed(1));
console.log('\n四体 300:');
console.log('  SHK:', fourCat.shkCount, 'NPL:', fourCat.nplCount);
console.log('  END:', fourV.endCount, 'LINEAGE:', fourV.lineageCount, '存活:', four.alive);
