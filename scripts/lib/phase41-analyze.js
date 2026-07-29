/** Phase 41 — 续行代价 [RCO] */

import { analyzeRenewPlg } from './phase39-analyze.js';
import { evoCount, evoWithMeta, endCount } from './event-stats.js';

export function analyzeRenewCost(recorder, beings) {
  const base = analyzeRenewPlg(recorder, beings);

  const alive = beings.filter((b) => b.alive);
  const meanDebt = alive.length
    ? +(alive.reduce((s, b) => s + (b.renewTickDebt ?? 0), 0) / alive.length).toFixed(2)
    : null;

  return {
    ...base,
    rcoEventCount: evoCount(recorder, 'RCO'),
    rcoRenEvents: evoWithMeta(recorder, 'RCO', (m) => m.via === 'REN'),
    rcoPlgEvents: evoWithMeta(recorder, 'RCO', (m) => m.via === 'PLG'),
    renewDebtEnds: endCount(recorder, 'renew_tick_debt'),
    tickCapEnds: endCount(recorder, 'rpl_tick_cap'),
    stressEnds: endCount(recorder, 'stress_streak'),
    totalEnds: endCount(recorder),
    meanRenewTickDebt: meanDebt,
  };
}

export function compareRenewCost(free, cost) {
  const fissDelta = cost.fissCount - free.fissCount;
  const aliveDelta = cost.aliveTotal - free.aliveTotal;
  return {
    H1_costReducesFiss: {
      verdict: fissDelta <= -4 ? 'support' : fissDelta <= -1 ? 'weak' : 'unsupport',
      free: free.fissCount,
      cost: cost.fissCount,
      delta: fissDelta,
    },
    H2_rcoObservable: {
      verdict: cost.rcoEventCount >= 1 ? 'support' : 'unsupport',
      events: cost.rcoEventCount,
    },
    H3_debtTermination: {
      verdict: cost.renewDebtEnds >= 1 || cost.tickCapEnds >= 1 ? 'support' : 'unsupport',
      debtEnds: cost.renewDebtEnds,
      tickEnds: cost.tickCapEnds,
    },
    H4_popBelowFree: {
      verdict: aliveDelta <= -2 ? 'support' : aliveDelta < 0 ? 'weak' : 'unsupport',
      free: free.aliveTotal,
      cost: cost.aliveTotal,
      delta: aliveDelta,
    },
  };
}

export function comparePlgCost(renCost, renPlgCost) {
  const fissDelta = renPlgCost.fissCount - renCost.fissCount;
  return {
    H5_plgUnderCost: {
      verdict:
        renPlgCost.plgEventCount >= 1 && fissDelta >= -2
          ? renPlgCost.rcoPlgEvents >= 1
            ? 'support'
            : 'weak'
          : 'unsupport',
      renCostFiss: renCost.fissCount,
      plgCostFiss: renPlgCost.fissCount,
      plgEvents: renPlgCost.plgEventCount,
      rcoPlg: renPlgCost.rcoPlgEvents,
    },
  };
}
