#!/usr/bin/env node
/**
 * Phase 6 — 四体世界 + 多RX统计
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeNBodyChains, multiRxDistribution } from './lib/nbody.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

const world = createWorld('01');
const recorder = new Recorder();
recorder.system(0, '四体世界 Phase6');

const births = [
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002-癸', code: '002' },
  { name: '003-庚', code: '003' },
  { name: '001-乙', code: '001' },
];

const born = births.map((b) => performBirthRitual(world, recorder, b));
runTicks(world, recorder, TICKS);

const ids = born.map((b) => b.id);
const entries = recorder.entries;

const chains = analyzeNBodyChains(entries, ids, TICKS, 4);
const multiRx = {};
for (let i = 0; i < ids.length; i++) {
  multiRx[births[i].name] = multiRxDistribution(entries, ids[i]);
}

const txTotal = entries.filter((e) => e.channel === 'external' && e.content.startsWith('[TX]')).length;
const rxTotal = entries.filter((e) => e.channel === 'signal').length;

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  beingCount: 4,
  beings: births.map((b, i) => ({ name: b.name, code: b.code, id: ids[i].slice(-8) })),
  txTotal,
  rxTotal,
  chains,
  multiRxPerBeing: multiRx,
};

writeFileSync(new URL('../docs/field-phase6-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('Phase 6 四体世界');
console.log('TX:', txTotal, 'RX:', rxTotal);
console.log('链跳数分布:', chains.hopDistribution);
console.log('最大跳数:', chains.maxHopObserved);
console.log('多RX分布(观察者):', multiRx['小狗']);
