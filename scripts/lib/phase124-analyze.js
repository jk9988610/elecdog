/** Phase 124 — GAP-PAIR-0 体内合胞双源繁殖 */

import { evoCount } from './event-stats.js';

export function analyzePairRepro(recorder, beings, world, ctx = {}) {
  const alive = beings.filter((b) => b.alive);
  const offspring = alive.filter((b) => (b.generation ?? 0) > 0);
  const pairOffspring = alive.filter((b) => b.pairParentB);
  const nurtured = alive.filter((b) => b.independent === false);

  return {
    aliveTotal: alive.length,
    offspringAlive: offspring.length,
    pairOffspringAlive: pairOffspring.length,
    nurturedAlive: nurtured.length,
    meiCount: evoCount(recorder, 'MEI'),
    dockCount: evoCount(recorder, 'DCK'),
    fusInCount: evoCount(recorder, 'FUS-IN'),
    embCount: evoCount(recorder, 'EMB'),
    expCount: evoCount(recorder, 'EXP'),
    fusCount: evoCount(recorder, 'FUS'),
    fissCount: evoCount(recorder, 'FISS'),
    syncyteActive: beings.filter((b) => b.syncyte).length,
    morphA: alive.filter((b) => b.pairMorph === 'A').length,
    morphB: alive.filter((b) => b.pairMorph === 'B').length,
    ticksCompleted: ctx.ticks,
    pairReproEnabled: world.envProfile?.pairFusInBody === true,
  };
}

export function verifyPairReproBatch(byTreatment) {
  const minRuns = byTreatment.ev124_pair_min ?? [];
  const instantRuns = byTreatment.ev124_pair_ctrl_instant ?? [];
  const fissRuns = byTreatment.ev124_pair_ctrl_fiss ?? [];

  const h1 = minRuns.every((r) => (r.metrics.fissCount ?? 0) === 0);
  const h2 = minRuns.filter((r) => (r.metrics.fusInCount ?? 0) >= 1).length >= 3;
  const h3 = minRuns.filter((r) => (r.metrics.expCount ?? 0) >= 1).length >= 3;
  const h4 = minRuns.filter((r) => (r.metrics.pairOffspringAlive ?? 0) >= 1).length >= 3;
  const h5 = instantRuns.some((r) => (r.metrics.fusCount ?? 0) >= 1);
  const h6 = instantRuns.every((r) => (r.metrics.fusInCount ?? 0) === 0);
  const h7 = fissRuns.some((r) => (r.metrics.fissCount ?? 0) >= 4);

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1NoFiss: h1,
    h2FusInObserved: h2,
    h3ExpObserved: h3,
    h4OffspringAlive: h4,
    h5InstantFusCtrl: h5,
    h6NoFusInCtrl: h6,
    h7FissCtrl: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}
