/** 田野运行分析 — 只输出可观测统计，不作解释 */

import { stepWorld } from '../../src/kernel/engine.js';

export function runTicks(world, recorder, ticks) {
  for (let i = 0; i < ticks; i++) {
    stepWorld(world, recorder);
  }
}

export function analyzeRun({ entries, beingId, ticks }) {
  const internals = entries.filter((e) => e.channel === 'internal' && e.beingId === beingId && e.tick > 0);
  const externals = entries.filter((e) => e.channel === 'external' && e.beingId === beingId);
  const states = entries.filter((e) => e.channel === 'state' && e.beingId === beingId);

  const ticksWithExternal = new Set(externals.map((e) => e.tick));
  const emptyInternalTicks = [];
  for (let t = 1; t <= ticks; t++) {
    const has = entries.some(
      (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
    );
    if (!has) emptyInternalTicks.push(t);
  }

  const pulse = entries.find(
    (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === 0
  );
  const pulseParts = pulse?.content?.split(' ') ?? [];
  const firstExt = externals[0];

  const txCount = externals.filter((e) => e.content.startsWith('[TX]')).length;
  const actCount = externals.filter((e) => e.content.startsWith('[ACT]')).length;
  const otherExt = externals.filter(
    (e) => !e.content.startsWith('[TX]') && !e.content.startsWith('[ACT]')
  );

  const stateByTick = {};
  for (const s of states) {
    stateByTick[s.tick] = s.meta.registers;
  }

  function regSeries(idx) {
    const series = [];
    for (let t = 1; t <= ticks; t++) {
      if (stateByTick[t]) series.push({ t, v: stateByTick[t][idx] });
    }
    return series;
  }

  function trend(series) {
    if (series.length < 2) return 'insufficient';
    const delta = series[series.length - 1].v - series[0].v;
    if (Math.abs(delta) < 0.05) return 'stable';
    return delta > 0 ? 'rising' : 'falling';
  }

  const regTrends = {};
  for (let i = 0; i < 8; i++) {
    const s = regSeries(i);
    regTrends[`r${i}`] = {
      t1: s[0]?.v,
      tEnd: s[s.length - 1]?.v,
      trend: trend(s),
      min: Math.min(...s.map((x) => x.v)),
      max: Math.max(...s.map((x) => x.v)),
    };
  }

  function extRate(from, to) {
    let n = 0;
    for (let t = from; t <= to; t++) if (ticksWithExternal.has(t)) n++;
    return n / (to - from + 1);
  }

  let earlyExt = 0;
  for (let t = 2; t <= 7; t++) {
    if (ticksWithExternal.has(t)) earlyExt++;
  }

  return {
    pulse: pulse?.content,
    pulseMatch: pulseParts[1] === '0x00' && pulseParts[2] === '0x01',
    emptyInternalTicks,
    avgInternal: internals.length / ticks,
    txCount,
    actCount,
    otherExt: otherExt.length,
    regTrends,
    firstExternalTick: firstExt?.tick,
    firstExternalKind: firstExt?.content?.split(' ')[0],
    externalTickRate: ticksWithExternal.size / ticks,
    earlyExtT2to7: `${earlyExt}/6`,
    extRateT1to20: extRate(1, Math.min(20, ticks)),
    extRateT21to100: ticks >= 21 ? extRate(21, Math.min(100, ticks)) : null,
    extRateT101toEnd: ticks >= 101 ? extRate(101, ticks) : null,
  };
}
