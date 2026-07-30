/** Phase 106 — 塑形田野 + 留置混合田野 */

import { stepWorld } from '../../src/kernel/engine.js';
import { StatsRecorder } from '../../src/recorder/stats-recorder.js';
import { resetBirthCounters } from '../../src/core/id.js';
import { spawnBeing, spawnCarriedBeing } from '../../src/birth/spawn.js';
import { applyEnvProfile } from '../../src/world/env-profile.js';
import { buildFieldCohort, buildMixedCohort, FIELD_MED_TICKS } from './field-cohort.js';
import { runFieldTicks } from './field-run.js';
import { selectCarrySnapshots } from '../../src/carry/select-carry.js';
import { mergeCarryProvenance } from '../../src/carry/being-snapshot.js';
import { checkFieldRunBudget, formatFieldDuration, getFieldRunMaxMs } from './field-budget.js';
import { FIELD_SHORT_TICKS } from './field-cohort.js';

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
  const sculptProfile = { ...profile, semEnabled: false, semLineageEnabled: false, semFeedbackEnabled: false };
  const carries = selectCarrySnapshots(world, sculptProfile, {
    phase,
    seed,
    treatmentId,
    envId: sculptEnvId,
    sculptTicks,
    chainStage: 'sculpt',
  });

  return { world, recorder, carries };
}

/** Phase 108 — 留置个体 SEM 孵化（仅 carry 队列，跨环境载荷迹） */
export function runCarryIncubationPass({
  createWorld,
  seed,
  phase,
  treatmentId,
  carries,
  profile,
}) {
  if (!carries?.length) return carries;

  resetBirthCounters();
  const world = createWorld(`01-p${phase}-incubate-${seed}`);
  const envId = profile.carryIncubateEnvId ?? 'wisdom_evolution';
  applyEnvProfile(world, envId);
  world.envProfile = {
    ...world.envProfile,
    fieldStatMode: true,
    fieldLiteLog: true,
    semEnabled: true,
    semLineageEnabled: true,
    semFeedbackEnabled: profile.semFeedbackEnabled ?? true,
    semWindow: profile.semWindow ?? 1,
    semMinCount: profile.semMinCount ?? 8,
    ecoFissEnabled: true,
    fissionEnabled: true,
    rplRenewEnabled: false,
    meiEnabled: false,
    fusEnabled: false,
  };

  const recorder = new StatsRecorder();
  recorder.system(0, `[field p${phase} ${treatmentId} incubate seed${seed}]`, { phase, treatmentId, seed });

  carries.forEach((snap, i) => {
    spawnCarriedBeing(world, recorder, snap, {
      cohortTag: 'carry',
      fixedId: `01inc${String(seed)}${String(i + 1).padStart(2, '0')}`,
    });
  });

  const ticks = profile.carryIncubateTicks ?? FIELD_SHORT_TICKS;
  runFieldTicks(world, recorder, ticks);

  const refreshed = selectCarrySnapshots(world, profile, {
    phase,
    seed,
    treatmentId,
    envId,
    chainStage: 'incubate',
    incubateTicks: ticks,
  });

  if (!refreshed.length) return carries;

  return refreshed.map((snap, i) =>
    mergeCarryProvenance(snap, 'incubate', {
      envId,
      tick: ticks,
      priorEnv: carries[i]?.provenance?.envId ?? profile.sculptEnvId,
    })
  );
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
  const needsChain = carryMode !== 'none';

  let carries = carrySnapshots;
  if (needsChain && !carries.length) {
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
    if (profile.carryIncubateSem && carries.length) {
      carries = runCarryIncubationPass({
        createWorld,
        seed,
        phase,
        treatmentId,
        carries,
        profile,
      });
    }
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
