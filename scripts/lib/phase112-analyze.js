/** Phase 112 — 四环境留置链分析 */

import { analyzeTripleChain, slimCarryChainMetrics } from './phase109-analyze.js';
import { analyzeCooperationLayer } from './phase51-analyze.js';

export function analyzeQuadChain(recorder, beings, world, ctx) {
  const base = analyzeTripleChain(recorder, beings, world, ctx);
  const coop = analyzeCooperationLayer(recorder, beings, world);
  const carried = beings.filter((b) => b.cohortTag === 'carry');
  const chainEnvs = carried[0]?.carryProvenance?.chain?.map((c) => c.envId).filter(Boolean) ?? [];

  return {
    ...base,
    coopTransitionCount: coop.coopTransitionCount,
    coopModes: coop.coopModes,
    meanCrossRx: coop.meanCrossRx,
    chainEnvPath: chainEnvs,
    carryAccrueEnabled: world.envProfile?.carryAccrueEnabled === true,
  };
}

export function verifyQuadChainBatch(byTreatment) {
  const quadRuns = byTreatment.ev112_quad_chain ?? [];
  const ctrlRuns = byTreatment.ev112_triple_ctrl ?? [];

  const quadOk = quadRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const ctrlOk = ctrlRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const allOk = [...quadOk, ...ctrlOk];

  const h1 = quadOk.length >= 2 && ctrlOk.length >= 2;
  const h2 = allOk.every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = quadOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 2);
  const h4 = quadOk.some((r) => (r.metrics.carryWithTrace ?? 0) > 0);
  const h5 = quadOk.some((r) => (r.metrics.coopTransitionCount ?? 0) >= 1);
  const h6 =
    quadOk.length &&
    ctrlOk.length &&
    quadOk.some((r) => (r.metrics.maxChainDepth ?? 0) > (ctrlOk[0]?.metrics?.maxChainDepth ?? 0));

  const meanCoop = (runs) =>
    runs.length
      ? runs.reduce((s, r) => s + (r.metrics.coopTransitionCount ?? 0), 0) / runs.length
      : 0;
  const quadCoop = meanCoop(quadOk);
  const ctrlCoop = meanCoop(ctrlOk);
  const h7 = quadOk.length && ctrlCoop >= 0 && quadCoop > ctrlCoop;

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainImport: h1,
    h2NoRen: h2,
    h3ChainDepth2: h3,
    h4CarryTrace: h4,
    h5CoopInAccrue: h5,
    h6QuadDeeperChain: h6,
    h7QuadMoreCoop: h7,
    quadMeanCoop: +quadCoop.toFixed(2),
    ctrlMeanCoop: +ctrlCoop.toFixed(2),
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
