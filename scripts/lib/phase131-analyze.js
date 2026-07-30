/** Phase 131 — WL-R1 繁殖邻域 SEM 域标记 */

import { semDomainCountsFromRecorder } from '../../src/world/sem-domain.js';
import { analyzeChainPairFull, verifyChainPairFullBatch, slimCarryChainMetrics } from './phase130-analyze.js';

export function analyzeWlrSemDomain(recorder, beings, world, ctx = {}) {
  const base = analyzeChainPairFull(recorder, beings, world, ctx);
  const semDomain = semDomainCountsFromRecorder(recorder);
  const semTotal = Object.values(semDomain).reduce((a, b) => a + b, 0);
  const semTagged = semTotal - semDomain.untagged;
  const semCoreR = semDomain['CORE-R'] ?? 0;

  return {
    ...base,
    semDomain,
    semTotal,
    semTagged,
    semCoreR,
    semCoreRRatio: semTotal ? +(semCoreR / semTotal).toFixed(4) : 0,
    semDomainTagEnabled: world.envProfile?.semDomainTag === true,
  };
}

export function verifyWlrSemDomainBatch(byTreatment) {
  const fullRuns = byTreatment.ev131_wlr_chain_full ?? [];
  const pair0Runs = byTreatment.ev131_wlr_chain_pair0 ?? [];
  const plainRuns = byTreatment.ev131_wlr_sem_plain ?? [];

  const fullOk = fullRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const chainBase = verifyChainPairFullBatch({
    ev130_chain_pair_full: fullRuns,
    ev130_chain_pair0: pair0Runs,
    ev130_pair_full_only: [],
  });

  const mean = (runs, pick) => {
    const vals = runs.map(pick).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const h1 = fullOk.length >= 3;
  const h2 = fullOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 5);
  const h3 = fullRuns.filter((r) => (r.metrics.prqCount ?? 0) >= 1).length >= 3;
  const h4 = mean(fullRuns, (r) => r.metrics.semCoreRRatio) > mean(pair0Runs, (r) => r.metrics.semCoreRRatio);
  const h5 = mean(fullRuns, (r) => r.metrics.semCoreRRatio) > mean(plainRuns, (r) => r.metrics.semCoreRRatio);
  const h6 = fullRuns.filter((r) => (r.metrics.semCoreR ?? 0) >= 1).length >= 3;
  const h7 = plainRuns.every((r) => (r.metrics.semTagged ?? 0) === 0);

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    ...chainBase,
    h1ChainCarry: h1,
    h2ChainDepth: h2,
    h3FullPrq: h3,
    h4FullCoreRvsPair0: h4,
    h5FullCoreRvsPlain: h5,
    h6FullCoreRSem: h6,
    h7PlainUntagged: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}

export { slimCarryChainMetrics };

export function slimWlrSemDomainMetrics(metrics) {
  const base = slimCarryChainMetrics(metrics);
  return {
    ...base,
    semDomain: metrics.semDomain,
    semTotal: metrics.semTotal,
    semTagged: metrics.semTagged,
    semCoreR: metrics.semCoreR,
    semCoreRRatio: metrics.semCoreRRatio,
  };
}
