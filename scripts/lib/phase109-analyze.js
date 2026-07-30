/** Phase 109 — 三环境留置链 + 第三环境混合对照 */

import { analyzeCarryChainSem, slimCarryChainMetrics } from './phase108-analyze.js';

export function analyzeTripleChain(recorder, beings, world, ctx) {
  const base = analyzeCarryChainSem(recorder, beings, world, ctx);
  const carried = beings.filter((b) => b.cohortTag === 'carry');
  const chainDepths = carried.map((b) => b.carryProvenance?.chain?.length ?? 0);

  return {
    ...base,
    mixedEnvId: world.envProfile?.mixedEnvId ?? world.envProfile?.envId ?? null,
    meanChainDepth: chainDepths.length
      ? +(chainDepths.reduce((a, b) => a + b, 0) / chainDepths.length).toFixed(2)
      : 0,
    maxChainDepth: chainDepths.length ? Math.max(...chainDepths) : 0,
    rplBlocked: beings.some((b) => b.rplBlocked === true),
  };
}

export function verifyTripleChainBatch(byTreatment) {
  const fertileRuns = byTreatment.ev109_triple_fertile ?? [];
  const ctrlRuns = byTreatment.ev109_triple_ctrl ?? [];

  const fertileOk = fertileRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const ctrlOk = ctrlRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const allOk = [...fertileOk, ...ctrlOk];

  const h1 = fertileOk.length >= 2 && ctrlOk.length >= 2;
  const h2 = allOk.every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = allOk.some(
    (r) =>
      (r.metrics.carryWithTrace ?? 0) > 0 ||
      (r.metrics.meanTraceWeightCarry ?? 0) > 0 ||
      (r.metrics.pairKinds ?? 0) > 0
  );
  const h4 = allOk.some((r) => (r.metrics.carryWithTrace ?? 0) > 0);
  const h5 = allOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 1);

  const meanFiss = (runs) =>
    runs.length
      ? runs.reduce((s, r) => s + (r.metrics.fissCount ?? 0), 0) / runs.length
      : 0;
  const fertileFiss = meanFiss(fertileOk);
  const ctrlFiss = meanFiss(ctrlOk);
  const h6 = fertileOk.length && ctrlOk.length && fertileFiss !== ctrlFiss;

  const support = [h1, h2, h3, h4, h5, h6].filter(Boolean).length;
  return {
    h1ChainImport: h1,
    h2NoRen: h2,
    h3SemObservable: h3,
    h4CarryTrace: h4,
    h5ChainDepth: h5,
    h6EnvContrast: h6,
    fertileMeanFiss: +fertileFiss.toFixed(2),
    ctrlMeanFiss: +ctrlFiss.toFixed(2),
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
