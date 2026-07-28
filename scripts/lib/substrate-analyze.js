/** 数字基底场分析 */

export function analyzeSubstrate(entries, ticks) {
  const subs = entries.filter((e) => e.channel === 'substrate' && !e.meta?.afterAct);
  const ambs = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'AMB');
  const ptbs = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'PTB');
  const ress = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'RES');
  const acts = entries.filter(
    (e) => e.channel === 'external' && e.content.startsWith('[ACT]')
  );

  const t1 = subs.find((s) => s.tick === 1)?.meta?.channels;
  const tEnd = subs.find((s) => s.tick === ticks)?.meta?.channels;

  let drift = null;
  if (t1 && tEnd) {
    drift = tEnd.map((v, i) => +(v - t1[i]).toFixed(4));
  }

  return {
    substrateLogsPerTick: subs.length / ticks,
    ambCount: ambs.length,
    ambPerTick: ambs.length / ticks,
    ptbCount: ptbs.length,
    resCount: ress.length,
    actCount: acts.length,
    ptbActPairing: acts.length ? ptbs.length / acts.length : null,
    resActPairing: acts.length ? ress.length / acts.length : null,
    e0drift: drift?.[0],
    maxDrift: drift ? Math.max(...drift.map(Math.abs)) : null,
  };
}

export function analyzeCoupling(entries, beingId, ticks) {
  const states = entries.filter((e) => e.channel === 'state' && e.beingId === beingId);
  const subs = entries.filter((e) => e.channel === 'substrate' && !e.meta?.afterAct);
  let sumAbsDiff = 0;
  let n = 0;
  for (const st of states) {
    const sub = subs.find((s) => s.tick === st.tick);
    if (!sub) continue;
    const regs = st.meta.registers;
    const ch = sub.meta.channels;
    for (let i = 0; i < 8; i++) {
      sumAbsDiff += Math.abs(ch[i] - regs[i]);
    }
    n++;
  }
  return {
    avgChannelGap: n ? sumAbsDiff / (n * 8) : null,
    samples: n,
  };
}
