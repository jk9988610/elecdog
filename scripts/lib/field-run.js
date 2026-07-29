/** 田野统计运行 — 无仪式、聚合记录、多样本群体 */

import { stepWorld } from '../../src/kernel/engine.js';
import { StatsRecorder } from '../../src/recorder/stats-recorder.js';
import { resetBirthCounters } from '../../src/core/id.js';
import { spawnBeing } from '../../src/birth/spawn.js';
import { buildFieldCohort, buildQuadChainCohort, FIELD_TICKS } from './field-cohort.js';

export function runFieldTicks(world, recorder, ticks, { label, onProgress } = {}) {
  const step = ticks > 1920 ? 960 : 0;
  for (let i = 0; i < ticks; i++) {
    stepWorld(world, recorder);
    if (step && (i + 1) % step === 0) {
      onProgress?.(i + 1, ticks, label);
    }
  }
}

export function initFieldWorld(world, { phase, treatmentId, seed, ticks = FIELD_TICKS, cohort = 'default' } = {}) {
  world.envProfile.fieldLiteLog = true;
  world.envProfile.fieldStatMode = true;
  const recorder = new StatsRecorder();
  recorder.system(0, `[field p${phase ?? '?'} ${treatmentId} seed${seed}]`, { phase, treatmentId, seed });
  const cohortSpec =
    cohort === 'quad' || world.envProfile.cohort === 'quad'
      ? buildQuadChainCohort(seed)
      : buildFieldCohort(seed);
  for (const spec of cohortSpec) {
    spawnBeing(world, recorder, spec);
  }
  const cohortIds = cohortSpec.map((s) => s.id).filter(Boolean);
  return { recorder, cohort: cohortSpec, cohortIds, ticks };
}

export function runFieldScenario({
  createWorld,
  applyTreatment,
  treatmentId,
  seed,
  phase,
  ticks = FIELD_TICKS,
  analyze,
  onProgress,
}) {
  resetBirthCounters();
  const world = createWorld(`01-p${phase}-${treatmentId}-${seed}`);
  applyTreatment(world, treatmentId);
  const { recorder, cohort, cohortIds } = initFieldWorld(world, { phase, treatmentId, seed, ticks });
  const label = `${treatmentId} seed${seed}`;
  runFieldTicks(world, recorder, ticks, {
    label,
    onProgress: (tick, total, lbl) => {
      process.stdout.write(`    ${lbl} tick ${tick}/${total}\n`);
      onProgress?.(tick, total, lbl);
    },
  });
  const metrics = analyze(recorder, world.beings, world, { cohortIds, ticks });
  return {
    treatmentId,
    seed,
    metrics,
    cohortSize: cohort.length,
    cohortIds,
    totalCounts: recorder.counts,
    entriesKept: recorder.entries.length,
  };
}
