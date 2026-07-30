/** Phase 117 — 六环境+留置链分析 */

import { analyzePentaChain, slimCarryChainMetrics } from './phase115-analyze.js';
import { analyzeSocialKnowledge } from './phase75-analyze.js';

function uniqueChainEnvs(carried) {
  const envs = new Set();
  for (const b of carried) {
    for (const c of b.carryProvenance?.chain ?? []) {
      if (c.envId) envs.add(c.envId);
    }
  }
  return [...envs];
}

export function analyzeHexaChain(recorder, beings, world, ctx) {
  const base = analyzePentaChain(recorder, beings, world, ctx);
  const soc = analyzeSocialKnowledge(recorder, beings, world, { ticks: ctx?.ticks });
  const carried = beings.filter((b) => b.cohortTag === 'carry');
  const chainStages = carried[0]?.carryProvenance?.chain?.map((c) => c.stage).filter(Boolean) ?? [];

  return {
    ...base,
    chainStageCount: chainStages.length,
    chainStages,
    uniqueChainEnvs: uniqueChainEnvs(carried),
    hexaEnabled: (world.envProfile?.carryChainPasses?.length ?? 0) >= 5,
    hasStressEchoStage: chainStages.includes('stress_echo'),
    hasSocStage: chainStages.includes('soc'),
    socEncCount: soc.socEncCount ?? 0,
    socLinCount: soc.socLinCount ?? 0,
  };
}

export function verifyHexaChainBatch(byTreatment) {
  const hexaRuns = byTreatment.ev117_hexa_chain ?? [];
  const pentaRuns = byTreatment.ev117_penta_ctrl ?? [];

  const hexaOk = hexaRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const pentaOk = pentaRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const allOk = [...hexaOk, ...pentaOk];

  const h1 = hexaOk.length >= 2 && pentaOk.length >= 2;
  const h2 = allOk.every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = hexaOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 5);
  const h4 = hexaOk.some((r) => r.metrics.hasStressEchoStage && r.metrics.hasSocStage);
  const h5 = hexaOk.some((r) => (r.metrics.socEncCount ?? 0) > 0);
  const h6 =
    hexaOk.length &&
    pentaOk.length &&
    hexaOk.some((r) => (r.metrics.maxChainDepth ?? 0) > (pentaOk[0]?.metrics?.maxChainDepth ?? 0));
  const h7 = allOk.every((r) => !r.deadlineHit);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainImport: h1,
    h2NoRen: h2,
    h3ChainDepth5: h3,
    h4StressEchoSocStages: h4,
    h5SocEncObservable: h5,
    h6HexaDeeper: h6,
    h7NoDeadline: h7,
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
