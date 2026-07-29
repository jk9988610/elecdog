/** Phase 84 — GAP-ORG 储备池 [RSV] 田野分析 */

export function analyzeReservoirField(recorder, beings, _world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const rsv = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'RSV');
  const rsvIn = rsv.filter((e) => e.meta?.phase === 'in');
  const rsvOut = rsv.filter((e) => e.meta?.phase === 'out');
  const low = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW');
  const lineage = entries.filter((e) => e.channel === 'system' && e.content?.includes('[LINEAGE]'));

  const beingById = Object.fromEntries(beings.map((b) => [b.id, b]));
  const lineageEnds = ends.filter((e) => {
    const b = beingById[e.beingId];
    return (e.meta?.generation ?? b?.generation ?? 0) >= 1;
  });

  const alive = beings.filter((b) => b.alive);
  const reservoirSum = alive.reduce(
    (s, b) => s + (b.reservoir?.reduce((a, c) => a + c, 0) ?? 0),
    0
  );
  const rsvInTotal = beings.reduce((s, b) => s + (b.rsvInTotal ?? 0), 0);
  const rsvOutTotal = beings.reduce((s, b) => s + (b.rsvOutTotal ?? 0), 0);

  return {
    ticks: ticks ?? null,
    endCount: ends.length,
    lineageEndCount: lineageEnds.length,
    lineageSpawnCount: lineage.length,
    aliveCount: alive.length,
    lowCount: low.length,
    rsvInCount: rsvIn.length,
    rsvOutCount: rsvOut.length,
    rsvInTotal: +rsvInTotal.toFixed(4),
    rsvOutTotal: +rsvOutTotal.toFixed(4),
    meanReservoirSum: alive.length ? +(reservoirSum / alive.length).toFixed(4) : 0,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareReservoirShock(offMetrics, onMetrics) {
  const endDelta = offMetrics.endCount - onMetrics.endCount;
  const lowDelta = offMetrics.lowCount - onMetrics.lowCount;
  const aliveDelta = onMetrics.aliveCount - offMetrics.aliveCount;
  const rsvActive = onMetrics.rsvOutTotal > 0 || onMetrics.meanReservoirSum > 0.5;

  let verdict = 'pending';
  if (rsvActive && (endDelta >= 1 || aliveDelta >= 2)) verdict = 'support';
  else if (rsvActive && (endDelta >= 0 || lowDelta >= 3 || aliveDelta >= 1)) verdict = 'weak';
  else if (!rsvActive) verdict = 'no_rsv_observed';
  else verdict = 'unsupport';

  return {
    offEnd: offMetrics.endCount,
    onEnd: onMetrics.endCount,
    endDelta,
    offLow: offMetrics.lowCount,
    onLow: onMetrics.lowCount,
    lowDelta,
    offAlive: offMetrics.aliveCount,
    onAlive: onMetrics.aliveCount,
    aliveDelta,
    rsvOut: onMetrics.rsvOutTotal,
    rsvIn: onMetrics.rsvInTotal,
    meanReservoir: onMetrics.meanReservoirSum,
    verdict,
  };
}

export function verifyPhase84Batch(runsByTreatment) {
  const seeds = runsByTreatment.rsv_off_shk?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;
  let weakCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.rsv_off_shk[i]?.metrics;
    const on = runsByTreatment.rsv_on_shk[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareReservoirShock(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
    if (cmp.verdict === 'weak') weakCount++;
  }

  const offMeanEnd =
    comparisons.length > 0
      ? +(comparisons.reduce((s, c) => s + c.offEnd, 0) / comparisons.length).toFixed(2)
      : null;
  const onMeanEnd =
    comparisons.length > 0
      ? +(comparisons.reduce((s, c) => s + c.onEnd, 0) / comparisons.length).toFixed(2)
      : null;

  const rsvObserved = comparisons.some((c) => c.rsvOut > 0 || c.meanReservoir > 0.5);
  const refOff = runsByTreatment.rsv_off_ref?.map((r) => r.metrics) ?? [];
  const refOn = runsByTreatment.rsv_on_ref?.map((r) => r.metrics) ?? [];
  const refEndDelta =
    refOff.length && refOn.length
      ? +(
          refOff.reduce((s, m) => s + m.endCount, 0) / refOff.length -
          refOn.reduce((s, m) => s + m.endCount, 0) / refOn.length
        ).toFixed(2)
      : null;

  let verdict = 'unsupport';
  if (supportCount >= 3 && rsvObserved) verdict = 'support';
  else if ((supportCount >= 2 || weakCount >= 2) && rsvObserved) verdict = 'weak';
  else if (rsvObserved && comparisons.every((c) => c.verdict !== 'unsupport')) verdict = 'weak';
  else if (!rsvObserved) verdict = 'no_rsv_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    weakCount,
    offShkMeanEnd: offMeanEnd,
    onShkMeanEnd: onMeanEnd,
    meanEndDelta: offMeanEnd != null && onMeanEnd != null ? +(offMeanEnd - onMeanEnd).toFixed(2) : null,
    refEndDelta,
    rsvObserved,
    comparisons,
    verdict,
    gapOrgStatus: verdict === 'support' ? 'rsv_field_support' : 'rsv_record_layer',
  };
}
