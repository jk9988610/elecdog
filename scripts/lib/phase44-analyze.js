/** Phase 44 — 汇合瓶颈突破 */

import { analyzeRecombRenew } from './phase43-analyze.js';
import { evoCount, evoWithMeta, endCount } from './event-stats.js';

export function analyzeFusBottleneck(recorder, beings, world) {
  const base = analyzeRecombRenew(recorder, beings);
  return {
    ...base,
    bcnEventCount: evoCount(recorder, 'BCN'),
    orphanFusCount: evoWithMeta(recorder, 'FUS', (m) => m.orphan === true),
    liveFusCount: evoWithMeta(recorder, 'FUS', (m) => m.liveDonor === true),
    packetBacklog: beings.filter((b) => b.alive && b.meiPacket).length,
    orphanPoolSize: world?.orphanPackets?.length ?? 0,
    totalEnds: endCount(recorder),
    fusPerMei: base.meiEventCount > 0 ? +(base.fusEventCount / base.meiEventCount).toFixed(3) : null,
  };
}

export function compareBottleneckFix(baseline, fixed) {
  const fusDelta = fixed.fusEventCount - baseline.fusEventCount;
  const ratioDelta = (fixed.fusPerMei ?? 0) - (baseline.fusPerMei ?? 0);
  return {
    H1_fixRaisesFus: {
      verdict: fusDelta >= 8 ? 'support' : fusDelta >= 3 ? 'weak' : 'unsupport',
      baseline: baseline.fusEventCount,
      fixed: fixed.fusEventCount,
      delta: fusDelta,
    },
    H2_improvesFusMeiRatio: {
      verdict: ratioDelta >= 0.05 ? 'support' : ratioDelta >= 0.02 ? 'weak' : 'unsupport',
      baseline: baseline.fusPerMei,
      fixed: fixed.fusPerMei,
      delta: ratioDelta,
    },
    H3_orphanFusObservable: {
      verdict: fixed.orphanFusCount >= 1 ? 'support' : 'unsupport',
      orphanFus: fixed.orphanFusCount,
      bcn: fixed.bcnEventCount,
    },
    H4_populationRecovery: {
      verdict: fixed.aliveTotal > baseline.aliveTotal + 1 ? 'support' : fixed.aliveTotal >= baseline.aliveTotal ? 'weak' : 'unsupport',
      baseline: baseline.aliveTotal,
      fixed: fixed.aliveTotal,
    },
  };
}

export function compareBeaconOnly(baseline, beacon) {
  const fusDelta = beacon.fusEventCount - baseline.fusEventCount;
  return {
    H5_beaconHelps: {
      verdict: fusDelta >= 2 ? 'support' : fusDelta >= 1 ? 'weak' : 'unsupport',
      baselineFus: baseline.fusEventCount,
      beaconFus: beacon.fusEventCount,
      bcnEvents: beacon.bcnEventCount,
    },
  };
}
