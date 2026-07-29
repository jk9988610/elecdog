/** Phase 46 — 子域积压路由 [ISPL]/[XBCN] */

import { analyzeMulticellRecomb } from './phase45-analyze.js';
import { evoCount } from './event-stats.js';

export function analyzeSubunitRoute(recorder, beings, world) {
  const base = analyzeMulticellRecomb(recorder, beings, world);
  return {
    ...base,
    isplEventCount: evoCount(recorder, 'ISPL'),
    xbcnEventCount: evoCount(recorder, 'XBCN'),
    liveFusCount: base.liveFusCount ?? 0,
  };
}

export function compareSubunitRoute(baseline, routed) {
  const backlogDelta = baseline.packetBacklog - routed.packetBacklog;
  const fusDelta = routed.fusEventCount - baseline.fusEventCount;
  const fmDelta = (routed.fusPerMei ?? 0) - (baseline.fusPerMei ?? 0);
  return {
    H1_reducesBacklog: {
      verdict: backlogDelta >= 20 ? 'support' : backlogDelta >= 8 ? 'weak' : 'unsupport',
      baseline: baseline.packetBacklog,
      routed: routed.packetBacklog,
      delta: backlogDelta,
    },
    H2_raisesFus: {
      verdict: fusDelta >= 3 ? 'support' : fusDelta >= 0 ? 'weak' : 'unsupport',
      baselineFus: baseline.fusEventCount,
      routedFus: routed.fusEventCount,
      delta: fusDelta,
    },
    H3_improvesFm: {
      verdict: fmDelta >= 0.15 ? 'support' : fmDelta >= 0.05 ? 'weak' : 'unsupport',
      baseline: baseline.fusPerMei,
      routed: routed.fusPerMei,
      delta: fmDelta,
    },
    H4_isplObservable: {
      verdict: routed.isplEventCount >= 1 ? 'support' : 'unsupport',
      ispl: routed.isplEventCount,
      xbcn: routed.xbcnEventCount,
    },
    H5_backlogUnder5: {
      verdict: routed.packetBacklog <= 5 ? 'support' : routed.packetBacklog <= 12 ? 'weak' : 'unsupport',
      backlog: routed.packetBacklog,
    },
  };
}

export function compareRouteRen(routed, routedRen) {
  const meiDelta = routedRen.meiEventCount - routed.meiEventCount;
  const backlogDelta = routed.packetBacklog - routedRen.packetBacklog;
  return {
    H6_renMoreMei: {
      verdict: meiDelta >= 5 ? 'support' : meiDelta >= 1 ? 'weak' : 'unsupport',
      routedMei: routed.meiEventCount,
      renMei: routedRen.meiEventCount,
    },
    H7_renClearsBacklog: {
      verdict: backlogDelta >= 3 ? 'support' : backlogDelta >= 0 ? 'weak' : 'unsupport',
      routedBacklog: routed.packetBacklog,
      renBacklog: routedRen.packetBacklog,
    },
  };
}
