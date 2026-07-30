/** Phase 130 — 六环境链 × PAIR-2/3/4 全栈 */

import { analyzeChainPair } from './phase129-analyze.js';
import { evoCount } from './event-stats.js';

function countKinds(recorder, kinds) {
  return kinds.reduce((sum, k) => sum + evoCount(recorder, k), 0);
}

export function analyzeChainPairFull(recorder, beings, world, ctx = {}) {
  return {
    ...analyzeChainPair(recorder, beings, world, ctx),
    prqCount: evoCount(recorder, 'PRQ'),
    pgrCount: evoCount(recorder, 'PGR'),
    fldChCount: countKinds(recorder, ['FLD-CH']),
    fldInChCount: countKinds(recorder, ['FLD-CH-IN']),
    hrmCount: evoCount(recorder, 'HRM'),
    pairFullStack:
      world.envProfile?.pairHandshake === true &&
      world.envProfile?.pairChannelBind === true &&
      world.envProfile?.pairHormoneVector === true,
  };
}

export function verifyChainPairFullBatch(byTreatment) {
  const fullRuns = byTreatment.ev130_chain_pair_full ?? [];
  const pair0Runs = byTreatment.ev130_chain_pair0 ?? [];
  const onlyRuns = byTreatment.ev130_pair_full_only ?? [];

  const fullOk = fullRuns.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = fullOk.length >= 3;
  const h2 = fullOk.some((r) => (r.metrics.maxChainDepth ?? 0) >= 5);
  const h3 = fullRuns.filter((r) => (r.metrics.prqCount ?? 0) >= 1).length >= 3;
  const h4 = fullRuns.filter((r) => (r.metrics.fldChCount ?? 0) >= 1).length >= 3;
  const h5 = fullRuns.filter((r) => (r.metrics.hrmCount ?? 0) >= 1).length >= 3;
  const h6 = pair0Runs.every((r) => (r.metrics.prqCount ?? 0) === 0 && (r.metrics.hrmCount ?? 0) === 0);
  const h7 = onlyRuns.filter((r) => (r.metrics.prqCount ?? 0) >= 1).length >= 3;

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainCarry: h1,
    h2ChainDepth: h2,
    h3FullPrq: h3,
    h4FullFldCh: h4,
    h5FullHrm: h5,
    h6Pair0NoHandshake: h6,
    h7OnlyFullPrq: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}

export { slimCarryChainMetrics } from './phase129-analyze.js';
