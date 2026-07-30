/** Phase 132 — WL-R2 链×PAIR 混编跨代繁殖载荷迹 */

import { reproTraceWeight } from '../../src/world/sem-lineage.js';
import { analyzeWlrSemDomain, slimWlrSemDomainMetrics } from './phase131-analyze.js';
import { evoCount, evoWithMeta } from './event-stats.js';

function meanPool(beings, filter, pick) {
  const pool = beings.filter(filter);
  if (!pool.length) return null;
  return +(pool.reduce((s, b) => s + pick(b), 0) / pool.length).toFixed(4);
}

function semLinPairExpCount(recorder) {
  return evoWithMeta(recorder, 'SEM-LIN', (m) => m.via === 'PAIR-EXP' && m.reproTrace === true);
}

function semLinCoreRWeight(recorder) {
  let sum = 0;
  for (const e of recorder.entries ?? []) {
    if (e.channel !== 'evolution' || e.meta?.kind !== 'SEM-LIN') continue;
    if (e.meta?.via === 'PAIR-EXP' && e.meta?.reproTrace === true) {
      sum += e.meta?.coreRWeight ?? 0;
    }
  }
  return +sum.toFixed(4);
}

function offspringFromCarry(beings) {
  const carryIds = new Set(beings.filter((b) => b.cohortTag === 'carry').map((b) => b.id));
  return beings.filter(
    (b) => b.alive && (carryIds.has(b.pairParentB) || carryIds.has(b.pairParentA))
  );
}

export function analyzeWlrReproLineage(recorder, beings, world, ctx = {}) {
  const base = analyzeWlrSemDomain(recorder, beings, world, ctx);
  const carryOffspring = offspringFromCarry(beings);
  const pairExpOffspring = beings.filter((b) => b.alive && b.semTraceVia === 'PAIR-EXP');
  const reproLinLogs = semLinPairExpCount(recorder);
  const reproLinCoreRSum = semLinCoreRWeight(recorder);
  const reproPick = (b) => b.reproTraceWeight ?? reproTraceWeight(b.semTrace);

  return {
    ...base,
    semLinCount: evoCount(recorder, 'SEM-LIN'),
    semLinPairExp: reproLinLogs,
    semLinCoreRSum: reproLinCoreRSum,
    semReproLineageEnabled: world.envProfile?.semReproLineage === true,
    carryOffspringCount: carryOffspring.length,
    pairExpOffspringCount: pairExpOffspring.length,
    meanReproTraceCarryOffspring: carryOffspring.length
      ? +(carryOffspring.reduce((s, b) => s + reproPick(b), 0) / carryOffspring.length).toFixed(4)
      : null,
    meanReproTracePairExp: pairExpOffspring.length
      ? +(pairExpOffspring.reduce((s, b) => s + reproPick(b), 0) / pairExpOffspring.length).toFixed(4)
      : null,
    meanReproTraceNaive: meanPool(
      beings,
      (b) => b.cohortTag === 'naive' && b.semTraceVia === 'PAIR-EXP',
      reproPick
    ),
    meanTraceWeightCarry: meanPool(beings, (b) => b.cohortTag === 'carry', (b) => b.semTraceWeight ?? 0),
    carryWithReproTrace: carryOffspring.filter((b) => reproPick(b) > 0).length,
    pairExpWithReproTrace: pairExpOffspring.filter((b) => reproPick(b) > 0).length,
  };
}

export function verifyWlrReproLineageBatch(byTreatment) {
  const fullRuns = byTreatment.ev132_wlr_lin_full ?? [];
  const linOffRuns = byTreatment.ev132_wlr_lin_off ?? [];
  const noLinRuns = byTreatment.ev132_wlr_no_lin ?? [];

  const fullOk = fullRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const mean = (runs, pick) => {
    const vals = runs.map(pick).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const h1 = fullOk.length >= 3;
  const h2 = fullOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 5);
  const h3 = fullRuns.filter((r) => (r.metrics.semLinPairExp ?? 0) >= 1).length >= 3;
  const h4 =
    mean(fullRuns, (r) => r.metrics.semLinPairExp) > mean(linOffRuns, (r) => r.metrics.semLinPairExp) ||
    mean(fullRuns, (r) => r.metrics.meanReproTraceCarryOffspring) >
      mean(linOffRuns, (r) => r.metrics.meanReproTraceCarryOffspring);
  const h5 =
    mean(fullRuns, (r) => r.metrics.meanReproTracePairExp) > 0 ||
    mean(fullRuns, (r) => r.metrics.semLinCoreRSum) > mean(linOffRuns, (r) => r.metrics.semLinCoreRSum);
  const h6 = fullRuns.filter((r) => (r.metrics.pairExpWithReproTrace ?? 0) >= 1).length >= 3;
  const h7 = noLinRuns.every(
    (r) => (r.metrics.semLinPairExp ?? 0) === 0 && (r.metrics.semLinCount ?? 0) === 0
  );

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainCarry: h1,
    h2ChainDepth: h2,
    h3PairExpReproLin: h3,
    h4FullReproVsLinOff: h4,
    h5CarryAboveNaive: h5,
    h6CarryWithReproTrace: h6,
    h7NoLinZero: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}

export function slimWlrReproLineageMetrics(metrics) {
  const base = slimWlrSemDomainMetrics(metrics);
  return {
    ...base,
    semLinCount: metrics.semLinCount,
    semLinPairExp: metrics.semLinPairExp,
    semLinCoreRSum: metrics.semLinCoreRSum,
    carryOffspringCount: metrics.carryOffspringCount,
    meanReproTraceCarryOffspring: metrics.meanReproTraceCarryOffspring,
    meanReproTracePairExp: metrics.meanReproTracePairExp,
    meanReproTraceNaive: metrics.meanReproTraceNaive,
    carryWithReproTrace: metrics.carryWithReproTrace,
    pairExpWithReproTrace: metrics.pairExpWithReproTrace,
  };
}
