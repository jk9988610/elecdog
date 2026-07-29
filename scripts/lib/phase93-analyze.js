/** Phase 93 — GAP-ENV [VTN] 地热 vent 田野分析 */

export function analyzeVentField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const vtnLogs = entries.filter((e) => e.meta?.kind === 'VTN');
  const alive = beings.filter((b) => b.alive);

  const vent = world.vent ?? {};
  const ch = world.substrate?.channels ?? [];
  const substrateMean = ch.length ? ch.reduce((a, b) => a + b, 0) / ch.length : 0;

  return {
    ticks: ticks ?? null,
    ventEnabled: world.envProfile?.ventEnabled === true,
    ventPatch: world.envProfile?.ventPatch ?? null,
    placePatch: world.place?.patch ?? null,
    injectTotal: +(vent.injectTotal ?? 0).toFixed(4),
    activeTicks: vent.activeTicks ?? 0,
    vtnLogCount: vtnLogs.length,
    boostMult: world.ventMods?.boostMult ?? 1,
    floorAdd: world.ventMods?.floorAdd ?? 0,
    substrateMean: +substrateMean.toFixed(4),
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareVentOnOff(offMetrics, onMetrics) {
  const injectDelta = onMetrics.injectTotal - offMetrics.injectTotal;
  const activeDelta = onMetrics.activeTicks - offMetrics.activeTicks;
  const substrateDelta = onMetrics.substrateMean - offMetrics.substrateMean;
  const endDelta = offMetrics.endCount - onMetrics.endCount;

  let verdict = 'pending';
  if (injectDelta > 1 && activeDelta > 100) verdict = 'support';
  else if (injectDelta > 0.1 || activeDelta > 50) verdict = 'weak';
  else if (!onMetrics.ventEnabled) verdict = 'no_vent';
  else verdict = 'unsupport';

  return { injectDelta, activeDelta, substrateDelta, endDelta, verdict };
}

export function verifyPhase93Batch(runsByTreatment) {
  const seeds = runsByTreatment.vent_off_ref?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.vent_off_ref[i]?.metrics;
    const on = runsByTreatment.vent_on_ref[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareVentOnOff(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
  }

  const mismatchComparisons = [];
  for (let i = 0; i < seeds; i++) {
    const on = runsByTreatment.vent_on_ref[i]?.metrics;
    const mis = runsByTreatment.vent_on_mismatch[i]?.metrics;
    if (!on || !mis) continue;
    mismatchComparisons.push({
      seed: i,
      injectDelta: on.injectTotal - mis.injectTotal,
      activeDelta: on.activeTicks - mis.activeTicks,
    });
  }

  const ventObserved = comparisons.some((c) => c.injectDelta > 0);
  let verdict = 'unsupport';
  if (supportCount >= 3 && ventObserved) verdict = 'support';
  else if ((supportCount >= 2 || comparisons.some((c) => c.verdict === 'weak')) && ventObserved)
    verdict = 'weak';
  else if (!ventObserved) verdict = 'no_vent_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    comparisons,
    mismatchComparisons,
    ventObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'vent_polar_support' : 'vent_record_layer',
  };
}
