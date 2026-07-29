/** Phase 95 — GAP-11+ [DSP] 耗散定律 田野分析 */

import { dspYieldRatio } from '../../src/world/dissip.js';

export function analyzeDspField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const dspLogs = entries.filter((e) => e.meta?.kind === 'DSP');
  const drwLogs = entries.filter((e) => e.meta?.kind === 'DRW');
  const alive = beings.filter((b) => b.alive);

  const dsp = world.dsp ?? {};
  const toRegTotal = dsp.toRegTotal ?? beings.reduce((s, b) => s + (b.dspToRegTotal ?? 0), 0);
  const lostTotal = dsp.lostTotal ?? beings.reduce((s, b) => s + (b.dspLostTotal ?? 0), 0);
  const yieldRatio = dspYieldRatio(world) || (toRegTotal + lostTotal > 0 ? toRegTotal / (toRegTotal + lostTotal) : 0);

  return {
    ticks: ticks ?? null,
    dissipationEnabled: world.envProfile?.dissipationEnabled === true,
    dspYieldFrac: world.envProfile?.dspYieldFrac ?? 0.3,
    toRegTotal: +toRegTotal.toFixed(4),
    lostTotal: +lostTotal.toFixed(4),
    yieldRatio: +yieldRatio.toFixed(4),
    drawCount: dsp.drawCount ?? drwLogs.length,
    dspLogCount: dspLogs.length,
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareDspYield(lowMetrics, highMetrics) {
  const toRegDelta = highMetrics.toRegTotal - lowMetrics.toRegTotal;
  const lostDelta = lowMetrics.lostTotal - highMetrics.lostTotal;
  const yieldDelta = highMetrics.yieldRatio - lowMetrics.yieldRatio;

  let verdict = 'pending';
  if (yieldDelta >= 0.08 && toRegDelta > 0.5) verdict = 'support';
  else if (yieldDelta >= 0.04 || toRegDelta > 0.1) verdict = 'weak';
  else verdict = 'unsupport';

  return { toRegDelta, lostDelta, yieldDelta, verdict };
}

export function compareDspOnOff(offMetrics, onMetrics) {
  const lostDelta = onMetrics.lostTotal - offMetrics.lostTotal;
  const accounting = onMetrics.dissipationEnabled && onMetrics.lostTotal > 0;

  let verdict = 'pending';
  if (accounting && lostDelta > 0.1) verdict = 'support';
  else if (accounting) verdict = 'weak';
  else verdict = 'no_dsp';

  return { lostDelta, toRegDelta: onMetrics.toRegTotal - offMetrics.toRegTotal, verdict };
}

export function verifyPhase95Batch(runsByTreatment) {
  const seeds = runsByTreatment.dsp_off_ref?.length ?? 0;
  const yieldComparisons = [];
  let yieldSupport = 0;

  for (let i = 0; i < seeds; i++) {
    const low = runsByTreatment.dsp_on_low[i]?.metrics;
    const high = runsByTreatment.dsp_on_high[i]?.metrics;
    if (!low || !high) continue;
    const cmp = compareDspYield(low, high);
    yieldComparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') yieldSupport++;
  }

  const onOffComparisons = [];
  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.dsp_off_ref[i]?.metrics;
    const on = runsByTreatment.dsp_on_ref[i]?.metrics;
    if (!off || !on) continue;
    onOffComparisons.push({ seed: i, ...compareDspOnOff(off, on) });
  }

  const dspObserved = yieldComparisons.some((c) => c.yieldDelta > 0.04);
  let verdict = 'unsupport';
  if (yieldSupport >= 3 && dspObserved) verdict = 'support';
  else if ((yieldSupport >= 2 || yieldComparisons.some((c) => c.verdict === 'weak')) && dspObserved)
    verdict = 'weak';
  else if (!dspObserved) verdict = 'no_dsp_observed';

  return {
    seedsCompared: yieldComparisons.length,
    yieldSupport,
    yieldComparisons,
    onOffComparisons,
    dspObserved,
    verdict,
    gap11Status: verdict === 'support' ? 'dsp_law_support' : 'dsp_record_layer',
  };
}
