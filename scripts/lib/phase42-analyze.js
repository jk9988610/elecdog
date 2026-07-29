/** Phase 42 — [MEI] / [FUS] 减数与双源汇合 */

import { analyzeReplication } from './rpl-analyze.js';
import { dnaDiversity } from '../../src/world/recombination.js';

export function analyzeRecombination(entries, beings) {
  const base = analyzeReplication(entries, beings);
  const mei = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'MEI');
  const fus = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FUS');
  const fiss = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FISS');
  const diversity = dnaDiversity(beings);
  const alive = beings.filter((b) => b.alive);
  const recombined = alive.filter((b) => b.recombined || b.fusParentA);

  return {
    ...base,
    meiEventCount: mei.length,
    fusEventCount: fus.length,
    fissCount: fiss.length,
    uniqueDnaSeqs: diversity.uniqueSeqs,
    recombinedAlive: recombined.length,
    withMeiPacket: alive.filter((b) => b.meiPacket).length,
    totalMeiCount: alive.reduce((s, b) => s + (b.meiCount ?? 0), 0),
    totalFusCount: alive.reduce((s, b) => s + (b.fusCount ?? 0), 0),
    diversityRatio: diversity.population
      ? +(diversity.uniqueSeqs / diversity.population).toFixed(3)
      : null,
  };
}

export function compareClonalVsRecomb(clonal, recomb) {
  return {
    H1_fusPathExists: {
      verdict: recomb.fusEventCount >= 1 ? 'support' : 'unsupport',
      mei: recomb.meiEventCount,
      fus: recomb.fusEventCount,
    },
    H2_noFissWhenDisabled: {
      verdict: recomb.fissCount === 0 ? 'support' : 'unsupport',
      fiss: recomb.fissCount,
    },
    H3_higherDiversity: {
      verdict:
        recomb.uniqueDnaSeqs > clonal.uniqueDnaSeqs + 2
          ? 'support'
          : recomb.uniqueDnaSeqs > clonal.uniqueDnaSeqs
            ? 'weak'
            : 'unsupport',
      clonalUnique: clonal.uniqueDnaSeqs,
      recombUnique: recomb.uniqueDnaSeqs,
    },
    H4_populationGrows: {
      verdict: recomb.aliveTotal >= 8 ? 'support' : recomb.aliveTotal >= 4 ? 'weak' : 'unsupport',
      alive: recomb.aliveTotal,
    },
  };
}

export function compareBothPaths(both, clonal) {
  return {
    H5_dualPath: {
      verdict: both.fissCount >= 1 && both.fusEventCount >= 1 ? 'support' : 'weak',
      fiss: both.fissCount,
      fus: both.fusEventCount,
      mei: both.meiEventCount,
    },
    H6_diversityVsClonal: {
      verdict: both.uniqueDnaSeqs >= clonal.uniqueDnaSeqs ? 'support' : 'unsupport',
      both: both.uniqueDnaSeqs,
      clonal: clonal.uniqueDnaSeqs,
    },
  };
}
