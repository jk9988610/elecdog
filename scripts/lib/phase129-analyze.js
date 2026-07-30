/** Phase 129 — 六环境链 × PAIR-0 */

import { analyzeHexaChain, slimCarryChainMetrics } from './phase117-analyze.js';
import { analyzePairRepro } from './phase124-analyze.js';

export function analyzeChainPair(recorder, beings, world, ctx = {}) {
  const chain = analyzeHexaChain(recorder, beings, world, ctx);
  const pair = analyzePairRepro(recorder, beings, world, ctx);
  const carried = beings.filter((b) => b.alive && b.cohortTag === 'carry');
  const carryOffspring = beings.filter(
    (b) => b.alive && b.pairParentB && carried.some((c) => c.id === b.pairParentB || c.id === b.pairParentA)
  );

  return {
    ...chain,
    ...pair,
    carryAlive: carried.length,
    carryMorphA: carried.filter((b) => b.pairMorph === 'A').length,
    carryMorphB: carried.filter((b) => b.pairMorph === 'B').length,
    carryOffspringAlive: carryOffspring.length,
    chainPairMode: world.envProfile?.cohort === 'pair',
  };
}

export function verifyChainPairBatch(byTreatment) {
  const chainPair = byTreatment.ev129_chain_pair ?? [];
  const chainEco = byTreatment.ev129_chain_eco ?? [];
  const pairOnly = byTreatment.ev129_pair_only ?? [];

  const chainPairOk = chainPair.filter((r) => (r.carryCount ?? 0) > 0);
  const chainEcoOk = chainEco.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = chainPairOk.length >= 3 && chainEcoOk.length >= 3;
  const h2 = chainPairOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 5);
  const h3 = [...chainPairOk, ...chainEcoOk].every((r) => (r.metrics.renCount ?? 0) === 0);
  const h4 = chainPair.filter((r) => (r.metrics.fusInCount ?? 0) >= 1).length >= 3;
  const h5 = chainPair.every((r) => (r.metrics.fissCount ?? 0) === 0);
  const h6 = chainEco.every((r) => (r.metrics.fusInCount ?? 0) === 0);
  const h7 = pairOnly.filter((r) => (r.metrics.fusInCount ?? 0) >= 1).length >= 3;

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainCarryImport: h1,
    h2ChainDepth5: h2,
    h3NoRen: h3,
    h4ChainPairFusIn: h4,
    h5ChainPairNoFiss: h5,
    h6ChainEcoNoFusIn: h6,
    h7PairOnlyFusIn: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}

export { slimCarryChainMetrics };
