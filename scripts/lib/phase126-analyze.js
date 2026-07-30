/** Phase 126 — GAP-PAIR-2 许可握手 [PRQ]/[PGR] */

import { evoCount } from './event-stats.js';
import { analyzePairFieldRepro } from './phase125-analyze.js';

export function analyzePairHandshakeRepro(recorder, beings, world, ctx = {}) {
  return {
    ...analyzePairFieldRepro(recorder, beings, world, ctx),
    prqCount: evoCount(recorder, 'PRQ'),
    pgrCount: evoCount(recorder, 'PGR'),
    pairHandshake: world.envProfile?.pairHandshake === true,
    pairRequestsEnd: world.pairRequests?.length ?? 0,
  };
}

export function verifyPairHandshakeBatch(byTreatment) {
  const handshakeRuns = byTreatment.ev126_pair_handshake ?? [];
  const noHandshakeRuns = byTreatment.ev126_pair_nohandshake ?? [];
  const fissRuns = byTreatment.ev126_pair_ctrl_fiss ?? [];

  const h1 = handshakeRuns.filter((r) => (r.metrics.prqCount ?? 0) >= 1).length >= 3;
  const h2 = handshakeRuns.filter((r) => (r.metrics.pgrCount ?? 0) >= 1).length >= 3;
  const h3 = handshakeRuns.filter((r) => (r.metrics.fldReleaseCount ?? 0) >= 1).length >= 3;
  const h4 = handshakeRuns.filter((r) => (r.metrics.expCount ?? 0) >= 1).length >= 3;
  const h5 = noHandshakeRuns.every((r) => (r.metrics.prqCount ?? 0) === 0);
  const h6 = noHandshakeRuns.filter((r) => (r.metrics.fldReleaseCount ?? 0) >= 1).length >= 3;
  const h7 = fissRuns.some((r) => (r.metrics.fissCount ?? 0) >= 4);

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1HandshakePrq: h1,
    h2HandshakePgr: h2,
    h3HandshakeFld: h3,
    h4HandshakeExp: h4,
    h5NoHandshakeNoPrq: h5,
    h6NoHandshakeFld: h6,
    h7FissCtrl: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}
