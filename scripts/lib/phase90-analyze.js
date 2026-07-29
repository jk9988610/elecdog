/** Phase 90 — GAP-ENV air 标量 + 日相耦合 田野分析 */

export function analyzeAirField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const airLogs = entries.filter((e) => e.meta?.kind === 'AIR');
  const dlcLogs = entries.filter((e) => e.meta?.kind === 'DLC');
  const alive = beings.filter((b) => b.alive);

  const air = world.air ?? {};
  const samples = air.samples ?? 0;
  const meanAir = samples ? (air.scalarSum ?? 0) / samples : air.scalar ?? 0;
  const meanEffSolar = samples ? (air.effectiveSolarSum ?? 0) / samples : 0;
  const meanInjectAtten = samples ? (air.injectAttenSum ?? 0) / samples : 1;

  const injectSum = world.diurnalStats?.injectSum ?? 0;
  const solarSum = world.diurnalStats?.solarSum ?? 0;
  const synthAIn = beings.reduce((s, b) => s + (b.synthAInTotal ?? 0), 0);
  const nightTicks = world.diurnalStats?.nightTicks ?? 0;
  const nightLow = world.diurnalStats?.nightLow ?? 0;
  const dayLow = world.diurnalStats?.dayLow ?? 0;

  return {
    ticks: ticks ?? null,
    airEnabled: world.envProfile?.airEnabled === true,
    meanAir: +meanAir.toFixed(4),
    meanEffectiveSolar: +meanEffSolar.toFixed(4),
    meanInjectAtten: +meanInjectAtten.toFixed(4),
    injectSum: +injectSum.toFixed(4),
    solarSum: +solarSum.toFixed(4),
    synthAIn: +synthAIn.toFixed(4),
    airLogCount: airLogs.length,
    dlcLogCount: dlcLogs.length,
    nightTicks,
    nightLow,
    dayLow,
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareAirOnOff(offMetrics, onMetrics) {
  const injectDelta = offMetrics.injectSum - onMetrics.injectSum;
  const effSolarDelta = offMetrics.meanEffectiveSolar - onMetrics.meanEffectiveSolar;
  const synthDelta = offMetrics.synthAIn - onMetrics.synthAIn;
  const airObserved = onMetrics.airEnabled && onMetrics.meanAir > 0;

  let verdict = 'pending';
  if (airObserved && injectDelta > 0.5 && effSolarDelta > 0.02) verdict = 'support';
  else if (airObserved && (injectDelta > 0.1 || effSolarDelta > 0.005)) verdict = 'weak';
  else if (!airObserved) verdict = 'no_air';
  else verdict = 'unsupport';

  return {
    injectDelta: +injectDelta.toFixed(4),
    effSolarDelta: +effSolarDelta.toFixed(4),
    synthDelta: +synthDelta.toFixed(4),
    meanAir: onMetrics.meanAir,
    verdict,
  };
}

export function compareAirThinVsRef(refMetrics, thinMetrics) {
  const drainProxy = thinMetrics.nightLow + thinMetrics.dayLow - (refMetrics.nightLow + refMetrics.dayLow);
  const aliveDelta = thinMetrics.aliveCount - refMetrics.aliveCount;

  let verdict = 'pending';
  if (drainProxy > 0 || thinMetrics.meanInjectAtten < refMetrics.meanInjectAtten) verdict = 'weak';
  else verdict = 'unsupport';

  return { drainProxy, aliveDelta, meanAirThin: thinMetrics.meanAir, verdict };
}

export function verifyPhase90Batch(runsByTreatment) {
  const seeds = runsByTreatment.air_off_ref?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.air_off_ref[i]?.metrics;
    const on = runsByTreatment.air_on_ref[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareAirOnOff(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
  }

  const thinComparisons = [];
  for (let i = 0; i < seeds; i++) {
    const ref = runsByTreatment.air_on_ref[i]?.metrics;
    const thin = runsByTreatment.air_on_thin[i]?.metrics;
    if (!ref || !thin) continue;
    thinComparisons.push({ seed: i, ...compareAirThinVsRef(ref, thin) });
  }

  const airObserved = comparisons.some((c) => c.meanAir > 0);
  let verdict = 'unsupport';
  if (supportCount >= 3 && airObserved) verdict = 'support';
  else if ((supportCount >= 2 || comparisons.some((c) => c.verdict === 'weak')) && airObserved)
    verdict = 'weak';
  else if (!airObserved) verdict = 'no_air_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    comparisons,
    thinComparisons,
    airObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'air_diurnal_support' : 'air_scalar_layer',
  };
}
