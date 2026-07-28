#!/usr/bin/env node
/**
 * Phase 5
 * L. 003 × 2 追加
 * M. RX 衍生 hex 可预测性（双体/三体）
 * N. 三体同世界 001+002+003 signal 链
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { analyzeRun, runTicks } from './lib/analyze.js';
import { analyzeRxHexPredictability, analyzeSignalChains } from './lib/signal-chain.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function solo(birth) {
  const world = createWorld('01');
  const recorder = new Recorder();
  const { id, being, dna } = performBirthRitual(world, recorder, birth);
  runTicks(world, recorder, TICKS);
  return {
    id,
    code: being.code,
    name: being.name,
    entries: recorder.entries,
    analysis: analyzeRun({ entries: recorder.entries, beingId: id, ticks: TICKS }),
  };
}

function multi(births) {
  const world = createWorld('01');
  const recorder = new Recorder();
  const born = births.map((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  return {
    ids: born.map((b) => b.id),
    names: born.map((b) => b.being.name),
    entries: recorder.entries,
    analyses: born.map((b) =>
      analyzeRun({ entries: recorder.entries, beingId: b.id, ticks: TICKS })
    ),
  };
}

const e003d = solo({ name: '003-丁', code: '003' });
const e003e = solo({ name: '003-戊', code: '003' });

const triple = multi([
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002-壬', code: '002' },
  { name: '003-己', code: '003' },
]);

const hexPred = {};
for (let i = 0; i < triple.ids.length; i++) {
  hexPred[triple.names[i]] = analyzeRxHexPredictability(triple.entries, triple.ids[i]);
}

const chains = analyzeSignalChains(triple.entries, triple.ids, TICKS);

const all003 = [
  { label: '003-丁', rate: e003d.analysis.externalTickRate, r4: e003d.analysis.regTrends.r4.trend },
  { label: '003-戊', rate: e003e.analysis.externalTickRate, r4: e003e.analysis.regTrends.r4.trend },
  { label: '003-己(三体)', rate: triple.analyses[2].externalTickRate, r4: triple.analyses[2].regTrends.r4.trend },
];
const avg003all5 = (55.7 + e003d.analysis.externalTickRate * 100 + e003e.analysis.externalTickRate * 100) / 3; // phase4 avg approx

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  exp003追加: [
    { name: '003-丁', externalRate: e003d.analysis.externalTickRate, r4: e003d.analysis.regTrends.r4.trend, pulse: e003d.analysis.pulse },
    { name: '003-戊', externalRate: e003e.analysis.externalTickRate, r4: e003e.analysis.regTrends.r4.trend, pulse: e003e.analysis.pulse },
  ],
  exp003累计5只均值: null,
  hexPredictability: hexPred,
  tripleWorld: {
    beings: triple.names,
    ids: triple.ids.map((id) => id.slice(-8)),
    externalRates: triple.analyses.map((a, i) => ({ name: triple.names[i], rate: a.externalTickRate })),
    signalChains: chains,
  },
};

const rates003 = [
  0.58, 0.55, 0.54, e003d.analysis.externalTickRate, e003e.analysis.externalTickRate,
];
report.exp003累计5只均值 = rates003.reduce((a, b) => a + b, 0) / rates003.length;

writeFileSync(new URL('../docs/field-phase5-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('Phase 5 完成\n');
console.log('--- 003 追加 ---');
for (const e of report.exp003追加) {
  console.log(`${e.name}: 对外${(e.externalRate * 100).toFixed(1)}% r4:${e.r4}`);
}
console.log(`003 五只均值对外率: ${(report.exp003累计5只均值 * 100).toFixed(1)}% (含Phase4三只)`);

console.log('\n--- RX hex 可预测性（三体）---');
for (const [name, p] of Object.entries(hexPred)) {
  console.log(`${name}: ${p.match}/${p.rxTickCount} tick匹配, 完全可预测:${p.fullyPredictable}`);
}

console.log('\n--- 三体 signal 链 ---');
console.log('链接总数:', chains.totalLinks);
console.log('跳数分布:', chains.hopDistribution);
console.log('三跳链:', chains.threeHopCount);
if (chains.samples.length) console.log('链样本:', JSON.stringify(chains.samples[0]));
