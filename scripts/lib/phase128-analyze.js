/** Phase 128 — GAP-PAIR-4 多维激素向量 */

import { evoCount } from './event-stats.js';
import { analyzePairChannelRepro } from './phase127-analyze.js';

export function analyzePairHormvecRepro(recorder, beings, world, ctx = {}) {
  return {
    ...analyzePairChannelRepro(recorder, beings, world, ctx),
    hrmCount: evoCount(recorder, 'HRM'),
    pairHormoneVector: world.envProfile?.pairHormoneVector === true,
    pairGateHScalar: beings
      .filter((b) => b.alive && b.pairMorph === 'B')
      .map((b) => b.pairGateHLast)
      .filter((v) => v != null),
  };
}

export function verifyPairHormvecBatch(byTreatment) {
  const hormRuns = byTreatment.ev128_pair_hormvec ?? [];
  const scalarRuns = byTreatment.ev128_pair_scalar ?? [];
  const fissRuns = byTreatment.ev128_pair_ctrl_fiss ?? [];

  const h1 = hormRuns.filter((r) => (r.metrics.hrmCount ?? 0) >= 1).length >= 3;
  const h2 = hormRuns.filter((r) => (r.metrics.pgrCount ?? 0) >= 1).length >= 3;
  const h3 = hormRuns.filter((r) => (r.metrics.fldInChCount ?? 0) >= 1).length >= 3;
  const h4 = hormRuns.filter((r) => (r.metrics.expCount ?? 0) >= 1).length >= 2;
  const h5 = scalarRuns.every((r) => (r.metrics.hrmCount ?? 0) === 0);
  const h6 = scalarRuns.filter((r) => (r.metrics.fldChCount ?? 0) >= 1).length >= 3;
  const h7 = fissRuns.some((r) => (r.metrics.fissCount ?? 0) >= 4);

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1HormvecHrm: h1,
    h2HormvecPgr: h2,
    h3HormvecFldInCh: h3,
    h4HormvecExp: h4,
    h5ScalarNoHrm: h5,
    h6ScalarFldCh: h6,
    h7FissCtrl: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}
