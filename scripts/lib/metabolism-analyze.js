/** 基底代谢分析 */

export function analyzeMetabolism(entries, beingId, ticks) {
  const drws = entries.filter(
    (e) => e.channel === 'metabolism' && e.beingId === beingId && e.meta?.kind === 'DRW'
  );
  const lows = entries.filter(
    (e) => e.channel === 'metabolism' && e.beingId === beingId && e.meta?.kind === 'LOW'
  );
  const internals = entries.filter(
    (e) => e.channel === 'internal' && e.beingId === beingId && e.tick > 0
  );
  const externals = entries.filter(
    (e) => e.channel === 'external' && e.beingId === beingId
  );

  const avgDraw = drws.length
    ? drws.reduce((s, d) => s + d.meta.amount, 0) / drws.length
    : null;

  const lowChannels = [...new Set(lows.map((l) => l.meta.idx))];

  return {
    drawCount: drws.length,
    drawPerTick: drws.length / ticks,
    lowCount: lows.length,
    lowChannels,
    avgDrawAmount: avgDraw,
    ticksWithLow: new Set(lows.map((l) => l.tick)).size,
    internalTicks: internals.length,
    externalTicks: externals.length,
  };
}

export function analyzeSubstrateDepletion(entries, ticks) {
  const subs = entries.filter((e) => e.channel === 'substrate' && !e.meta?.afterAct);
  const t1 = subs.find((s) => s.tick === 1)?.meta?.channels;
  const tEnd = subs.find((s) => s.tick === ticks)?.meta?.channels;
  const minPerChannel = Array(8).fill(1);
  for (const s of subs) {
    s.meta.channels.forEach((v, i) => {
      minPerChannel[i] = Math.min(minPerChannel[i], v);
    });
  }
  return {
    e0start: t1?.[0],
    e0end: tEnd?.[0],
    minChannels: minPerChannel.map((v) => +v.toFixed(4)),
    lowestChannel: minPerChannel.indexOf(Math.min(...minPerChannel)),
    lowestValue: Math.min(...minPerChannel),
  };
}
