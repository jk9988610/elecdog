/** Phase 45 — 多细胞 × 重组 [MEI]/[FUS] */

import { analyzeFusBottleneck } from './phase44-analyze.js';
import { channelCount, evoWithMeta } from './event-stats.js';

export function analyzeMulticellRecomb(recorder, beings, world) {
  const base = analyzeFusBottleneck(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const multicell = alive.filter((b) => b.organismType === 'multicell');
  const recombined = alive.filter((b) => b.recombined);
  const recombinedMulticell = recombined.filter((b) => b.organismType === 'multicell');
  const subUnits = multicell.reduce((s, b) => s + (b.subCells?.length ?? 0), 0);
  const meiMulticell = evoWithMeta(recorder, 'MEI', (m) => m.organismType === 'multicell');
  const fusMulticell = evoWithMeta(recorder, 'FUS', (m) => m.organismType === 'multicell');
  const meiActiveDeduct = evoWithMeta(recorder, 'MEI', (m) => m.meiRplDeduct === 'active');

  return {
    ...base,
    intraCount: channelCount(recorder, 'cell', 'INTRA'),
    multicellAlive: multicell.length,
    subCellUnits: subUnits,
    recombinedAlive: recombined.length,
    recombinedMulticell: recombinedMulticell.length,
    meiMulticellEvents: meiMulticell,
    fusMulticellEvents: fusMulticell,
    meiActiveDeductEvents: meiActiveDeduct,
    orgScopeAlive: alive.filter((b) => b.rplScope === 'organism').length,
    subScopeAlive: alive.filter((b) => b.rplScope === 'subunit').length,
  };
}

export function compareOrgVsSubRecomb(org, sub) {
  const meiDelta = sub.meiEventCount - org.meiEventCount;
  const fusDelta = sub.fusEventCount - org.fusEventCount;
  const backlogDelta = sub.packetBacklog - org.packetBacklog;
  return {
    H1_subMoreMei: {
      verdict: meiDelta >= 5 ? 'support' : meiDelta >= 0 ? 'weak' : 'unsupport',
      orgMei: org.meiEventCount,
      subMei: sub.meiEventCount,
      delta: meiDelta,
    },
    H2_subBacklog: {
      verdict: backlogDelta >= 2 ? 'support' : backlogDelta >= 0 ? 'weak' : 'unsupport',
      orgBacklog: org.packetBacklog,
      subBacklog: sub.packetBacklog,
    },
    H3_fusParity: {
      verdict: fusDelta >= -4 ? 'support' : 'weak',
      orgFus: org.fusEventCount,
      subFus: sub.fusEventCount,
      orgFm: org.fusPerMei,
      subFm: sub.fusPerMei,
    },
  };
}

export function compareMulticellFix(baseline, fixed) {
  const fusDelta = fixed.fusEventCount - baseline.fusEventCount;
  const ratioDelta = (fixed.fusPerMei ?? 0) - (baseline.fusPerMei ?? 0);
  return {
    H4_fixRaisesFus: {
      verdict: fusDelta >= 8 ? 'support' : fusDelta >= 3 ? 'weak' : 'unsupport',
      baseline: baseline.fusEventCount,
      fixed: fixed.fusEventCount,
      delta: fusDelta,
    },
    H5_improvesFm: {
      verdict: ratioDelta >= 0.05 ? 'support' : ratioDelta >= 0.02 ? 'weak' : 'unsupport',
      baseline: baseline.fusPerMei,
      fixed: fixed.fusPerMei,
    },
    H6_multicellFusOffspring: {
      verdict: fixed.recombinedMulticell >= 1 ? 'support' : 'unsupport',
      count: fixed.recombinedMulticell,
      intra: fixed.intraCount,
    },
  };
}
