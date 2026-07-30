/** Phase 106 — 塑形田野 + 留置混合田野 */

import { stepWorld } from '../../src/kernel/engine.js';
import { StatsRecorder } from '../../src/recorder/stats-recorder.js';
import { resetBirthCounters } from '../../src/core/id.js';
import { spawnBeing, spawnCarriedBeing } from '../../src/birth/spawn.js';
import { applyEnvProfile } from '../../src/world/env-profile.js';
import { buildFieldCohort, buildMixedCohort, FIELD_MED_TICKS } from './field-cohort.js';
import { runFieldTicks } from './field-run.js';
import { selectCarrySnapshots } from '../../src/carry/select-carry.js';
import { checkFieldRunBudget, formatFieldDuration, getFieldRunMaxMs } from './field-budget.js';

export function initFieldWorldWithCohort(world, { phase, treatmentId, seed, ticks = FIELD_MED_TICKS, cohortSpec }) {
  world.envProfile.fieldLiteLog = true;
  world.envProfile.fieldStatMode = true;
  const recorder = new StatsRecorder();
  recorder.system(0, `[field p${phase ?? '?'} ${treatmentId} seed${seed}]`, {
    phase,
    treatmentId,
    seed,
  });

  for (const spec of cohortSpec) {
    if (spec._carrySnapshot) {
      spawnCarriedBeing(world, recorder, spec._carrySnapshot, {
        cohortTag: 'carry',
        fixedId: spec.id,
      });
    } else {
      spawnBeing(world, recorder, spec);
    }
  }

  const cohortIds = cohortSpec.map((s) => s.id).filter(Boolean);
  return { recorder, cohort: cohortSpec, cohortIds, ticks };
}

export function runSculptPass({
  createWorld,
  seed,
  phase,
  treatmentId,
  sculptEnvId,
  sculptTicks = FIELD_MED_TICKS,
  profile,
}) {
  resetBirthCounters();
  const world = createWorld(`01-p${phase}-sculpt-${seed}`);
  applyEnvProfile(world, sculptEnvId);
  world.envProfile = { ...world.envProfile, fieldStatMode: true, fieldLiteLog: true };

  const cohortSpec = buildFieldCohort(seed);
  const { recorder } = initFieldWorldWithCohort(world, {
    phase,
    treatmentId: `${treatmentId}_sculpt`,
    seed,
    ticks: sculptTicks,
    cohortSpec,
  });

  runFieldTicks(world, recorder, sculptTicks);
  const carries = selectCarrySnapshots(world, profile, {
    phase,
    seed,
    treatmentId,
    envId: sculptEnvId,
    sculptTicks,
  });

  return { world, recorder, carries };
}

export function runFieldCarryScenario({
  createWorld,
  applyTreatment,
  treatmentId,
  seed,
  phase,
  ticks = FIELD_MED_TICKS,
  analyze,
  carrySnapshots = [],
}) {
  const startedAt = performance.now();
  resetBirthCounters();
  const world = createWorld(`01-p${phase}-${treatmentId}-${seed}`);
  const profile = applyTreatment(world, treatmentId);
  const carryMode = profile.carryMode ?? 'none';

  let carries = carrySnapshots;
  if (carryMode !== 'none' && !carries.length) {
    const sculpt = runSculptPass({
      createWorld,
      seed,
      phase,
      treatmentId,
      sculptEnvId: profile.sculptEnvId ?? 'harsh_combined',
      sculptTicks: profile.sculptTicks ?? FIELD_MED_TICKS,
      profile,
    });
    carries = sculpt.carries;
  }

  const cohortSpec =
    carryMode === 'none'
      ? buildFieldCohort(seed)
      : buildMixedCohort(seed, carries, profile);

  const { recorder, cohortIds } = initFieldWorldWithCohort(world, {
    phase,
    treatmentId,
    seed,
    ticks,
    cohortSpec,
  });

  runFieldTicks(world, recorder, ticks);
  const metrics = analyze(recorder, world.beings, world, {
    cohortIds,
    ticks,
    carryCount: carries.length,
    carryMode,
  });

  const durationMs = performance.now() - startedAt;
  const maxMs = getFieldRunMaxMs();
  const budgetPass = durationMs <= maxMs;
  if (!budgetPass) {
    checkFieldRunBudget(durationMs, { label: `${treatmentId} seed${seed}`, phase });
  }

  return {
    treatmentId,
    seed,
    phase,
    metrics,
    carryCount: carries.length,
    carries: carries.map((c) => ({
      generation: c.generation,
      envId: c.provenance?.envId,
      ecoRepro: c.ecoRepro,
    })),
    cohortSize: cohortSpec.length,
    durationMs,
    durationLabel: formatFieldDuration(durationMs),
    budgetPass,
    totalCounts: recorder.counts,
    entriesKept: recorder.entries.length,
  };
}
