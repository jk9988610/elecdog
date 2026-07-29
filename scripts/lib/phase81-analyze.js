/** Phase 81 — GAP-10 W2-only 栈 + 代次深度攻坚 */

import { verifyGap10Batch } from './phase80-analyze.js';

export function verifyGap10DepthBatch(runsByTreatment, opts = {}) {
  const batch = verifyGap10Batch(runsByTreatment, {
    baselineId: opts.baselineId ?? 'w2_p81_replay_ref',
    target: opts.target ?? 4,
  });

  const depthByTreatment = {};
  for (const [tid, runs] of Object.entries(runsByTreatment)) {
    const maxGens = runs.map((r) => r.metrics?.viability?.maxGeneration ?? r.metrics?.dna?.maxGeneration ?? 0);
    depthByTreatment[tid] = {
      meanMaxGen: +(maxGens.reduce((a, b) => a + b, 0) / maxGens.length).toFixed(2),
      minMaxGen: Math.min(...maxGens),
      maxMaxGen: Math.max(...maxGens),
    };
  }

  const bestDepth = depthByTreatment[batch.bestTreatment] ?? { meanMaxGen: 0 };

  return {
    ...batch,
    depthByTreatment,
    meanMaxGenBest: bestDepth.meanMaxGen,
    depthTargetMet: bestDepth.meanMaxGen >= 4,
  };
}
