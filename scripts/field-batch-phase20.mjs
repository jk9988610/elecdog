#!/usr/bin/env node
/**
 * Phase 20 — 细胞边界（代谢域）
 * A. solo 500 tick
 * B. 四体 400 tick
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeCell } from './lib/cell-analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase20 solo] 细胞边界');
  const born = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks };
}

function runFour(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase20 四体]');
  const births = [
    { name: '观察者', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
    { name: '002', code: '002' },
    { name: '003', code: '003' },
    { name: '001-乙', code: '001' },
  ].map((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, ticks);
  return { entries: recorder.entries, beings: world.beings, ticks };
}

const solo = runSolo(500);
const four = runFour(400);

const soloCell = analyzeCell(solo.entries, solo.beings);
const fourCell = analyzeCell(four.entries, four.beings);
const soloV = analyzeViability(solo.entries, solo.ticks);
const fourV = analyzeViability(four.entries, four.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 20,
  extension: 'cell_boundary_metabolic_domain',
  solo500: { cell: soloCell, viability: soloV },
  four400: { cell: fourCell, viability: fourV, alive: four.beings.filter((b) => b.alive).length },
};

writeFileSync(
  new URL('../docs/field-phase20-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 20 细胞边界完成');
console.log('\nsolo 500:');
console.log('  MBR:', soloCell.mbrCount, 'CEL:', soloCell.celCount, 'avgInt:', soloCell.avgIntegrity);
console.log('\n四体 400:');
console.log('  MBR:', fourCell.mbrCount, 'CEL:', fourCell.celCount, 'lowInt:', fourCell.lowIntegrityCount);
console.log('  END:', fourV.endCount, 'LINEAGE:', fourV.lineageCount);
