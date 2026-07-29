/** Phase 43 — 重组 × 续行 + live-donor */

import { analyzeRecombination } from './phase42-analyze.js';

export function analyzeRecombRenew(entries, beings) {
  const base = analyzeRecombination(entries, beings);
  const ren = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'REN');
  const fus = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FUS');
  const liveFus = fus.filter((e) => e.meta?.liveDonor === true);

  return {
    ...base,
    renEventCount: ren.length,
    liveFusCount: liveFus.length,
    packetBacklog: base.withMeiPacket,
    fusPerMei: base.meiEventCount > 0 ? +(base.fusEventCount / base.meiEventCount).toFixed(3) : null,
  };
}

export function compareRenBoost(baseline, withRen) {
  const fusDelta = withRen.fusEventCount - baseline.fusEventCount;
  const meiDelta = withRen.meiEventCount - baseline.meiEventCount;
  return {
    H1_renBoostsMei: {
      verdict: meiDelta >= 3 ? 'support' : meiDelta >= 1 ? 'weak' : 'unsupport',
      baselineMei: baseline.meiEventCount,
      renMei: withRen.meiEventCount,
      delta: meiDelta,
    },
    H2_renBoostsFus: {
      verdict: fusDelta >= 2 ? 'support' : fusDelta >= 0 ? 'weak' : 'unsupport',
      baselineFus: baseline.fusEventCount,
      renFus: withRen.fusEventCount,
      renEvents: withRen.renEventCount,
    },
    H3_population: {
      verdict: withRen.aliveTotal >= baseline.aliveTotal ? 'support' : 'weak',
      baseline: baseline.aliveTotal,
      ren: withRen.aliveTotal,
    },
  };
}

export function compareDonorFix(strict, fixed) {
  const fusDelta = fixed.fusEventCount - strict.fusEventCount;
  const backlogDelta = strict.packetBacklog - fixed.packetBacklog;
  return {
    H4_donorRaisesFus: {
      verdict: fusDelta >= 5 ? 'support' : fusDelta >= 2 ? 'weak' : 'unsupport',
      strictFus: strict.fusEventCount,
      fixedFus: fixed.fusEventCount,
      liveFus: fixed.liveFusCount,
      delta: fusDelta,
    },
    H5_reducesBacklog: {
      verdict: backlogDelta >= 1 ? 'support' : backlogDelta === 0 ? 'weak' : 'unsupport',
      strictBacklog: strict.packetBacklog,
      fixedBacklog: fixed.packetBacklog,
    },
    H6_fusMeiRatio: {
      verdict: (fixed.fusPerMei ?? 0) > (strict.fusPerMei ?? 0) + 0.02 ? 'support' : 'weak',
      strict: strict.fusPerMei,
      fixed: fixed.fusPerMei,
    },
  };
}
