/** Phase 127 — GAP-PAIR-3 subCell / r_k 通道绑定 */

import { evoCount } from './event-stats.js';
import { analyzePairHandshakeRepro } from './phase126-analyze.js';

function countKinds(recorder, kinds) {
  return kinds.reduce((sum, k) => sum + evoCount(recorder, k), 0);
}

export function analyzePairChannelRepro(recorder, beings, world, ctx = {}) {
  const fldChCount = countKinds(recorder, ['FLD-CH']);
  const fldInChCount = countKinds(recorder, ['FLD-CH-IN']);
  return {
    ...analyzePairHandshakeRepro(recorder, beings, world, ctx),
    fldChCount,
    fldInChCount,
    fldChTotal: fldChCount + evoCount(recorder, 'FLD'),
    fldInChTotal: fldInChCount + evoCount(recorder, 'FLD-IN'),
    pairChannelBind: world.envProfile?.pairChannelBind === true,
  };
}

export function verifyPairChannelBatch(byTreatment) {
  const channelRuns = byTreatment.ev127_pair_channel ?? [];
  const noChannelRuns = byTreatment.ev127_pair_nochannel ?? [];
  const fissRuns = byTreatment.ev127_pair_ctrl_fiss ?? [];

  const h1 = channelRuns.filter((r) => (r.metrics.fldChCount ?? 0) >= 1).length >= 3;
  const h2 = channelRuns.filter((r) => (r.metrics.fldInChCount ?? 0) >= 1).length >= 3;
  const h3 = channelRuns.filter((r) => (r.metrics.expCount ?? 0) >= 1).length >= 3;
  const h4 = channelRuns.filter((r) => (r.metrics.prqCount ?? 0) >= 1).length >= 3;
  const h5 = noChannelRuns.every((r) => (r.metrics.fldChCount ?? 0) === 0);
  const h6 = noChannelRuns.filter((r) => (r.metrics.fldReleaseCount ?? 0) >= 1).length >= 3;
  const h7 = fissRuns.some((r) => (r.metrics.fissCount ?? 0) >= 4);

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChannelFldCh: h1,
    h2ChannelFldInCh: h2,
    h3ChannelExp: h3,
    h4ChannelPrq: h4,
    h5NoChannelNoFldCh: h5,
    h6NoChannelFld: h6,
    h7FissCtrl: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}
