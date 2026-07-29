/** 田野统计运行 — 无仪式、聚合记录、多样本群体 */

import { stepWorld } from '../../src/kernel/engine.js';
import { StatsRecorder } from '../../src/recorder/stats-recorder.js';
import { spawnBeing } from '../../src/birth/spawn.js';
import { buildFieldCohort, FIELD_TICKS } from './field-cohort.js';

export function runFieldTicks(world, recorder, ticks) {
  for (let i = 0; i < ticks; i++) {
    stepWorld(world, recorder);
  }
}

export function initFieldWorld(world, { phase, treatmentId, seed, ticks = FIELD_TICKS } = {}) {
  world.envProfile.fieldLiteLog = true;
  world.envProfile.fieldStatMode = true;
  const recorder = new StatsRecorder();
  recorder.system(0, `[field p${phase ?? '?'} ${treatmentId} seed${seed}]`, { phase, treatmentId, seed });
  const cohort = buildFieldCohort(seed);
  for (const spec of cohort) {
    spawnBeing(world, recorder, spec);
  }
  return { recorder, cohort, ticks };
}

export function runFieldScenario({
  createWorld,
  applyTreatment,
  treatmentId,
  seed,
  phase,
  ticks = FIELD_TICKS,
  analyze,
}) {
  const world = createWorld(`01-p${phase}-${treatmentId}-${seed}`);
  applyTreatment(world, treatmentId);
  const { recorder, cohort } = initFieldWorld(world, { phase, treatmentId, seed, ticks });
  runFieldTicks(world, recorder, ticks);
  const metrics = analyze(recorder, world.beings, world);
  return {
    treatmentId,
    seed,
    metrics,
    cohortSize: cohort.length,
    totalCounts: recorder.counts,
    entriesKept: recorder.entries.length,
  };
}
