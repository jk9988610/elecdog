/** Phase 118 — GAP-13 六环境+链 × 多批次合作因果定律 */

import { analyzeCoopCausalChain, slimCarryChainMetrics } from './phase110-analyze.js';
import { analyzeHexaChain } from './phase117-analyze.js';

export function analyzeCoopCausalLaw(recorder, beings, world, ctx) {
  const hexa = analyzeHexaChain(recorder, beings, world, ctx);
  const coop = analyzeCoopCausalChain(recorder, beings, world, ctx);
  return {
    ...hexa,
    ...coop,
    mixedTicksRequested: ctx?.ticksRequested ?? ctx?.ticks,
    mixedTicksCompleted: ctx?.ticks,
    deadlineHit: ctx?.deadlineHit === true,
  };
}

function seedConsistency(runs, pick, { minPositive = 3, sameSign = false } = {}) {
  const vals = runs.map(pick).filter((v) => v != null);
  if (!vals.length) return { count: 0, total: runs.length, rate: 0 };
  if (sameSign) {
    const signs = vals.map((v) => Math.sign(v)).filter((s) => s !== 0);
    const dominant = signs.length ? signs.reduce((a, b) => a + b, 0) : 0;
    const consistent = signs.filter((s) => s === Math.sign(dominant)).length;
    return { count: consistent, total: runs.length, rate: +(consistent / runs.length).toFixed(2) };
  }
  const positive = vals.filter((v) => v > 0).length;
  return {
    count: positive,
    total: runs.length,
    rate: +(positive / runs.length).toFixed(2),
    pass: positive >= minPositive,
  };
}

export function verifyCoopCausalLawBatch(byTreatment) {
  const onRuns = byTreatment.ev118_coop_hexa ?? [];
  const offRuns = byTreatment.ev118_coop_off ?? [];

  const onOk = onRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const offOk = offRuns.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = onOk.length >= 3 && offOk.length >= 3;
  const h2 = [...onOk, ...offOk].every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = onOk.every((r) => (r.metrics.coopTransitionCount ?? 0) >= 10);

  const advLaw = seedConsistency(onOk, (r) => r.metrics.carryCoopAdvantage ?? 0, { minPositive: 3 });
  const h4 = advLaw.pass === true;

  const corrLaw = seedConsistency(onOk, (r) => r.metrics.crossRxCoopCorr ?? 0, { sameSign: true });
  const h5 = corrLaw.count >= 3;

  const meanOn = onOk.length
    ? onOk.reduce((s, r) => s + (r.metrics.carryCoopAdvantage ?? 0), 0) / onOk.length
    : 0;
  const meanOff = offOk.length
    ? offOk.reduce((s, r) => s + (r.metrics.carryCoopAdvantage ?? 0), 0) / offOk.length
    : 0;
  const h6 = meanOn > meanOff && meanOn > 0;

  const h7 = onOk.every((r) => !r.deadlineHit);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1MultiBatchImport: h1,
    h2NoRen: h2,
    h3CoopRobust: h3,
    h4CarryAdvLaw: h4,
    h5CorrSignLaw: h5,
    h6OnBeatsOff: h6,
    h7NoDeadline: h7,
    carryAdvPositiveSeeds: advLaw.count,
    carryAdvLawRate: advLaw.rate,
    corrSignConsistentSeeds: corrLaw.count,
    meanCarryAdvOn: +meanOn.toFixed(4),
    meanCarryAdvOff: +meanOff.toFixed(4),
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
