/** Phase 88 — GAP-ORG Synth-A/B + reservoir 田野分析 */

export function analyzeSynthField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const sym = entries.filter((e) => e.meta?.kind === 'SYM');
  const alive = beings.filter((b) => b.alive);

  const synthAIn = beings.reduce((s, b) => s + (b.synthAInTotal ?? 0), 0);
  const synthBOut = beings.reduce((s, b) => s + (b.synthBOutTotal ?? 0), 0);
  const rsvIn = beings.reduce((s, b) => s + (b.rsvInTotal ?? 0), 0);
  const rsvOut = beings.reduce((s, b) => s + (b.rsvOutTotal ?? 0), 0);
  const reservoirSum = alive.reduce(
    (s, b) => s + (b.reservoir?.reduce((a, c) => a + c, 0) ?? 0),
    0
  );

  const symAEntries = sym.filter((e) => e.content?.includes('synth-a'));
  const symBEntries = sym.filter((e) => e.content?.includes('synth-b'));

  const nightTicks = world.diurnalStats?.nightTicks ?? 0;
  const nightLow = world.diurnalStats?.nightLow ?? 0;

  return {
    ticks: ticks ?? null,
    synthEnabled: world.envProfile?.synthEnabled === true,
    endCount: ends.length,
    aliveCount: alive.length,
    synthAIn: +synthAIn.toFixed(4),
    synthBOut: +synthBOut.toFixed(4),
    rsvIn: +rsvIn.toFixed(4),
    rsvOut: +rsvOut.toFixed(4),
    meanReservoirSum: alive.length ? +(reservoirSum / alive.length).toFixed(4) : 0,
    symLogCount: sym.length,
    symAEntries: symAEntries.length,
    symBEntries: symBEntries.length,
    nightTicks,
    nightLow,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareSynthOnOff(offMetrics, onMetrics) {
  const synthActive = onMetrics.synthAIn > 0 || onMetrics.synthBOut > 0;
  const aDelta = onMetrics.synthAIn - offMetrics.synthAIn;
  const bDelta = onMetrics.synthBOut - offMetrics.synthBOut;
  const rsvDelta = onMetrics.meanReservoirSum - offMetrics.meanReservoirSum;

  let verdict = 'pending';
  if (synthActive && aDelta > 0.05) verdict = 'support';
  else if (synthActive && (aDelta > 0 || bDelta > 0)) verdict = 'weak';
  else if (!synthActive) verdict = 'no_synth';
  else verdict = 'unsupport';

  return { aDelta, bDelta, rsvDelta, synthAIn: onMetrics.synthAIn, synthBOut: onMetrics.synthBOut, verdict };
}

export function compareSynthShock(offMetrics, onMetrics) {
  const endDelta = offMetrics.endCount - onMetrics.endCount;
  const aliveDelta = onMetrics.aliveCount - offMetrics.aliveCount;
  const bOut = onMetrics.synthBOut;

  let verdict = 'pending';
  if (bOut > 0 && (endDelta >= 1 || aliveDelta >= 2)) verdict = 'support';
  else if (bOut > 0) verdict = 'weak';
  else verdict = 'unsupport';

  return { offEnd: offMetrics.endCount, onEnd: onMetrics.endCount, endDelta, aliveDelta, synthBOut: bOut, verdict };
}

export function verifyPhase88Batch(runsByTreatment) {
  const seeds = runsByTreatment.synth_off_rsv?.length ?? 0;
  const refComparisons = [];
  let refSupport = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.synth_off_rsv[i]?.metrics;
    const on = runsByTreatment.synth_on_ref[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareSynthOnOff(off, on);
    refComparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') refSupport++;
  }

  const shkComparisons = [];
  let shkSupport = 0;
  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.synth_off_rsv[i]?.metrics;
    const on = runsByTreatment.synth_on_shk[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareSynthShock(off, on);
    shkComparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') shkSupport++;
  }

  const synthObserved = refComparisons.some((c) => c.verdict !== 'no_synth');
  let verdict = 'unsupport';
  if (refSupport >= 3 && synthObserved) verdict = 'support';
  else if ((refSupport >= 2 || refComparisons.some((c) => c.verdict === 'weak')) && synthObserved)
    verdict = 'weak';
  else if (!synthObserved) verdict = 'no_synth_observed';

  return {
    seedsCompared: refComparisons.length,
    refSupport,
    shkSupport,
    refComparisons,
    shkComparisons,
    synthObserved,
    verdict,
    gapOrgStatus: verdict === 'support' ? 'synth_ab_support' : 'synth_record_layer',
  };
}
