/** Phase 132 — WL-R2 链×PAIR 混编跨代繁殖载荷迹 */

import { reproTraceWeight } from '../../src/world/sem-lineage.js';
import { analyzeWlrSemDomain, slimWlrSemDomainMetrics } from './phase131-analyze.js';
import { evoCount } from './event-stats.js';

function meanPool(beings, filter, pick) {
  const pool = beings.filter(filter);
  if (!pool.length) return null;
  return +(pool.reduce((s, b) => s + pick(b), 0) / pool.length).toFixed(4);
}

function semLinPairExpCount(recorder) {
  let n = 0;
  for (const e of recorder.entries ?? []) {
    if (e.channel !== 'evolution' || e.meta?.kind !== 'SEM-LIN') continue;
    if (e.meta?.via === 'PAIR-EXP' && e.meta?.reproTrace === true) n += 1;
  }
  return n;
}

function offspringFromCarry(beings) {
  const carried = beings.filter((b) => b.cohortTag === 'carry');
  const carryIds = new Set(carried.map((b) => b.id));
  return beings.filter(
    (b) =>
      b.alive &&
      b.semTraceVia === 'PAIR-EXP' &&
      (carryIds.has(b.pairParentB) || carryIds.has(b.pairParentA))
  );
}

export function analyzeWlrReproLineage(recorder, beings, world, ctx = {}) {
  const base = analyzeWlrSemDomain(recorder, beings, world, ctx);
  const carryOffspring = offspringFromCarry(beings);
  const pairExpOffspring = beings.filter((b) => b.alive && b.semTraceVia === 'PAIR-EXP');
  const reproLinLogs = semLinPairExpCount(recorder);

  return {
    ...base,
    semLinCount: evoCount(recorder, 'SEM-LIN'),
    semLinPairExp: reproLinLogs,
    semReproLineageEnabled: world.envProfile?.semReproLineage === true,
    carryOffspringCount: carryOffspring.length,
    pairExpOffspringCount: pairExpOffspring.length,
    meanReproTraceCarryOffspring: meanPool(beings, (b) => carryOffspring.includes(b), (b) => b.reproTraceWeight ?? reproTraceWeight(b.semTrace)),
    meanReproTracePairExp: meanPool(beings, (b) => b.semTraceVia === 'PAIR-EXP', (b) => b.reproTraceWeight ?? reproTraceWeight(b.semTrace)),
    meanReproTraceNaive: meanPool(beings, (b) => b.cohortTag === 'naive' && b.semTraceVia === 'PAIR-EXP', (b) => b.reproTraceWeight ?? reproTraceWeight(b.semTrace)),
    meanTraceWeightCarry: meanPool(beings, (b) => b.cohortTag === 'carry', (b) => b.semTraceWeight ?? 0),
    carryWithReproTrace: carryOffspring.filter((b) => (b.reproTraceWeight ?? 0) > 0).length,
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
  const h4 = mean(fullRuns, (r) => r.metrics.meanReproTraceCarryOffspring) > mean(linOffRuns, (r) => r.metrics.meanReproTraceCarryOffspring);
  const h5 = mean(fullRuns, (r) => r.metrics.meanReproTraceCarryOffspring) > mean(fullRuns, (r) => r.metrics.meanReproTraceNaive ?? 0);
  const h6 = fullRuns.filter((r) => (r.metrics.carryWithReproTrace ?? 0) >= 1).length >= 3;
  const h7 = noLinRuns.every((r) => (r.metrics.semLinPairExp ?? 0) === 0 && (r.metrics.semLinCount ?? 0) === 0);

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
    carryOffspringCount: metrics.carryOffspringCount,
    meanReproTraceCarryOffspring: metrics.meanReproTraceCarryOffspring,
    meanReproTracePairExp: metrics.meanReproTracePairExp,
    meanReproTraceNaive: metrics.meanReproTraceNaive,
    carryWithReproTrace: metrics.carryWithReproTrace,
  };
}
