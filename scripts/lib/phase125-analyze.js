/** Phase 125 — GAP-PAIR-1 半态排入环境场 */

import { evoCount } from './event-stats.js';
import { analyzePairRepro } from './phase124-analyze.js';

export function analyzePairFieldRepro(recorder, beings, world, ctx = {}) {
  return {
    ...analyzePairRepro(recorder, beings, world, ctx),
    fldReleaseCount: evoCount(recorder, 'FLD'),
    fldInCount: evoCount(recorder, 'FLD-IN'),
    fieldHalvesEnd: world.fieldHalves?.length ?? 0,
    pairHalfRelease: world.envProfile?.pairHalfRelease === true,
  };
}

export function verifyPairFieldBatch(byTreatment) {
  const fieldRuns = byTreatment.ev125_pair_field ?? [];
  const bodyRuns = byTreatment.ev125_pair_body ?? [];
  const fissRuns = byTreatment.ev125_pair_ctrl_fiss ?? [];

  const h1 = fieldRuns.filter((r) => (r.metrics.fldReleaseCount ?? 0) >= 1).length >= 3;
  const h2 = fieldRuns.filter((r) => (r.metrics.fldInCount ?? 0) >= 1).length >= 3;
  const h3 = fieldRuns.filter((r) => (r.metrics.fusInCount ?? 0) >= 1).length >= 3;
  const h4 = fieldRuns.filter((r) => (r.metrics.expCount ?? 0) >= 1).length >= 3;
  const h5 = bodyRuns.every((r) => (r.metrics.fldReleaseCount ?? 0) === 0);
  const h6 = bodyRuns.filter((r) => (r.metrics.fusInCount ?? 0) >= 1).length >= 3;
  const h7 = fissRuns.some((r) => (r.metrics.fissCount ?? 0) >= 4);

  const passed = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1FieldRelease: h1,
    h2FieldPickup: h2,
    h3FieldFusIn: h3,
    h4FieldExp: h4,
    h5BodyNoField: h5,
    h6BodyFusIn: h6,
    h7FissCtrl: h7,
    passed,
    total: 7,
    verdict: passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}
