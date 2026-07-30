/** Phase 113 — GAP-13 加长混合 tick + 截止守卫稳健性 */

import { analyzeCoopCausalChain, slimCarryChainMetrics } from './phase110-analyze.js';

export function analyzeCoopRobustness(recorder, beings, world, ctx) {
  const base = analyzeCoopCausalChain(recorder, beings, world, ctx);
  return {
    ...base,
    mixedTicksRequested: ctx?.ticksRequested ?? ctx?.ticks,
    mixedTicksCompleted: ctx?.ticks,
    deadlineHit: ctx?.deadlineHit === true,
    tickCapHit: ctx?.tickCapHit === true,
  };
}

export function verifyCoopRobustBatch(byTreatment) {
  const longRuns = byTreatment.ev113_coop_long ?? [];
  const stdRuns = byTreatment.ev113_coop_std ?? [];

  const longOk = longRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const stdOk = stdRuns.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = stdOk.length >= 2 && stdOk.every((r) => !r.deadlineHit);
  const h2 = longOk.length >= 2 && longOk.every((r) => !r.deadlineHit);
  const h3 = longOk.every((r) => (r.metrics.mixedTicksCompleted ?? 0) >= (r.mixedTicks ?? 0) * 0.95);
  const h4 = stdOk.some((r) => r.metrics.crossRxCoopCorr != null) && longOk.some((r) => r.metrics.crossRxCoopCorr != null);

  const meanCorr = (runs) => {
    const vals = runs.map((r) => Math.abs(r.metrics.crossRxCoopCorr ?? 0)).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const longCorr = meanCorr(longOk);
  const stdCorr = meanCorr(stdOk);
  const h5 = longCorr > 0 && stdCorr > 0 && Math.abs(longCorr - stdCorr) <= 0.25;

  const h6 = [...stdOk, ...longOk].every((r) => (r.metrics.renCount ?? 0) === 0);
  const h7 = longOk.some((r) => (r.metrics.coopTransitionCount ?? 0) >= 20);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1StdNoDeadline: h1,
    h2LongNoDeadline: h2,
    h3LongTicksComplete: h3,
    h4CorrMeasurable: h4,
    h5CorrStable: h5,
    h6NoRen: h6,
    h7CoopRobust: h7,
    longMeanCorr: +longCorr.toFixed(4),
    stdMeanCorr: +stdCorr.toFixed(4),
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
