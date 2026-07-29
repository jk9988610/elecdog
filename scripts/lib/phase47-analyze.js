/** Phase 47 — 多细胞双路径竞争 [FISS] vs [MEI]/[FUS] */

import { analyzeSubunitRoute } from './phase46-analyze.js';
import { dnaDiversity } from '../../src/world/recombination.js';

export function analyzeDualPath(recorder, beings, world) {
  const base = analyzeSubunitRoute(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const diversity = dnaDiversity(beings);
  const fissChildren = alive.filter((b) => b.fissionParent).length;
  const recombChildren = alive.filter((b) => b.recombined || b.fusParentA).length;
  const reproEvents = base.fissCount + base.fusEventCount;

  return {
    ...base,
    fissChildrenAlive: fissChildren,
    recombChildrenAlive: recombChildren,
    uniqueDnaSeqs: diversity.uniqueSeqs,
    diversityRatio: diversity.population
      ? +(diversity.uniqueSeqs / diversity.population).toFixed(3)
      : null,
    fissShare: reproEvents > 0 ? +(base.fissCount / reproEvents).toFixed(3) : null,
    fusShare: reproEvents > 0 ? +(base.fusEventCount / reproEvents).toFixed(3) : null,
    rplPressure: base.fissCount + base.meiEventCount,
  };
}

export function compareDualVsFissOnly(fissOnly, dual) {
  const fusDelta = dual.fusEventCount - fissOnly.fusEventCount;
  const fissDelta = dual.fissCount - fissOnly.fissCount;
  const divDelta = dual.uniqueDnaSeqs - fissOnly.uniqueDnaSeqs;
  return {
    H1_dualHasFus: {
      verdict: dual.fusEventCount >= 1 ? 'support' : 'unsupport',
      dualFus: dual.fusEventCount,
      dualMei: dual.meiEventCount,
    },
    H2_fissStillActive: {
      verdict: dual.fissCount >= fissOnly.fissCount * 0.5 ? 'support' : dual.fissCount >= 1 ? 'weak' : 'unsupport',
      fissOnly: fissOnly.fissCount,
      dual: dual.fissCount,
      delta: fissDelta,
    },
    H3_higherDiversity: {
      verdict: divDelta >= 3 ? 'support' : divDelta >= 1 ? 'weak' : 'unsupport',
      fissOnly: fissOnly.uniqueDnaSeqs,
      dual: dual.uniqueDnaSeqs,
      delta: divDelta,
    },
    H4_rplCompetition: {
      verdict: dual.rplPressure > fissOnly.fissCount + 5 ? 'support' : 'weak',
      fissOnlyPressure: fissOnly.fissCount,
      dualPressure: dual.rplPressure,
    },
  };
}

export function compareDualVsRecombOnly(recombOnly, dual) {
  const fissDelta = dual.fissCount - recombOnly.fissCount;
  const fusDelta = dual.fusEventCount - recombOnly.fusEventCount;
  return {
    H5_dualHasFiss: {
      verdict: dual.fissCount >= 1 ? 'support' : 'unsupport',
      dualFiss: dual.fissCount,
      fissChildren: dual.fissChildrenAlive,
    },
    H6_fusNotCollapsed: {
      verdict: fusDelta >= -6 ? 'support' : fusDelta >= -12 ? 'weak' : 'unsupport',
      recombFus: recombOnly.fusEventCount,
      dualFus: dual.fusEventCount,
      delta: fusDelta,
    },
    H7_coexistence: {
      verdict: dual.fissCount >= 1 && dual.fusEventCount >= 1 ? 'support' : 'weak',
      fiss: dual.fissCount,
      fus: dual.fusEventCount,
      fissShare: dual.fissShare,
      fusShare: dual.fusShare,
    },
  };
}

export function compareDualOrgVsSub(org, sub) {
  return {
    H8_subMoreRecomb: {
      verdict: sub.fusEventCount >= org.fusEventCount ? 'support' : 'weak',
      orgFus: org.fusEventCount,
      subFus: sub.fusEventCount,
    },
    H9_orgMoreFiss: {
      verdict: org.fissCount >= sub.fissCount ? 'support' : 'weak',
      orgFiss: org.fissCount,
      subFiss: sub.fissCount,
    },
  };
}
