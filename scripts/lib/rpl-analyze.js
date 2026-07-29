/** Phase 37 — 复制配额 [RPL] 与分裂上限 */

export function analyzeReplication(entries, beings) {
  const rpl = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'RPL');
  const fiss = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FISS');
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');

  const alive = beings.filter((b) => b.alive);
  const withRpl = beings.filter((b) => b.rplMax != null);
  const exhausted = withRpl.filter((b) => (b.rplRemaining ?? 0) <= 0);
  const rplEnds = ends.filter((e) => e.meta?.reason?.startsWith('rpl_'));

  const remainings = alive.filter((b) => b.rplRemaining != null).map((b) => b.rplRemaining);
  const meanRplRemaining = remainings.length
    ? +(remainings.reduce((a, b) => a + b, 0) / remainings.length).toFixed(2)
    : null;

  return {
    rplEventCount: rpl.length,
    rplInitCount: rpl.filter((e) => e.meta?.phase === 'init').length,
    rplExhaustedEvents: rpl.filter((e) => e.meta?.phase === 'exhausted').length,
    fissCount: fiss.length,
    aliveTotal: alive.length,
    exhaustedCount: exhausted.length,
    rplEndCount: rplEnds.length,
    rplTickCapEnds: ends.filter((e) => e.meta?.reason === 'rpl_tick_cap').length,
    rplExhaustedEnds: ends.filter((e) => e.meta?.reason === 'rpl_exhausted').length,
    meanRplRemaining,
    beingsWithRpl: withRpl.length,
  };
}

export function compareRplLimited(baseline, limited) {
  const popDelta = limited.aliveTotal - baseline.aliveTotal;
  const fissDelta = limited.fissCount - baseline.fissCount;

  return {
    H1_popBelowCap: {
      verdict:
        limited.aliveTotal < baseline.aliveTotal - 4
          ? 'support'
          : limited.aliveTotal < baseline.aliveTotal
            ? 'weak'
            : 'unsupport',
      open: baseline.aliveTotal,
      limited: limited.aliveTotal,
      delta: popDelta,
    },
    H2_fissSlows: {
      verdict: fissDelta <= -8 ? 'support' : fissDelta <= -3 ? 'weak' : 'unsupport',
      open: baseline.fissCount,
      limited: limited.fissCount,
      delta: fissDelta,
    },
    H3_exhaustionObservable: {
      verdict: limited.exhaustedCount >= 1 || limited.rplExhaustedEvents >= 1 ? 'support' : 'unsupport',
      exhausted: limited.exhaustedCount,
      events: limited.rplExhaustedEvents,
    },
  };
}
