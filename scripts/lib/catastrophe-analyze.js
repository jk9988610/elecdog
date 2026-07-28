/** 环境剧变脉冲统计 */

export function analyzeCatastrophe(entries, ticks) {
  const shk = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'SHK');
  const npl = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'NPL');
  const depFromPulse = entries.filter(
    (e) => e.channel === 'environment' && e.meta?.kind === 'DEP' && e.meta?.fromPulse
  );

  const expectedPulses = Math.floor((ticks - 100) / 100) + (ticks >= 100 ? 1 : 0);
  const pulseTicks = [...new Set([...shk, ...npl].map((e) => e.tick))].sort((a, b) => a - b);

  const svvAfterPulse = [];
  for (const pt of pulseTicks) {
    const window = entries.filter(
      (e) =>
        e.channel === 'viability' &&
        e.meta?.kind === 'SVV' &&
        e.tick >= pt &&
        e.tick <= pt + 5
    );
    svvAfterPulse.push({ pulseTick: pt, svvCount: window.length });
  }

  return {
    shkCount: shk.length,
    nplCount: npl.length,
    totalPulses: shk.length + npl.length,
    expectedPulses,
    pulseTicks,
    depFromPulse: depFromPulse.length,
    svvAfterPulse,
    avgSvvAfterPulse: svvAfterPulse.length
      ? svvAfterPulse.reduce((s, x) => s + x.svvCount, 0) / svvAfterPulse.length
      : 0,
  };
}
