/** Phase 115 — 五环境留置链分析 */

import { analyzeQuadChain, slimCarryChainMetrics } from './phase112-analyze.js';

function uniqueChainEnvs(carried) {
  const envs = new Set();
  for (const b of carried) {
    for (const c of b.carryProvenance?.chain ?? []) {
      if (c.envId) envs.add(c.envId);
    }
  }
  return [...envs];
}

export function analyzePentaChain(recorder, beings, world, ctx) {
  const base = analyzeQuadChain(recorder, beings, world, ctx);
  const carried = beings.filter((b) => b.cohortTag === 'carry');
  const chainStages = carried[0]?.carryProvenance?.chain?.map((c) => c.stage).filter(Boolean) ?? [];

  return {
    ...base,
    chainStageCount: chainStages.length,
    chainStages,
    uniqueChainEnvs: uniqueChainEnvs(carried),
    pentaEnabled: (world.envProfile?.carryChainPasses?.length ?? 0) >= 3,
  };
}

export function verifyPentaChainBatch(byTreatment) {
  const pentaRuns = byTreatment.ev115_penta_chain ?? [];
  const quadRuns = byTreatment.ev115_quad_ctrl ?? [];

  const pentaOk = pentaRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const quadOk = quadRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const allOk = [...pentaOk, ...quadOk];

  const h1 = pentaOk.length >= 2 && quadOk.length >= 2;
  const h2 = allOk.every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = pentaOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 3);
  const h4 = pentaOk.some((r) => (r.metrics.chainStageCount ?? 0) >= 3);
  const h5 = pentaOk.some((r) => (r.metrics.uniqueChainEnvs?.length ?? 0) >= 2);
  const h6 =
    pentaOk.length &&
    quadOk.length &&
    pentaOk.some((r) => (r.metrics.maxChainDepth ?? 0) > (quadOk[0]?.metrics?.maxChainDepth ?? 0));
  const h7 = allOk.every((r) => !r.deadlineHit);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainImport: h1,
    h2NoRen: h2,
    h3ChainDepth3: h3,
    h4ThreeStages: h4,
    h5MultiEnv: h5,
    h6PentaDeeper: h6,
    h7NoDeadline: h7,
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
