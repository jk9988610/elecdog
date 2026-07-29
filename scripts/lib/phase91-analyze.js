/** Phase 91 — GAP-ENV [ADV] + [LTC] 田野分析 */

export function analyzeAdvLtcField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const advLogs = entries.filter((e) => e.meta?.kind === 'ADV');
  const ltcLogs = entries.filter((e) => e.meta?.kind === 'LTC');
  const alive = beings.filter((b) => b.alive);

  const adv = world.adv ?? {};
  const lunar = world.lunarStats ?? {};
  const samples = lunar.samples ?? 0;
  const meanRegenMult = samples ? (lunar.regenMultSum ?? 0) / samples : 1;
  const nodeLevelSum = (world.nodes ?? []).reduce((s, n) => s + n.level, 0);

  return {
    ticks: ticks ?? null,
    advEnabled: world.envProfile?.advEnabled === true,
    ltcEnabled: world.envProfile?.ltcEnabled === true,
    advEvents: adv.events ?? 0,
    advFluxTotal: +(adv.fluxTotal ?? 0).toFixed(4),
    advTransferCount: adv.transferCount ?? 0,
    advBioticSpread: +(adv.bioticSpread ?? 0).toFixed(4),
    advLogCount: advLogs.length,
    ltcTransitions: lunar.transitions ?? 0,
    ltcInjectSum: +(lunar.injectSum ?? 0).toFixed(4),
    meanRegenMult: +meanRegenMult.toFixed(4),
    ltcLogCount: ltcLogs.length,
    nodeLevelSum: +nodeLevelSum.toFixed(4),
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareAdvLtcOnOff(offMetrics, onMetrics) {
  const advDelta = onMetrics.advEvents - offMetrics.advEvents;
  const fluxDelta = onMetrics.advFluxTotal - offMetrics.advFluxTotal;
  const ltcDelta = onMetrics.ltcTransitions - offMetrics.ltcTransitions;
  const regenDelta = onMetrics.meanRegenMult - offMetrics.meanRegenMult;
  const injectDelta = onMetrics.ltcInjectSum - offMetrics.ltcInjectSum;

  let verdict = 'pending';
  const advObs = advDelta >= 1 && fluxDelta > 0.01;
  const ltcObs = ltcDelta >= 1 || injectDelta > 0.01 || Math.abs(regenDelta) > 0.001;
  if (advObs && ltcObs) verdict = 'support';
  else if (advObs || ltcObs) verdict = 'weak';
  else if (!onMetrics.advEnabled && !onMetrics.ltcEnabled) verdict = 'no_mechanism';
  else verdict = 'unsupport';

  return { advDelta, fluxDelta, ltcDelta, regenDelta, injectDelta, verdict };
}

export function verifyPhase91Batch(runsByTreatment) {
  const seeds = runsByTreatment.adv_ltc_off?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.adv_ltc_off[i]?.metrics;
    const on = runsByTreatment.adv_ltc_on[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareAdvLtcOnOff(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
  }

  const advOnly = [];
  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.adv_ltc_off[i]?.metrics;
    const adv = runsByTreatment.adv_on_only[i]?.metrics;
    if (!off || !adv) continue;
    advOnly.push({
      seed: i,
      advDelta: adv.advEvents - off.advEvents,
      fluxDelta: adv.advFluxTotal - off.advFluxTotal,
    });
  }

  const mechanismObserved = comparisons.some((c) => c.verdict !== 'no_mechanism' && c.verdict !== 'unsupport');
  let verdict = 'unsupport';
  if (supportCount >= 3 && mechanismObserved) verdict = 'support';
  else if ((supportCount >= 2 || comparisons.some((c) => c.verdict === 'weak')) && mechanismObserved)
    verdict = 'weak';
  else if (!mechanismObserved) verdict = 'no_mechanism_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    comparisons,
    advOnly,
    mechanismObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'adv_ltc_support' : 'adv_ltc_layer',
  };
}
