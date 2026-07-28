#!/usr/bin/env node
/** 200 tick 田野运行 + 与历史观察对比 */

import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { writeFileSync } from 'fs';

const TICKS = 200;
const world = createWorld('01');
const recorder = new Recorder();

recorder.system(0, `世界创建 ${world.name}`);
const { being, id, dna } = performBirthRitual(world, recorder, {
  name: '小狗',
  code: '001',
});

for (let i = 0; i < TICKS; i++) {
  stepWorld(world, recorder);
}

const entries = recorder.entries;
const internals = entries.filter((e) => e.channel === 'internal' && e.tick > 0);
const externals = entries.filter((e) => e.channel === 'external');
const states = entries.filter((e) => e.channel === 'state');

const ticksWithInternal = new Set(internals.map((e) => e.tick));
const ticksWithExternal = new Set(externals.map((e) => e.tick));
const emptyInternalTicks = [];
for (let t = 1; t <= TICKS; t++) {
  if (!ticksWithInternal.has(t)) emptyInternalTicks.push(t);
}

const pulse = entries.find((e) => e.channel === 'internal' && e.tick === 0);
const pulseParts = pulse?.content?.split(' ') ?? [];
const firstExt = externals[0];

const txCount = externals.filter((e) => e.content.startsWith('[TX]')).length;
const actCount = externals.filter((e) => e.content.startsWith('[ACT]')).length;
const otherExt = externals.filter(
  (e) => !e.content.startsWith('[TX]') && !e.content.startsWith('[ACT]')
);

const internalPerTick = {};
for (const e of internals) {
  internalPerTick[e.tick] = (internalPerTick[e.tick] || 0) + 1;
}
const internalCounts = Object.values(internalPerTick);
const avgInternal = internals.length / TICKS;

const stateByTick = {};
for (const s of states) {
  stateByTick[s.tick] = s.meta.registers;
}

function regSeries(idx) {
  const series = [];
  for (let t = 1; t <= TICKS; t++) {
    if (stateByTick[t]) series.push({ t, v: stateByTick[t][idx] });
  }
  return series;
}

function monotonicTrend(series) {
  if (series.length < 2) return 'insufficient';
  const first = series[0].v;
  const last = series[series.length - 1].v;
  const delta = last - first;
  if (Math.abs(delta) < 0.05) return 'stable';
  return delta > 0 ? 'rising' : 'falling';
}

const regTrends = {};
for (let i = 0; i < 8; i++) {
  const s = regSeries(i);
  regTrends[`r${i}`] = {
    t1: s[0]?.v,
    t200: s[s.length - 1]?.v,
    trend: monotonicTrend(s),
    min: Math.min(...s.map((x) => x.v)),
    max: Math.max(...s.map((x) => x.v)),
  };
}

// 早期对外密度 t2-7
let earlyExt = 0;
for (let t = 2; t <= 7; t++) {
  if (ticksWithExternal.has(t)) earlyExt++;
}

// 分段对外密度
function extRate(from, to) {
  let n = 0;
  for (let t = from; t <= to; t++) if (ticksWithExternal.has(t)) n++;
  return n / (to - from + 1);
}

const report = {
  meta: {
    world: world.name,
    being: `${being.name}（${being.code}）`,
    id,
    dnaLength: dna.sequence.length,
    mutations: dna.mutationCount,
    ticks: `0-${TICKS}`,
  },
  codex: {
    意识脉冲: {
      value: pulse?.content,
      match: pulseParts[1] === '0x00' && pulseParts[2] === '0x01',
    },
    对内节律: {
      emptyTicks: emptyInternalTicks,
      avgPerTick: avgInternal,
      min: Math.min(...internalCounts),
      max: Math.max(...internalCounts),
    },
    寄存器漂移: regTrends,
    对外双型: { tx: txCount, act: actCount, other: otherExt.length, otherSamples: otherExt.slice(0, 3) },
  },
  summary: {
    totalEntries: entries.length,
    internalCount: internals.length,
    externalCount: externals.length,
    externalTickRate: ticksWithExternal.size / TICKS,
    firstExternalTick: firstExt?.tick,
    firstExternalKind: firstExt?.content?.split(' ')[0],
    earlyExtT2to7: `${earlyExt}/6`,
    extRateT1to20: extRate(1, 20),
    extRateT21to100: extRate(21, 100),
    extRateT101to200: extRate(101, 200),
  },
};

const outPath = new URL('../docs/run-200-report.json', import.meta.url);
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log('=== 200 tick 田野运行 ===');
console.log(JSON.stringify(report.meta, null, 2));
console.log('\n--- CODEX 验证 ---');
console.log('意识脉冲:', report.codex.意识脉冲);
console.log('对内节律 空tick:', report.codex.对内节律.emptyTicks.length, '平均/ tick:', report.codex.对内节律.avgPerTick.toFixed(2));
console.log('对外双型 TX/ACT/other:', txCount, actCount, otherExt.length);
console.log('\n--- 寄存器趋势 t1→t200 ---');
for (const [k, v] of Object.entries(regTrends)) {
  console.log(`${k}: ${v.t1?.toFixed(4)} → ${v.t200?.toFixed(4)} (${v.trend}) range [${v.min.toFixed(3)}, ${v.max.toFixed(3)}]`);
}
console.log('\n--- 对外密度 ---');
console.log('首次对外: t' + report.summary.firstExternalTick, report.summary.firstExternalKind);
console.log('总对外率:', (report.summary.externalTickRate * 100).toFixed(1) + '%');
console.log('t2-7:', report.summary.earlyExtT2to7);
console.log('t1-20:', (report.summary.extRateT1to20 * 100).toFixed(1) + '%');
console.log('t21-100:', (report.summary.extRateT21to100 * 100).toFixed(1) + '%');
console.log('t101-200:', (report.summary.extRateT101to200 * 100).toFixed(1) + '%');
console.log('\n报告已写入 docs/run-200-report.json');
