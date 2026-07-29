/** Phase 39 — [REN] 环境重置 / [PLG] 双体通量汇合 */

import { analyzeReplication } from './rpl-analyze.js';
import { evoCount } from './event-stats.js';

export function analyzeRenewPlg(recorder, beings) {
  const base = analyzeReplication(recorder, beings);

  const alive = beings.filter((b) => b.alive);
  const totalRenCount = alive.reduce((s, b) => s + (b.renCount ?? 0), 0);
  const totalPlgCount = alive.reduce((s, b) => s + (b.plgCount ?? 0), 0);

  return {
    ...base,
    renEventCount: evoCount(recorder, 'REN'),
    plgEventCount: evoCount(recorder, 'PLG'),
    totalRenCount,
    totalPlgCount,
    beingsWithRen: alive.filter((b) => (b.renCount ?? 0) > 0).length,
    beingsWithPlg: alive.filter((b) => (b.plgCount ?? 0) > 0).length,
  };
}

export function compareRenPlg(baseline, withRen, withRenPlg) {
  const fissRenDelta = withRen.fissCount - baseline.fissCount;
  const fissPlgDelta = withRenPlg.fissCount - baseline.fissCount;
  const aliveRenDelta = withRen.aliveTotal - baseline.aliveTotal;
  const alivePlgDelta = withRenPlg.aliveTotal - baseline.aliveTotal;

  return {
    H1_renRaisesFiss: {
      verdict: fissRenDelta >= 3 ? 'support' : fissRenDelta >= 1 ? 'weak' : 'unsupport',
      baseline: baseline.fissCount,
      ren: withRen.fissCount,
      delta: fissRenDelta,
      renEvents: withRen.renEventCount,
    },
    H2_renObservable: {
      verdict: withRen.renEventCount >= 1 ? 'support' : 'unsupport',
      events: withRen.renEventCount,
      beings: withRen.beingsWithRen,
    },
    H3_plgAddsRenewal: {
      verdict:
        withRenPlg.plgEventCount >= 1 && withRenPlg.fissCount >= withRen.fissCount
          ? 'support'
          : withRenPlg.plgEventCount >= 1
            ? 'weak'
            : 'unsupport',
      plgEvents: withRenPlg.plgEventCount,
      renOnlyFiss: withRen.fissCount,
      renPlgFiss: withRenPlg.fissCount,
      delta: fissPlgDelta - fissRenDelta,
    },
    H4_populationEffect: {
      verdict:
        alivePlgDelta > aliveRenDelta + 1
          ? 'support'
          : aliveRenDelta > 0 || alivePlgDelta > 0
            ? 'weak'
            : 'unsupport',
      baseline: baseline.aliveTotal,
      ren: withRen.aliveTotal,
      renPlg: withRenPlg.aliveTotal,
    },
  };
}
