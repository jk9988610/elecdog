#!/usr/bin/env node
/**
 * Phase 16 — GAP-07 社会位与社会迹
 * A. 四体 200 tick
 * B. 双体 200 tick（基线）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeSocial } from './lib/social-analyze.js';
import { analyzeNBodyChains } from './lib/nbody.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runFour() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, 'Phase16 四体');
  const births = [
    { name: '观察者', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
    { name: '002-甲', code: '002' },
    { name: '003-甲', code: '003' },
    { name: '001-乙', code: '001' },
  ];
  const born = births.map((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  return {
    beings: born.map((b) => b.being),
    ids: born.map((b) => b.id),
    entries: recorder.entries,
    ticks: TICKS,
  };
}

function runDual() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, 'Phase16 双体');
  const a = performBirthRitual(world, recorder, {
    name: '观察者',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  const b = performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, TICKS);
  return { beings: [a.being, b.being], entries: recorder.entries, ticks: TICKS };
}

const four = runFour();
const dual = runDual();

const fourSocial = analyzeSocial(four.entries, four.beings);
const dualSocial = analyzeSocial(dual.entries, dual.beings);
const chains = analyzeNBodyChains(four.entries, four.ids, four.ticks, 4);

const report = {
  runAt: new Date().toISOString(),
  phase: 16,
  extension: 'social_slot_and_trace',
  gap: 'GAP-07',
  fourBody: {
    slots: fourSocial.slotMap,
    bySlot: fourSocial.bySlot,
    contestCount: fourSocial.contestCount,
    divisionSkew: fourSocial.divisionSkew,
    rxLinksTop: Object.entries(fourSocial.rxLinks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6),
    chains: chains.hopDistribution,
  },
  dual: {
    slots: dualSocial.slotMap,
    bySlot: dualSocial.bySlot,
    contestCount: dualSocial.contestCount,
  },
  codexCandidate: {
    name: '社会位',
    ready: fourSocial.hasPersistentSlots && Object.keys(fourSocial.bySlot).length >= 3,
  },
};

writeFileSync(
  new URL('../docs/field-phase16-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 16 社会位/社会迹完成');
console.log('\n四体社会位:', fourSocial.slotMap);
console.log('各位 TX/TGT:', JSON.stringify(fourSocial.bySlot, null, 0));
console.log('节点争夺 contest:', fourSocial.contestCount);
console.log('分工偏斜(活动量极差):', fourSocial.divisionSkew);
console.log('信号链:', chains.hopDistribution);
console.log('\n双体 contest:', dualSocial.contestCount);
