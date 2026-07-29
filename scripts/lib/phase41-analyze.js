/** Phase 41 — 续行代价 [RCO] */

import { analyzeRenewPlg } from './phase39-analyze.js';

export function analyzeRenewCost(entries, beings) {
  const base = analyzeRenewPlg(entries, beings);
  const rco = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'RCO');
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const debtEnds = ends.filter((e) => e.meta?.reason === 'renew_tick_debt');
  const tickEnds = ends.filter((e) => e.meta?.reason === 'rpl_tick_cap');
  const stressEnds = ends.filter((e) => e.meta?.reason === 'stress_streak');

  const alive = beings.filter((b) => b.alive);
  const meanDebt = alive.length
    ? +(alive.reduce((s, b) => s + (b.renewTickDebt ?? 0), 0) / alive.length).toFixed(2)
    : null;

  return {
    ...base,
    rcoEventCount: rco.length,
    rcoRenEvents: rco.filter((e) => e.meta?.via === 'REN').length,
    rcoPlgEvents: rco.filter((e) => e.meta?.via === 'PLG').length,
    renewDebtEnds: debtEnds.length,
    tickCapEnds: tickEnds.length,
    stressEnds: stressEnds.length,
    totalEnds: ends.length,
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
