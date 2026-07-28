/** 生物圈反馈 [BIO] 统计 */

export function analyzeBiotic(entries, ticks) {
  const bio = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'BIO');
  const byChannel = {};
  let netDelta = 0;

  for (const b of bio) {
    const idx = b.meta.idx;
    byChannel[idx] = (byChannel[idx] || 0) + 1;
    netDelta += b.meta.delta ?? 0;
  }

  const pops = bio.map((b) => b.meta.pop).filter((p) => p != null);
  const pulseTicks = [...new Set(bio.map((b) => b.tick))].sort((a, b) => a - b);

  const shk = entries.filter((e) => e.meta?.kind === 'SHK');
  const bioAfterShk = [];
  for (const s of shk) {
    const within = bio.filter((b) => b.tick >= s.tick && b.tick <= s.tick + 20);
    bioAfterShk.push({ shkTick: s.tick, bioCount: within.length });
  }

  return {
    bioCount: bio.length,
    pulseTicks: pulseTicks.length,
    avgPopAtBio: pops.length ? pops.reduce((a, b) => a + b, 0) / pops.length : 0,
    netSubstrateDelta: +netDelta.toFixed(4),
    channelHits: byChannel,
    bioAfterShkAvg: bioAfterShk.length
      ? bioAfterShk.reduce((s, x) => s + x.bioCount, 0) / bioAfterShk.length
      : 0,
  };
}
