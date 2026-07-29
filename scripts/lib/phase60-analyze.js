/** Phase 60 — 电子人续行 [EHU-REN] × REN/PLG */

import { analyzeEhuGeneration } from './phase59-analyze.js';
import { analyzeRenewPlg } from './phase39-analyze.js';
import { evoCount } from './event-stats.js';

export function analyzeEhuRenew(recorder, beings, world) {
  const gen = analyzeEhuGeneration(recorder, beings, world);
  const renew = analyzeRenewPlg(recorder, beings);
  const alive = beings.filter((b) => b.alive);
  const h3WithRen = alive.filter(
    (b) => (b.ehuStage ?? 'H0') === 'H3' && (b.ehuRenCount ?? 0) > 0
  ).length;

  return {
    ...gen,
    renEventCount: renew.renEventCount,
    plgEventCount: renew.plgEventCount,
    totalRenCount: renew.totalRenCount,
    totalPlgCount: renew.totalPlgCount,
    beingsWithRen: renew.beingsWithRen,
    beingsWithPlg: renew.beingsWithPlg,
    ehuRenCount: evoCount(recorder, 'EHU-REN'),
    beingsWithEhuRen: alive.filter((b) => (b.ehuRenCount ?? 0) > 0).length,
    h3WithRen,
  };
}

export function compareEhuRenOffVsRen(off, ren) {
  const fissDelta = (ren.fissCount ?? 0) - (off.fissCount ?? 0);
  const ehuRenDelta = (ren.ehuRenCount ?? 0) - (off.ehuRenCount ?? 0);
  return {
    H1_renRaisesFiss: {
      verdict: fissDelta >= 3 ? 'support' : fissDelta >= 1 ? 'weak' : 'unsupport',
      off: off.fissCount,
      ren: ren.fissCount,
      delta: fissDelta,
    },
    H2_ehuRenFires: {
      verdict: ehuRenDelta >= 8 ? 'support' : ehuRenDelta >= 1 ? 'weak' : 'unsupport',
      off: off.ehuRenCount ?? 0,
      ren: ren.ehuRenCount ?? 0,
      renEvents: ren.renEventCount ?? 0,
    },
    H3_h3WithRen: {
      verdict: (ren.h3WithRen ?? 0) >= (off.h3WithRen ?? 0) ? 'support' : 'weak',
      off: off.h3WithRen,
      ren: ren.h3WithRen,
    },
  };
}

export function compareEhuRenVsPlg(ren, plg) {
  const plgDelta = (plg.plgEventCount ?? 0) - (ren.plgEventCount ?? 0);
  const fissDelta = (plg.fissCount ?? 0) - (ren.fissCount ?? 0);
  return {
    H4_plgAddsRenewal: {
      verdict: plgDelta >= 4 ? 'support' : plgDelta >= 1 ? 'weak' : 'unsupport',
      renPlg: ren.plgEventCount ?? 0,
      plg: plg.plgEventCount ?? 0,
    },
    H5_populationGain: {
      verdict:
        (plg.aliveTotal ?? 0) >= (ren.aliveTotal ?? 0) && fissDelta >= 0 ? 'support' : 'weak',
      renAlive: ren.aliveTotal,
      plgAlive: plg.aliveTotal,
      fissDelta,
    },
    H6_linRenCoexist: {
      verdict:
        (plg.ehuLinCount ?? 0) >= 16 && (plg.ehuRenCount ?? 0) >= 8 ? 'support' : 'weak',
      lin: plg.ehuLinCount,
      ehuRen: plg.ehuRenCount,
    },
  };
}
