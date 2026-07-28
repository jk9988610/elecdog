#!/usr/bin/env node
/**
 * Phase 4
 * I. 003 × 3 单世界
 * J. 观察者 001 单世界 vs 双体(001+002) TX/ACT 对比
 * K. 信号对接收者内在流/对外比例的影响
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { analyzeRun, runTicks } from './lib/analyze.js';
import { analyzeSignalImpact } from './lib/signal-analyze.js';
import { generateTemplate } from '../src/core/dna.js';
import { diffDna } from './lib/cross.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(label, birth) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, `[${label}]`);
  const { id, being, dna } = performBirthRitual(world, recorder, birth);
  runTicks(world, recorder, TICKS);
  return {
    label,
    id,
    code: being.code,
    dna: dna.sequence,
    entries: recorder.entries,
    analysis: analyzeRun({ entries: recorder.entries, beingId: id, ticks: TICKS }),
  };
}

function runDual(births) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[dual]');
  const born = births.map((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  return { born, entries: recorder.entries };
}

// --- 003 × 3 ---
const t001 = generateTemplate('001');
const t002 = generateTemplate('002');
const t003 = generateTemplate('003');

const e003a = runSolo('003-甲', { name: '003-甲', code: '003' });
const e003b = runSolo('003-乙', { name: '003-乙', code: '003' });
const e003c = runSolo('003-丙', { name: '003-丙', code: '003' });

// --- 观察者 solo vs dual ---
const soloObs = runSolo('观察者solo', {
  name: '小狗',
  code: '001',
  dnaSequence: OBSERVER_DNA,
  id: OBSERVER_ID,
});

const dual = runDual([
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002-辛', code: '002' },
]);

const dualObsSignal = analyzeSignalImpact(dual.entries, OBSERVER_ID, TICKS);
const dualOtherId = dual.born.find((b) => b.id !== OBSERVER_ID).id;
const dualOtherSignal = analyzeSignalImpact(dual.entries, dualOtherId, TICKS);

function extStats(entries, id) {
  const exts = entries.filter((e) => e.channel === 'external' && e.beingId === id);
  const tx = exts.filter((e) => e.content.startsWith('[TX]')).length;
  const act = exts.filter((e) => e.content.startsWith('[ACT]')).length;
  return { tx, act, txRatio: tx / (tx + act) };
}

const soloExt = extStats(soloObs.entries, OBSERVER_ID);
const dualExt = extStats(dual.entries, OBSERVER_ID);

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  templates: {
    diff001_003: diffDna(t001, t003).diffCount,
    diff002_003: diffDna(t002, t003).diffCount,
    prefix003: t003.slice(0, 24) + '…',
  },
  exp003: [e003a, e003b, e003c].map((e) => ({
    label: e.label,
    id: e.id,
    pulse: e.analysis.pulse,
    externalRate: e.analysis.externalTickRate,
    r4: e.analysis.regTrends.r4.trend,
    txAct: extStats(e.entries, e.id),
  })),
  observerCompare: {
    solo: { ...soloExt, externalRate: soloObs.analysis.externalTickRate },
    dual: { ...dualExt, externalRate: analyzeRun({ entries: dual.entries, beingId: OBSERVER_ID, ticks: TICKS }).externalTickRate },
    soloR4: soloObs.analysis.regTrends.r4.trend,
    dualR4: analyzeRun({ entries: dual.entries, beingId: OBSERVER_ID, ticks: TICKS }).regTrends.r4.trend,
  },
  signalImpact: {
    observer: dualObsSignal,
    other002: dualOtherSignal,
  },
};

writeFileSync(new URL('../docs/field-phase4-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('Phase 4 完成\n');
console.log('--- 003 三只 ---');
for (const e of report.exp003) {
  console.log(
    `${e.label}: 对外${(e.externalRate * 100).toFixed(1)}% r4:${e.r4} TX占比${(e.txAct.txRatio * 100).toFixed(0)}% 脉冲:${e.pulse}`
  );
}
const avg003ext = report.exp003.reduce((s, e) => s + e.externalRate, 0) / 3;
console.log(`003 平均对外率: ${(avg003ext * 100).toFixed(1)}%`);
console.log(`模板差异: 001/003=${report.templates.diff001_003} 002/003=${report.templates.diff002_003}`);

console.log('\n--- 观察者 solo vs dual ---');
console.log(`solo: 对外${(report.observerCompare.solo.externalRate * 100).toFixed(1)}% TX占${(report.observerCompare.solo.txRatio * 100).toFixed(0)}% r4:${report.observerCompare.soloR4}`);
console.log(`dual: 对外${(report.observerCompare.dual.externalRate * 100).toFixed(1)}% TX占${(report.observerCompare.dual.txRatio * 100).toFixed(0)}% r4:${report.observerCompare.dualR4}`);

console.log('\n--- 收到 signal 的 tick（观察者）---');
const w = report.signalImpact.observer.withRx;
console.log(`RX tick数: ${report.signalImpact.observer.rxTicks}`);
console.log(`有RX时 平均internal: ${w.avgInternal.toFixed(2)} 对外率:${(w.externalRate * 100).toFixed(1)}% TX占外部:${w.txOfExternal != null ? (w.txOfExternal * 100).toFixed(0) + '%' : 'n/a'}`);
