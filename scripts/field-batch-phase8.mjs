#!/usr/bin/env node
/**
 * Phase 8 — 观察者 DNA 1000 tick 长时运行
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { analyzeRun, runTicks } from './lib/analyze.js';
import { analyzeSignalImpact } from './lib/signal-analyze.js';

const TICKS = 1000;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function extRate(entries, id, from, to) {
  let n = 0;
  for (let t = from; t <= to; t++) {
    if (entries.some((e) => e.channel === 'external' && e.beingId === id && e.tick === t)) n++;
  }
  return n / (to - from + 1);
}

function regAt(entries, id, tick) {
  const s = entries.find((e) => e.channel === 'state' && e.beingId === id && e.tick === tick);
  return s?.meta?.registers;
}

const world = createWorld('01');
const recorder = new Recorder();
recorder.system(0, 'Phase8 长时 1000tick');

const { id } = performBirthRitual(world, recorder, {
  name: '小狗',
  code: '001',
  dnaSequence: OBSERVER_DNA,
  id: OBSERVER_ID,
});

runTicks(world, recorder, TICKS);

const entries = recorder.entries;
const analysis = analyzeRun({ entries, beingId: id, ticks: TICKS });

const segments = [
  { label: 't1-200', from: 1, to: 200 },
  { label: 't201-400', from: 201, to: 400 },
  { label: 't401-600', from: 401, to: 600 },
  { label: 't601-800', from: 601, to: 800 },
  { label: 't801-1000', from: 801, to: 1000 },
].map((s) => ({ ...s, rate: extRate(entries, id, s.from, s.to) }));

const r4checkpoints = [1, 200, 400, 600, 800, 1000].map((t) => ({
  tick: t,
  r4: regAt(entries, id, t)?.[4],
  r0: regAt(entries, id, t)?.[0],
}));

const exts = entries.filter((e) => e.channel === 'external' && e.beingId === id);
const tx = exts.filter((e) => e.content.startsWith('[TX]')).length;
const act = exts.filter((e) => e.content.startsWith('[ACT]')).length;

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  id: OBSERVER_ID,
  pulse: analysis.pulse,
  totalExternalRate: analysis.externalTickRate,
  txCount: tx,
  actCount: act,
  txRatio: tx / (tx + act),
  r4Trend: analysis.regTrends.r4,
  segments,
  r4checkpoints,
  avgInternal: analysis.avgInternal || entries.filter((e) => e.channel === 'internal' && e.beingId === id && e.tick > 0).length / TICKS,
  codex: {
    pulseMatch: analysis.pulse === '0x54 0x00 0x01',
    emptyInternal: analyzeRun({ entries, beingId: id, ticks: TICKS }).emptyInternalTicks?.length ?? 0,
  },
  compare200: {
    obs04external: 0.545,
    obs04r4: '0.0437→0.3937 rising',
  },
};

writeFileSync(new URL('../docs/field-phase8-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('Phase 8 长时 1000 tick 完成');
console.log('意识脉冲:', report.pulse, report.codex.pulseMatch ? '✓' : '');
console.log('全程对外率:', (report.totalExternalRate * 100).toFixed(1) + '%');
console.log('TX/ACT:', tx, act, 'TX占', (report.txRatio * 100).toFixed(0) + '%');
console.log('r4:', report.r4Trend.t1?.toFixed(4), '→', report.r4Trend.tEnd?.toFixed(4), report.r4Trend.trend);
console.log('\n分段对外率:');
for (const s of segments) console.log(`  ${s.label}: ${(s.rate * 100).toFixed(1)}%`);
console.log('\nr4 检查点:', r4checkpoints.map((c) => `t${c.tick}=${c.r4?.toFixed(3)}`).join(' '));
