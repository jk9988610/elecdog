/** Phase 85 — GAP-ENV band + [DLC] 日相田野分析 */

export function analyzeDiurnalField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const lows = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW');
  const dlc = entries.filter((e) => e.meta?.kind === 'DLC');
  const alive = beings.filter((b) => b.alive);

  const ds = world.diurnalStats ?? {};
  const dayTicks = ds.dayTicks ?? 0;
  const nightTicks = ds.nightTicks ?? 0;
  const dayLow = ds.dayLow ?? 0;
  const nightLow = ds.nightLow ?? 0;
  const nightLowRate = nightTicks > 0 ? +(nightLow / nightTicks).toFixed(6) : null;
  const dayLowRate = dayTicks > 0 ? +(dayLow / dayTicks).toFixed(6) : null;

  const band = world.place?.band ?? world.envProfile?.placeBand ?? null;
  const meanSolar =
    ds.samples > 0 ? +((ds.solarSum ?? 0) / ds.samples).toFixed(4) : null;
  const meanInject =
    ds.samples > 0 ? +((ds.injectSum ?? 0) / ds.samples).toFixed(4) : null;

  const e2 = world.substrate?.channels?.[2] ?? null;

  return {
    ticks: ticks ?? null,
    band,
    birthPlace: world.birthPlace,
    diurnalEnabled: world.envProfile?.diurnalEnabled === true,
    endCount: ends.length,
    aliveCount: alive.length,
    lowCount: lows.length,
    dlcLogCount: dlc.length,
    dayTicks,
    nightTicks,
    dayLow,
    nightLow,
    dayLowRate,
    nightLowRate,
    nightLowExcess:
      nightLowRate != null && dayLowRate != null ? +(nightLowRate - dayLowRate).toFixed(6) : null,
    meanSolar,
    meanInject,
    e2Final: e2 != null ? +e2.toFixed(4) : null,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function verifyPhase85Batch(runsByTreatment) {
  const seeds = runsByTreatment.dlc_off_M?.length ?? 0;
  const dlcComparisons = [];
  let dlcSupport = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.dlc_off_M[i]?.metrics;
    const on = runsByTreatment.dlc_on_M[i]?.metrics;
    if (!off || !on) continue;
    const nightDelta = (on.nightLowRate ?? 0) - (off.nightLowRate ?? 0);
    const hasDiurnal = on.meanSolar != null && on.meanInject != null;
    let verdict = 'pending';
    if (hasDiurnal && on.nightTicks > 100 && nightDelta > 0) verdict = 'support';
    else if (hasDiurnal && on.meanInject > 0) verdict = 'weak';
    else if (!hasDiurnal) verdict = 'no_dlc';
    else verdict = 'unsupport';
    if (verdict === 'support') dlcSupport++;
    dlcComparisons.push({ seed: i, offNight: off.nightLowRate, onNight: on.nightLowRate, nightDelta, verdict });
  }

  const bandE = runsByTreatment.dlc_on_E?.map((r) => r.metrics) ?? [];
  const bandP = runsByTreatment.dlc_on_P?.map((r) => r.metrics) ?? [];
  const meanAlive = (arr) =>
    arr.length ? +(arr.reduce((s, m) => s + m.aliveCount, 0) / arr.length).toFixed(2) : null;
  const meanEnd = (arr) =>
    arr.length ? +(arr.reduce((s, m) => s + m.endCount, 0) / arr.length).toFixed(2) : null;
  const aliveE = meanAlive(bandE);
  const aliveP = meanAlive(bandP);
  const endE = meanEnd(bandE);
  const endP = meanEnd(bandP);

  let bandVerdict = 'pending';
  if (aliveE != null && aliveP != null) {
    if (aliveE - aliveP >= 2 || (endP ?? 0) - (endE ?? 0) >= 1) bandVerdict = 'support';
    else if (aliveE > aliveP || (bandE[0]?.e2Final ?? 0) > (bandP[0]?.e2Final ?? 0)) bandVerdict = 'weak';
    else bandVerdict = 'unsupport';
  }

  const dlcObserved = dlcComparisons.some((c) => c.verdict !== 'no_dlc');
  let verdict = 'unsupport';
  if (dlcSupport >= 2 && bandVerdict !== 'unsupport') verdict = 'support';
  else if ((dlcSupport >= 1 || dlcComparisons.some((c) => c.verdict === 'weak')) && dlcObserved)
    verdict = 'weak';
  else if (!dlcObserved) verdict = 'no_dlc_observed';

  return {
    seedsCompared: dlcComparisons.length,
    dlcSupport,
    dlcComparisons,
    bandAliveE: aliveE,
    bandAliveP: aliveP,
    bandEndE: endE,
    bandEndP: endP,
    bandVerdict,
    dlcObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'dlc_band_support' : 'dlc_record_layer',
  };
}
