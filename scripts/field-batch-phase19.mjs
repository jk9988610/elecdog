#!/usr/bin/env node
/**
 * Phase 19 — 生物圈反馈 + 种群结构观察
 * A. solo 500 tick（低种群密度基线）
 * B. 四体 400 tick（多种群密度 + 剧变 + 谱系）
 * 对比 structIdx / BIO 与环境的共变
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
import { analyzeCatastrophe } from './lib/catastrophe-analyze.js';
import { analyzeBiotic } from './lib/biotic-analyze.js';
import { analyzeComposition, compareComposition } from './lib/composition-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase19 solo] 生物圈+结构');
  performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, ticks, alive: world.beings.filter((b) => b.alive).length };
}

function runFour(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase19 四体]');
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
    total: world.beings.length,
  };
}

const solo = runSolo(500);
const four = runFour(400);

const soloBio = analyzeBiotic(solo.entries, solo.ticks);
const fourBio = analyzeBiotic(four.entries, four.ticks);
const soloCmp = analyzeComposition(solo.entries);
const fourCmp = analyzeComposition(four.entries);
const cmpCompare = compareComposition(soloCmp, fourCmp);
const soloV = analyzeViability(solo.entries, solo.ticks);
const fourV = analyzeViability(four.entries, four.ticks);
const fourCat = analyzeCatastrophe(four.entries, four.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 19,
  extension: 'biotic_feedback_composition_trace',
  principle: 'environment-led; no Earth-organism labels',
  solo500: { biotic: soloBio, composition: soloCmp, viability: soloV },
  four400: {
    biotic: fourBio,
    composition: fourCmp,
    viability: fourV,
    catastrophe: fourCat,
    alive: four.alive,
    total: four.total,
  },
  comparison: cmpCompare,
  roadmap: 'docs/EVOLUTION.md',
};

writeFileSync(
  new URL('../docs/field-phase19-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 19 生物圈+种群结构完成');
console.log('\nsolo 500:');
console.log('  BIO:', soloBio.bioCount, '净场态Δ:', soloBio.netSubstrateDelta);
console.log('  CMP:', soloCmp.cmpCount, 'avgStruct:', soloCmp.avgStruct, 'drift:', soloCmp.structDrift);
console.log('\n四体 400:');
console.log('  BIO:', fourBio.bioCount, 'avgPop@BIO:', fourBio.avgPopAtBio.toFixed(1));
console.log('  CMP:', fourCmp.cmpCount, 'avgStruct:', fourCmp.avgStruct, 'cluster/mesh ticks:', fourCmp.clusterDominant, '/', fourCmp.meshDominant);
console.log('  END:', fourV.endCount, 'LINEAGE:', fourV.lineageCount, '存活:', four.alive);
console.log('\n结构对比 solo vs 四体 structGap:', cmpCompare.structGap);
