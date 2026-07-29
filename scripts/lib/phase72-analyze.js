/** Phase 72 — W2 选择压强化环境验收 */

import { verifyW2Batch } from './phase71-analyze.js';

export function verifyW2ReinforcementBatch(runsByTreatment, { baselineId = 'w2_p71_ref', target = 2 } = {}) {
  const batch = verifyW2Batch(runsByTreatment);
  const treatments = batch.treatments;

  let bestId = null;
  let bestUnanimous = 0;
  let bestSignConsistent = false;

  for (const [tid, t] of Object.entries(treatments)) {
    if (tid === baselineId) continue;
    const ub = t.consensus?.unanimousBases ?? 0;
    if (ub > bestUnanimous) {
      bestUnanimous = ub;
      bestId = tid;
      bestSignConsistent = t.compare?.signConsistent ?? false;
    }
  }

  const baseline = treatments[baselineId];
  const baselineUnanimous = baseline?.consensus?.unanimousBases ?? 0;
  const improved = bestUnanimous > baselineUnanimous;

  return {
    ...batch,
    baselineId,
    baselineUnanimousBases: baselineUnanimous,
    bestTreatment: bestId,
    bestUnanimousBases: bestUnanimous,
    bestSignConsistent,
    targetUnanimousBases: target,
    w2TargetMet: bestUnanimous >= target,
    improvedVsBaseline: improved,
    gap10Status:
      bestUnanimous >= 4 ? 'closed' : bestUnanimous >= target ? 'partial' : 'open',
    verdict:
      bestUnanimous >= target
        ? 'support'
        : improved && bestUnanimous >= 1
          ? 'weak'
          : 'unsupport',
  };
}
