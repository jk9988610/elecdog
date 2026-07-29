/** Phase 82 — 智慧物种田野验收 */

import { analyzeWisdomOpenField } from './phase77-analyze.js';

export { analyzeWisdomOpenField };

export function evaluateAcceptancePerRun(metrics) {
  const memLoad = metrics.meanMemLoad ?? 0;
  const prd = metrics.prdCount ?? 0;
  const soc = metrics.socEncCount ?? 0;
  const lin = metrics.memLinCount ?? 0;
  const alive = metrics.aliveTotal ?? 0;
  const modes = metrics.modeDiversity ?? 0;

  return {
    W1_memoryLoop: {
      verdict: memLoad >= 0.1 ? 'support' : memLoad >= 0.05 ? 'weak' : 'unsupport',
      meanMemLoad: memLoad,
    },
    W3_prediction: {
      verdict: prd >= 50 ? 'support' : prd >= 20 ? 'weak' : 'unsupport',
      prdCount: prd,
    },
    W4_social: {
      verdict: soc >= 30 && lin >= 8 ? 'support' : soc >= 15 ? 'weak' : 'unsupport',
      socEncCount: soc,
      memLinCount: lin,
    },
    W5_openScale: {
      verdict: alive >= 4 && modes >= 2 ? 'support' : alive >= 2 ? 'weak' : 'unsupport',
      aliveTotal: alive,
      modeDiversity: modes,
    },
  };
}

export function verifyWisdomAcceptanceBatch(runsByTreatment) {
  const perSeed = [];
  for (const [tid, runs] of Object.entries(runsByTreatment)) {
    for (const run of runs) {
      const eval_ = evaluateAcceptancePerRun(run.metrics);
      perSeed.push({ treatmentId: tid, seed: run.seed, ...eval_ });
    }
  }

  const goals = ['W1_memoryLoop', 'W3_prediction', 'W4_social', 'W5_openScale'];
  const supportByGoal = Object.fromEntries(
    goals.map((g) => [g, perSeed.filter((p) => p[g].verdict === 'support').length])
  );

  const seedsCompared = perSeed.length;
  const allSupport = goals.every((g) => supportByGoal[g] >= seedsCompared * 0.75);
  const mostSupport = goals.filter((g) => supportByGoal[g] >= seedsCompared * 0.5).length;

  return {
    seedsCompared,
    supportByGoal,
    perSeed,
    verdict: allSupport ? 'support' : mostSupport >= 3 ? 'weak' : 'unsupport',
    acceptanceReady: allSupport,
  };
}
