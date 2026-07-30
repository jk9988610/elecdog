/** Phase 116 — 加长塑形 tick + 截止守卫稳健性 */

import { analyzePentaChain, slimCarryChainMetrics } from './phase115-analyze.js';

export function analyzeSculptRobustness(recorder, beings, world, ctx) {
  const base = analyzePentaChain(recorder, beings, world, ctx);
  return {
    ...base,
    sculptTicksRequested: ctx?.sculptTicks,
    sculptTicksCompleted: ctx?.sculptTicksCompleted,
    deadlineHit: ctx?.deadlineHit === true,
    tickCapHit: ctx?.tickCapHit === true,
  };
}

export function verifySculptRobustBatch(byTreatment) {
  const longRuns = byTreatment.ev116_sculpt_long ?? [];
  const stdRuns = byTreatment.ev116_sculpt_std ?? [];

  const longOk = longRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const stdOk = stdRuns.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = stdOk.length >= 2 && stdOk.every((r) => !r.deadlineHit);
  const h2 = longOk.length >= 2 && longOk.every((r) => !r.deadlineHit);
  const h3 = longOk.every((r) => (r.sculptTicksCompleted ?? 0) >= (r.sculptTicks ?? 0) * 0.95);
  const h4 = stdOk.every((r) => (r.carryCount ?? 0) >= 1) && longOk.every((r) => (r.carryCount ?? 0) >= 1);

  const meanGenCarry = (runs) => {
    const vals = runs.map((r) => r.metrics.meanGenCarry ?? 0).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const longGen = meanGenCarry(longOk);
  const stdGen = meanGenCarry(stdOk);
  const h5 = longGen > stdGen;

  const h6 = [...stdOk, ...longOk].every((r) => (r.metrics.renCount ?? 0) === 0);
  const h7 = longOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 3);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1StdNoDeadline: h1,
    h2LongNoDeadline: h2,
    h3LongSculptComplete: h3,
    h4CarryImported: h4,
    h5LongHigherGen: h5,
    h6NoRen: h6,
    h7PentaChainDepth: h7,
    longMeanGenCarry: +longGen.toFixed(4),
    stdMeanGenCarry: +stdGen.toFixed(4),
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
