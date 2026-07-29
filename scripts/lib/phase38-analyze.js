/** Phase 38 — 多细胞 × RPL 田野 */

export function analyzeMulticellRpl(entries, beings) {
  const fiss = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FISS');
  const intra = entries.filter((e) => e.channel === 'cell' && e.meta?.kind === 'INTRA');
  const rpl = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'RPL');
  const alive = beings.filter((b) => b.alive);
  const multicell = alive.filter((b) => b.organismType === 'multicell');
  const unicell = alive.filter((b) => b.organismType !== 'multicell');
  const subUnits = multicell.reduce((s, b) => s + (b.subCells?.length ?? 0), 0);
  const exhausted = alive.filter((b) => (b.rplRemaining ?? 1) <= 0);
  const subScope = rpl.filter((e) => e.meta?.rplScope === 'subunit').length;
  const orgScope = rpl.filter((e) => e.meta?.rplScope === 'organism').length;

  return {
    fissCount: fiss.length,
    intraCount: intra.length,
    rplEventCount: rpl.length,
    aliveTotal: alive.length,
    multicellAlive: multicell.length,
    unicellAlive: unicell.length,
    subCellUnits: subUnits,
    populationIds: alive.length,
    exhaustedAlive: exhausted.length,
    rplSubScopeEvents: subScope,
    rplOrganismScopeEvents: orgScope,
    meanRplRemaining:
      alive.filter((b) => b.rplRemaining != null).length > 0
        ? +(
            alive
              .filter((b) => b.rplRemaining != null)
              .reduce((s, b) => s + b.rplRemaining, 0) /
            alive.filter((b) => b.rplRemaining != null).length
          ).toFixed(2)
        : null,
  };
}

export function compareMulticellRpl(unicell, multicell) {
  return {
    H1_intraOnlyMulticell: {
      verdict: multicell.intraCount > 0 && unicell.intraCount === 0 ? 'support' : 'unsupport',
      unicellIntra: unicell.intraCount,
      multicellIntra: multicell.intraCount,
    },
    H2_sharedRplLimitsPop: {
      verdict:
        Math.abs(multicell.aliveTotal - unicell.aliveTotal) <= 4
          ? 'weak'
          : multicell.aliveTotal < unicell.aliveTotal
            ? 'support'
            : 'pending',
      unicellAlive: unicell.aliveTotal,
      multicellAlive: multicell.aliveTotal,
    },
    H3_populationVsSubunits: {
      verdict:
        multicell.subCellUnits > multicell.populationIds ? 'support' : 'unsupport',
      populationIds: multicell.populationIds,
      subCellUnits: multicell.subCellUnits,
    },
  };
}

export function compareSubunitRpl(organismScope, subunitScope) {
  const fissDelta = subunitScope.fissCount - organismScope.fissCount;
  return {
    H4_subunitStricter: {
      verdict: fissDelta <= -2 ? 'support' : fissDelta <= 0 ? 'weak' : 'unsupport',
      organismFiss: organismScope.fissCount,
      subunitFiss: subunitScope.fissCount,
      delta: fissDelta,
    },
    H5_subunitScopeLogged: {
      verdict: subunitScope.rplSubScopeEvents > 0 ? 'support' : 'unsupport',
      events: subunitScope.rplSubScopeEvents,
    },
  };
}
