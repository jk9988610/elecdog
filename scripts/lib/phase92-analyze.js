/** Phase 92 — GAP-ART [ART] 持久场态 田野分析 */

export function analyzeArtField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const artDeposits = entries.filter((e) => e.meta?.kind === 'ART' && e.meta?.phase === 'deposit');
  const artLogs = entries.filter((e) => e.meta?.kind === 'ART');
  const drw = entries.filter((e) => e.meta?.kind === 'DRW');
  const alive = beings.filter((b) => b.alive);

  const art = world.art ?? {};
  const depositTotal = art.depositTotal ?? beings.reduce((s, b) => s + (b.artDepositCount ?? 0), 0);
  const drawBonus = world.artMods?.drawBonus ?? 0;
  const floorInject = art.floorInjectSum ?? 0;
  const activeEnd = art.state?.length ?? 0;

  const drwTotal = drw.reduce((s, e) => s + (e.meta?.amount ?? 0), 0);
  const actCount = beings.reduce((s, b) => s + (b.fieldActCount ?? b.artActStreak ?? 0), 0);

  return {
    ticks: ticks ?? null,
    artEnabled: world.envProfile?.artEnabled === true,
    depositTotal,
    artDepositLog: artDeposits.length,
    artLogCount: artLogs.length,
    activeArtifacts: activeEnd,
    floorInjectSum: +floorInject.toFixed(4),
    drawBonus: +drawBonus.toFixed(4),
    drwTotal: +drwTotal.toFixed(4),
    actCount,
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareArtOnOff(offMetrics, onMetrics) {
  const depositDelta = onMetrics.depositTotal - offMetrics.depositTotal;
  const injectDelta = onMetrics.floorInjectSum - offMetrics.floorInjectSum;
  const drawBonusDelta = onMetrics.drawBonus - offMetrics.drawBonus;
  const drwDelta = onMetrics.drwTotal - offMetrics.drwTotal;
  const endDelta = offMetrics.endCount - onMetrics.endCount;

  let verdict = 'pending';
  if (depositDelta >= 1 && injectDelta > 0.01) verdict = 'support';
  else if (depositDelta >= 1 || drawBonusDelta > 0.02) verdict = 'weak';
  else if (!onMetrics.artEnabled) verdict = 'no_art';
  else verdict = 'unsupport';

  return { depositDelta, injectDelta, drawBonusDelta, drwDelta, endDelta, verdict };
}

export function verifyPhase92Batch(runsByTreatment) {
  const seeds = runsByTreatment.art_off_ref?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.art_off_ref[i]?.metrics;
    const on = runsByTreatment.art_on_ref[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareArtOnOff(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
  }

  const artObserved = comparisons.some((c) => c.depositDelta > 0);
  let verdict = 'unsupport';
  if (supportCount >= 3 && artObserved) verdict = 'support';
  else if ((supportCount >= 2 || comparisons.some((c) => c.verdict === 'weak')) && artObserved)
    verdict = 'weak';
  else if (!artObserved) verdict = 'no_art_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    comparisons,
    artObserved,
    verdict,
    gapArtStatus: verdict === 'support' ? 'art_field_support' : 'art_record_layer',
  };
}
