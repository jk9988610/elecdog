/** Phase 40 — 多细胞 × RPL 续行 [REN]/[PLG] */

import { analyzeRenewPlg } from './phase39-analyze.js';
import { channelCount } from './event-stats.js';

export function analyzeMulticellRenew(recorder, beings) {
  const base = analyzeRenewPlg(recorder, beings);
  const alive = beings.filter((b) => b.alive);
  const multicell = alive.filter((b) => b.organismType === 'multicell');
  const subUnits = multicell.reduce((s, b) => s + (b.subCells?.length ?? 0), 0);
  const orgScope = alive.filter((b) => b.rplScope === 'organism').length;
  const subScope = alive.filter((b) => b.rplScope === 'subunit').length;
  const renWithSubScope = (recorder.entries ?? []).filter(
    (e) =>
      e.channel === 'evolution' &&
      e.meta?.kind === 'REN' &&
      beings.find((x) => x.id === e.beingId)?.rplScope === 'subunit'
  ).length;

  return {
    ...base,
    intraCount: channelCount(recorder, 'cell', 'INTRA'),
    multicellAlive: multicell.length,
    subCellUnits: subUnits,
    rplOrganismScope: orgScope,
    rplSubunitScope: subScope,
    renWithSubScope,
  };
}

export function compareOrgVsSubRenew(orgRen, subRen) {
  const fissDelta = subRen.fissCount - orgRen.fissCount;
  const renDelta = subRen.renEventCount - orgRen.renEventCount;
  return {
    H1_subunitStillStricter: {
      verdict: fissDelta <= -2 ? 'support' : fissDelta <= 0 ? 'weak' : 'unsupport',
      orgFiss: orgRen.fissCount,
      subFiss: subRen.fissCount,
      delta: fissDelta,
    },
    H2_renCompensatesSub: {
      verdict: renDelta >= 5 && subRen.fissCount >= orgRen.fissCount - 2 ? 'support' : renDelta >= 1 ? 'weak' : 'unsupport',
      orgRen: orgRen.renEventCount,
      subRen: subRen.renEventCount,
      delta: renDelta,
    },
    H3_multicellStructure: {
      verdict: subRen.subCellUnits > subRen.multicellAlive ? 'support' : 'unsupport',
      populationIds: subRen.multicellAlive,
      subCellUnits: subRen.subCellUnits,
    },
  };
}

export function comparePlgEffect(withRen, withRenPlg) {
  const fissDelta = withRenPlg.fissCount - withRen.fissCount;
  return {
    H4_plgAddsRenewal: {
      verdict:
        withRenPlg.plgEventCount >= 1 && fissDelta >= 0
          ? withRenPlg.plgEventCount >= 3
            ? 'support'
            : 'weak'
          : 'unsupport',
      renOnlyFiss: withRen.fissCount,
      renPlgFiss: withRenPlg.fissCount,
      plgEvents: withRenPlg.plgEventCount,
      renDrop: withRen.renEventCount - withRenPlg.renEventCount,
    },
  };
}
