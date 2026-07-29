/** Phase 80 — GAP-10 选择压跨种子可重复性攻坚 */

import { verifyW2ReinforcementBatch } from './phase72-analyze.js';

export function verifyGap10Batch(runsByTreatment, { baselineId = 'w2_gap10_ref3840', target = 4 } = {}) {
  const batch = verifyW2ReinforcementBatch(runsByTreatment, { baselineId, target });
  const best = batch.treatments[batch.bestTreatment];
  const base1 = best?.consensus?.consensus?.['1'] ?? null;

  return {
    ...batch,
    gap10Target: target,
    gap10Closed: batch.bestUnanimousBases >= 4,
    base1Unanimous: base1?.unanimous === true,
    base1Votes: base1 ? { pos: base1.pos, neg: base1.neg } : null,
    verdict:
      batch.bestUnanimousBases >= 4
        ? 'support'
        : batch.bestUnanimousBases >= 3 && base1?.unanimous
          ? 'support'
          : batch.bestUnanimousBases >= 3
            ? 'weak'
            : batch.verdict,
  };
}
