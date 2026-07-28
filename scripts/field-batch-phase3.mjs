#!/usr/bin/env node
/**
 * Phase 3
 * G. 002 × 3（验证模板倾向）
 * H. 001+002 双体（信号耦合已启用）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { analyzeRun, runTicks } from './lib/analyze.js';
import { countSameTickExternal } from './lib/cross.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function solo(label, birth) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, `世界创建 [${label}]`);
  const { id, being, dna } = performBirthRitual(world, recorder, birth);
  runTicks(world, recorder, TICKS);
  const analysis = analyzeRun({ entries: recorder.entries, beingId: id, ticks: TICKS });
  const signals = recorder.entries.filter((e) => e.channel === 'signal');
  return { label, meta: { id, code: being.code, name: being.name, dna: dna.sequence }, analysis, signals: signals.length };
}

function dual(label, births) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, `世界创建 [${label}]`);
  const born = births.map((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);

  const analyses = born.map(({ id, being }) => ({
    id,
    name: being.name,
    code: being.code,
    analysis: analyzeRun({ entries: recorder.entries, beingId: id, ticks: TICKS }),
  }));

  const ids = born.map((b) => b.id);
  const collision = countSameTickExternal(recorder.entries, ids, TICKS);
  const signalEntries = recorder.entries.filter((e) => e.channel === 'signal');
  const txCount = recorder.entries.filter((e) => e.channel === 'external' && e.content.startsWith('[TX]')).length;

  const rxByBeing = {};
  for (const s of signalEntries) {
    rxByBeing[s.beingId] = (rxByBeing[s.beingId] || 0) + 1;
  }

  return {
    label,
    analyses,
    collision,
    signalTotal: signalEntries.length,
    txTotal: txCount,
    rxByBeing,
    signalSamples: signalEntries.slice(0, 4).map((e) => `t${e.tick} ${e.beingId} ${e.content}`),
  };
}

const g1 = solo('002-③', { name: '002-丁', code: '002' });
const g2 = solo('002-④', { name: '002-戊', code: '002' });
const g3 = solo('002-⑤', { name: '002-己', code: '002' });

const h = dual('001+002 信号耦合', [
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002-庚', code: '002' },
]);

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  signalCoupling: true,
  exp002: [g1, g2, g3],
  expDual: h,
  stats002: {
    externalRates: [g1, g2, g3].map((x) => x.analysis.externalTickRate),
    r4Trends: [g1, g2, g3].map((x) => x.analysis.regTrends.r4.trend),
    avgExternal: [g1, g2, g3].reduce((s, x) => s + x.analysis.externalTickRate, 0) / 3,
  },
};

writeFileSync(new URL('../docs/field-phase3-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('Phase 3 完成\n');
console.log('--- 002 追加三只 ---');
for (const g of [g1, g2, g3]) {
  const a = g.analysis;
  console.log(
    `${g.meta.name}: 对外${(a.externalTickRate * 100).toFixed(1)}% r4:${a.regTrends.r4.trend} 脉冲:${a.pulse}`
  );
}
console.log(`002 五只合计 r4上升: ${[g1, g2, g3].filter((x) => x.analysis.regTrends.r4.trend === 'rising').length + 2}/5（含 Phase2 两只）`);
console.log(`002 平均对外率(本批3只): ${(report.stats002.avgExternal * 100).toFixed(1)}%`);

console.log('\n--- 双体 + 信号耦合 ---');
for (const a of h.analyses) {
  console.log(`${a.name}: 对外${(a.analysis.externalTickRate * 100).toFixed(1)}% r4:${a.analysis.regTrends.r4.trend}`);
}
console.log(`signal(RX) 总记录: ${h.signalTotal}`);
console.log(`TX 总发射: ${h.txTotal}`);
console.log(`RX 按个体:`, h.rxByBeing);
if (h.signalSamples.length) console.log('样本:', h.signalSamples[0]);
