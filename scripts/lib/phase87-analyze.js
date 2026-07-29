/** Phase 87 — GAP-ENV [SCL] 季相田野分析 */

export function analyzeSeasonalField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const lows = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW');
  const sclLogs = entries.filter((e) => e.meta?.kind === 'SCL');

  const ss = world.seasonalStats ?? {};
  const phaseTicks = ss.phaseTicks ?? [0, 0, 0, 0];
  const phaseLow = ss.phaseLow ?? [0, 0, 0, 0];
  const alive = beings.filter((b) => b.alive);

  const phaseLowRates = phaseTicks.map((t, i) =>
    t > 0 ? +(phaseLow[i] / t).toFixed(6) : null
  );
  const phasesSeen = phaseTicks.filter((t) => t > 0).length;

  const coldRate = phaseLowRates[2];
  const warmRate = phaseLowRates[0];
  const coldWarmDelta =
    coldRate != null && warmRate != null ? +(coldRate - warmRate).toFixed(6) : null;

  return {
    ticks: ticks ?? null,
    birthPlace: world.birthPlace,
    seasonalEnabled: world.envProfile?.seasonalEnabled === true,
    seasonalPeriod: world.envProfile?.seasonalPeriod ?? null,
    endCount: ends.length,
    aliveCount: alive.length,
    lowCount: lows.length,
    transitions: ss.transitions ?? 0,
    phasesSeen,
    phaseTicks,
    phaseLow,
    phaseLowRates,
    coldWarmDelta,
    currentPhase: world.seasonal?.phase ?? null,
    floorMult: world.seasonal?.mods?.floorMult ?? null,
    sclLogCount: sclLogs.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareSeasonalOnOff(offMetrics, onMetrics) {
  const sclActive = onMetrics.phasesSeen >= 3 && onMetrics.transitions >= 2;
  const phaseSpread = onMetrics.phasesSeen - (offMetrics.phasesSeen ?? 0);

  let verdict = 'pending';
  if (sclActive && phaseSpread >= 2) verdict = 'support';
  else if (sclActive) verdict = 'weak';
  else if (!sclActive) verdict = 'no_scl';
  else verdict = 'unsupport';

  return {
    offPhases: offMetrics.phasesSeen,
    onPhases: onMetrics.phasesSeen,
    onTransitions: onMetrics.transitions,
    phaseSpread,
    verdict,
  };
}

export function compareColdWarm(metrics) {
  const delta = metrics.coldWarmDelta;
  let verdict = 'pending';
  if (delta != null && delta > 0) verdict = 'support';
  else if (metrics.phaseTicks?.[2] > 100) verdict = 'weak';
  else verdict = 'unsupport';

  return {
    warmRate: metrics.phaseLowRates?.[0],
    coldRate: metrics.phaseLowRates?.[2],
    coldWarmDelta: delta,
    coldTicks: metrics.phaseTicks?.[2],
    verdict,
  };
}

export function verifyPhase87Batch(runsByTreatment) {
  const seeds = runsByTreatment.scl_off_ref?.length ?? 0;
  const sclComparisons = [];
  let sclSupport = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.scl_off_ref[i]?.metrics;
    const on = runsByTreatment.scl_on_ref[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareSeasonalOnOff(off, on);
    sclComparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') sclSupport++;
  }

  const coldComparisons = [];
  let coldSupport = 0;
  for (let i = 0; i < seeds; i++) {
    const on = runsByTreatment.scl_on_ref[i]?.metrics;
    if (!on) continue;
    const cmp = compareColdWarm(on);
    coldComparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') coldSupport++;
  }

  const sclObserved = sclComparisons.some((c) => c.verdict !== 'no_scl');
  let verdict = 'unsupport';
  if (sclSupport >= 3 && sclObserved) verdict = 'support';
  else if ((sclSupport >= 2 || sclComparisons.some((c) => c.verdict === 'weak')) && sclObserved)
    verdict = 'weak';
  else if (!sclObserved) verdict = 'no_scl_observed';

  return {
    seedsCompared: sclComparisons.length,
    sclSupport,
    coldSupport,
    sclComparisons,
    coldComparisons,
    sclObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'scl_season_support' : 'scl_record_layer',
  };
}
