/** Phase 36 — 存活分裂 [FISS] vs 谱系 [LINEAGE] */

export function analyzeFission(entries, beings) {
  const fiss = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FISS');
  const lineage = entries.filter((e) => e.channel === 'system' && e.content?.includes('[LINEAGE]'));
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');

  const alive = beings.filter((b) => b.alive);
  const fissChildren = beings.filter((b) => b.fissionParent);
  const fissParents = beings.filter((b) => (b.fissionCount ?? 0) > 0);

  const dnaBiases = fiss.map((e) => e.meta?.dnaBias).filter((v) => v != null);
  const meanDnaBias = dnaBiases.length
    ? +(dnaBiases.reduce((a, b) => a + b, 0) / dnaBiases.length).toFixed(4)
    : null;

  const substrateAvgs = fiss.map((e) => e.meta?.substrateAvg).filter((v) => v != null);
  const meanFissSubstrate = substrateAvgs.length
    ? +(substrateAvgs.reduce((a, b) => a + b, 0) / substrateAvgs.length).toFixed(4)
    : null;

  return {
    fissCount: fiss.length,
    lineageCount: lineage.length,
    endCount: ends.length,
    aliveTotal: alive.length,
    fissChildTotal: fissChildren.length,
    fissParentCount: fissParents.length,
    popGrowth: alive.length - 4,
    fissPerParent: fissParents.length ? +(fiss.length / fissParents.length).toFixed(2) : null,
    meanDnaBias,
    meanFissSubstrate,
    lowCount: entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW').length,
    shkCount: entries.filter((e) => e.meta?.kind === 'SHK').length,
  };
}

export function evaluateFertileField(baseline, profile, metrics) {
  const fissDelta = metrics.fissCount - baseline.fissCount;
  const popDelta = metrics.aliveTotal - baseline.aliveTotal;
  const lineageDelta = metrics.lineageCount - baseline.lineageCount;

  return {
    H1_fissRises: {
      verdict: fissDelta >= 50 ? 'support' : fissDelta >= 10 ? 'weak' : 'unsupport',
      baseline: baseline.fissCount,
      profile: metrics.fissCount,
      delta: fissDelta,
    },
    H2_populationGrows: {
      verdict: popDelta >= 8 ? 'support' : popDelta >= 3 ? 'weak' : 'unsupport',
      baseline: baseline.aliveTotal,
      profile: metrics.aliveTotal,
      delta: popDelta,
    },
    H3_lineageNotRequired: {
      verdict:
        metrics.fissCount > metrics.lineageCount * 0.5 && fissDelta >= 20
          ? 'support'
          : metrics.fissCount > 0
            ? 'weak'
            : 'unsupport',
      fiss: metrics.fissCount,
      lineage: metrics.lineageCount,
      delta: lineageDelta,
    },
  };
}
