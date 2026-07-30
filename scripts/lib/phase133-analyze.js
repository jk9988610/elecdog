/** Phase 133 — WL-R3 四域×繁殖核 2×2 田野 */

import { fourDomainCoupleCountsFromBeings } from '../../src/world/sem-domain.js';
import { analyzeWlrReproLineage, slimWlrReproLineageMetrics } from './phase132-analyze.js';

export function analyzeWlrFourDomainFactorial(recorder, beings, world, ctx = {}) {
  const base = analyzeWlrReproLineage(recorder, beings, world, ctx);
  const couple = fourDomainCoupleCountsFromBeings(beings);
  const fourTotal = couple.YI + couple.SHI + couple.ZHU + couple.XING;
  const semCoreR = base.semCoreR ?? 0;

  return {
    ...base,
    semFourDomainCouple: couple,
    fourDomainCoupleTotal: fourTotal,
    semCoreRFourCouplePairs: couple.couplePairs,
    fourCouplePerCoreR: semCoreR ? +(couple.couplePairs / semCoreR).toFixed(4) : 0,
    semFourDomainCoupleEnabled: world.envProfile?.semFourDomainCouple === true,
  };
}

export function verifyWlrFourDomainBatch(byTreatment) {
  const onOn = byTreatment.ev133_r3_on_on ?? [];
  const onOff = byTreatment.ev133_r3_on_off ?? [];
  const offOff = byTreatment.ev133_r3_off_off ?? [];
  const offOn = byTreatment.ev133_r3_off_on ?? [];

  const onOnOk = onOn.filter((r) => (r.carryCount ?? 0) > 0);
  const mean = (runs, pick) => {
    const vals = runs.map(pick).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const domainOn = [...onOn, ...onOff];
  const domainOff = [...offOff, ...offOn];

  const h1 = onOnOk.length >= 3;
  const h2 = mean(domainOn, (r) => r.metrics.semCoreR) > mean(domainOff, (r) => r.metrics.semCoreR);
  const h3 = mean(onOn, (r) => r.metrics.semCoreRFourCouplePairs) > mean(onOff, (r) => r.metrics.semCoreRFourCouplePairs);
  const h4 = offOn.every((r) => (r.metrics.semCoreRFourCouplePairs ?? 0) === 0);
  const h5 = mean(onOn, (r) => r.metrics.fourDomainCoupleTotal) > mean(onOff, (r) => r.metrics.fourDomainCoupleTotal);
  const h6 = onOn.filter((r) => (r.metrics.semLinPairExp ?? 0) >= 1).length >= 3;
  const h7 = mean(onOn, (r) => r.metrics.semCoreR) >= mean(onOff, (r) => r.metrics.semCoreR) * 0.85;

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainCarry: h1,
    h2DomainMainEffect: h2,
    h3CoupleMainEffect: h3,
    h4OffOnNoCouple: h4,
    h5FourDomainLift: h5,
    h6ReproLinIntact: h6,
    h7DomainOrthogonal: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}

export function slimWlrFourDomainMetrics(metrics) {
  const base = slimWlrReproLineageMetrics(metrics);
  return {
    ...base,
    semFourDomainCouple: metrics.semFourDomainCouple,
    fourDomainCoupleTotal: metrics.fourDomainCoupleTotal,
    semCoreRFourCouplePairs: metrics.semCoreRFourCouplePairs,
    fourCouplePerCoreR: metrics.fourCouplePerCoreR,
  };
}
