/** Phase 108 — 多环境留置链 + SEM 跨环境载荷迹 */

import { analyzeEvoCarry, slimEvoCarryMetrics } from './phase106-analyze.js';
import { analyzeSem } from './phase100-analyze.js';
import { evoCount } from './event-stats.js';

function meanTag(beings, tag, pick) {
  const pool = beings.filter((b) => b.cohortTag === tag);
  if (!pool.length) return null;
  return +(pool.reduce((s, b) => s + pick(b), 0) / pool.length).toFixed(4);
}

export function analyzeCarryChainSem(recorder, beings, world, ctx) {
  const base = analyzeEvoCarry(recorder, beings, world, ctx);
  const sem = analyzeSem(recorder, beings, world, ctx);
  const carried = beings.filter((b) => b.cohortTag === 'carry');

  return {
    ...base,
    ...sem,
    meanTraceWeightCarry: meanTag(beings, 'carry', (b) => b.semTraceWeight ?? 0),
    meanTraceWeightNaive: meanTag(beings, 'naive', (b) => b.semTraceWeight ?? 0),
    carryWithTrace: carried.filter((b) => (b.semTrace?.length ?? 0) > 0).length,
    carryChainDepth: carried[0]?.carryProvenance?.chain?.length ?? 0,
    semLinCount: evoCount(recorder, 'SEM-LIN'),
    mixedSemEnabled: world.envProfile?.mixedSemEnabled === true,
    carryIncubateSem: world.envProfile?.carryIncubateSem === true,
  };
}

export function verifyCarryChainSemBatch(byTreatment) {
  const semRuns = byTreatment.ev108_chain_sem ?? [];
  const offRuns = byTreatment.ev108_chain_off ?? [];

  const semOk = semRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const h1 = semOk.length >= 2;
  const h2 = semOk.every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = semOk.some(
    (r) =>
      (r.metrics.carryWithTrace ?? 0) > 0 ||
      (r.metrics.meanTraceWeightCarry ?? 0) > 0 ||
      (r.metrics.pairKinds ?? 0) > 0
  );
  const h4 = semOk.some((r) => (r.metrics.carryWithTrace ?? 0) > 0);
  const h5 = semOk.some(
    (r) => (r.metrics.meanTraceWeightCarry ?? 0) > (r.metrics.meanTraceWeightNaive ?? 0)
  );

  const offSem = offRuns.every((r) => (r.metrics.semCount ?? 0) === 0);
  const lift =
    semOk.length && offRuns.length
      ? (semOk.reduce((s, r) => s + (r.metrics.meanTraceWeightCarry ?? 0), 0) / semOk.length) -
        (offRuns.reduce((s, r) => s + (r.metrics.meanTraceWeightCarry ?? 0), 0) / offRuns.length)
      : 0;

  const support = [h1, h2, h3, h4, h5].filter(Boolean).length;
  return {
    h1ChainImport: h1,
    h2NoRen: h2,
    h3SemObservable: h3,
    h4CarryTrace: h4,
    h5CarryTraceAboveNaive: h5,
    offSemZero: offSem,
    traceLift: +lift.toFixed(4),
    verdict: support >= 4 ? 'support' : support >= 3 ? 'weak' : support >= 2 ? 'pending' : 'unsupport',
    support,
  };
}

export function slimCarryChainMetrics(m) {
  if (!m) return m;
  const { _bigrams, ...rest } = m;
  return rest;
}
