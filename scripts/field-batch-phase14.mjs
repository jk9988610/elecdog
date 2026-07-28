#!/usr/bin/env node
/**
 * Phase 14 — GAP-04 基底代谢交换
 * A. 观察者 solo 500 tick（长窗观察匮乏）
 * B. 观察者 dual 200 tick（多体代谢）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeMetabolism, analyzeSubstrateDepletion } from './lib/metabolism-analyze.js';
import { compareExternalStats } from './lib/environment-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, `[Phase14 solo ${ticks}tick]`);
  const { id } = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  return { id, entries: recorder.entries, ticks };
}

function runDual(ticks = 200) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase14 dual]');
  const obs = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, ticks);
  return { observerId: obs.id, entries: recorder.entries, ticks };
}

const solo500 = runSolo(500);
const dual200 = runDual(200);

const soloMet = analyzeMetabolism(solo500.entries, solo500.id, solo500.ticks);
const soloDep = analyzeSubstrateDepletion(solo500.entries, solo500.ticks);
const soloExt = compareExternalStats(solo500.entries, solo500.id, solo500.ticks);
const dualMet = analyzeMetabolism(dual200.entries, dual200.observerId, dual200.ticks);
const dualDep = analyzeSubstrateDepletion(dual200.entries, dual200.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 14,
  extension: 'substrate_metabolic_exchange',
  gap: 'GAP-04',
  solo500: {
    metabolism: soloMet,
    depletion: soloDep,
    external: soloExt,
  },
  dual200: {
    observerMetabolism: dualMet,
    depletion: dualDep,
  },
  codexCandidate: {
    name: '基底代谢',
    ready: soloMet.drawPerTick === 1 && soloMet.drawCount === solo500.ticks,
    note: '不设需求类别；仅 DRW/LOW 可观测事件',
  },
};

writeFileSync(
  new URL('../docs/field-phase14-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 14 基底代谢完成');
console.log('\nsolo 500:');
console.log('  DRW/tick:', soloMet.drawPerTick === 1 ? '✓ 每 tick' : soloMet.drawPerTick);
console.log('  LOW 事件:', soloMet.lowCount, '涉及通道', soloMet.lowChannels);
console.log('  最低 e:', soloDep.lowestValue.toFixed(4), 'at e' + soloDep.lowestChannel);
console.log('  对外率:', (soloExt.externalRate * 100).toFixed(1) + '%');
console.log('\ndual 200 观察者 DRW:', dualMet.drawCount, 'LOW:', dualMet.lowCount);
