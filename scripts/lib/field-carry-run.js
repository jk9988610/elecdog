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

/** Phase 108+ — 留置链中间环境通行（SEM 孵化 / 富足蓄积等） */
export function runCarryMiddlePass({
  createWorld,
  seed,
  phase,
  treatmentId,
  carries,
  profile,
  passSpec,
}) {
  if (!carries?.length) return carries;

  const {
    stage = 'incubate',
    envId = 'wisdom_evolution',
    ticks = FIELD_SHORT_TICKS,
    semEnabled = false,
    coopEnabled = false,
  } = passSpec;

  resetBirthCounters();
  const world = createWorld(`01-p${phase}-${stage}-${seed}`);
  applyEnvProfile(world, envId);
  world.envProfile = {
    ...world.envProfile,
    fieldStatMode: true,
    fieldLiteLog: true,
    semEnabled: semEnabled === true,
    semLineageEnabled: semEnabled === true,
    semFeedbackEnabled: semEnabled ? (profile.semFeedbackEnabled ?? true) : false,
    semWindow: profile.semWindow ?? 1,
    semMinCount: profile.semMinCount ?? 8,
    cooperationProfileEnabled: coopEnabled === true,
    cooperationFeedback: coopEnabled === true,
    ecoFissEnabled: false,
    fissionEnabled: false,
    rplRenewEnabled: false,
    meiEnabled: false,
    fusEnabled: false,
  };

  const recorder = new StatsRecorder();
  recorder.system(0, `[field p${phase} ${treatmentId} ${stage} seed${seed}]`, { phase, treatmentId, seed, stage });

  carries.forEach((snap, i) => {
    spawnCarriedBeing(world, recorder, snap, {
      cohortTag: 'carry',
      fixedId: `01${stage.slice(0, 3)}${String(seed)}${String(i + 1).padStart(2, '0')}`,
    });
  });

  runFieldTicks(world, recorder, ticks);

  const refreshed = selectCarrySnapshots(world, profile, {
    phase,
    seed,
    treatmentId,
    envId,
    chainStage: stage,
    [`${stage}Ticks`]: ticks,
  });

  if (!refreshed.length) return carries;

  return refreshed.map((snap, i) =>
    mergeCarryProvenance(snap, stage, {
      envId,
      tick: ticks,
      priorEnv: carries[i]?.provenance?.envId ?? profile.sculptEnvId,
    })
  );
}

/** Phase 108 — 留置个体 SEM 孵化（仅 carry 队列，跨环境载荷迹） */
export function runCarryIncubationPass(args) {
  const { profile } = args;
  return runCarryMiddlePass({
    ...args,
    passSpec: {
      stage: 'incubate',
      envId: profile.carryIncubateEnvId ?? 'wisdom_evolution',
      ticks: profile.carryIncubateTicks ?? FIELD_SHORT_TICKS,
      semEnabled: true,
    },
  });
}

/** Phase 112 — 富足场蓄积通行（COOP 社会迹积累） */
export function runCarryAccruePass(args) {
  const { profile } = args;
  return runCarryMiddlePass({
    ...args,
    passSpec: {
      stage: 'accrue',
      envId: profile.carryAccrueEnvId ?? 'fertile_field',
      ticks: profile.carryAccrueTicks ?? FIELD_SHORT_TICKS,
      coopEnabled: profile.carryAccrueCoop !== false,
    },
  });
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
  const probe = createWorld(`01-p${phase}-probe-${seed}`);
  const profile = applyTreatment(probe, treatmentId);
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
    if (profile.carryAccrueEnabled && carries.length) {
      carries = runCarryAccruePass({
        createWorld,
        seed,
        phase,
        treatmentId,
        carries,
        profile,
      });
    }
  }

  resetBirthCounters();
  const world = createWorld(`01-p${phase}-${treatmentId}-${seed}`);
  applyTreatment(world, treatmentId);

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
      chainLen: c.provenance?.chain?.length ?? 0,
      chainEnvs: (c.provenance?.chain ?? []).map((x) => x.envId).filter(Boolean),
    })),
    carrySnapshots: carries.map((c) => ({
      version: c.version ?? 1,
      code: c.code,
      name: c.name,
      dnaSequence: c.dnaSequence,
      generation: c.generation ?? 0,
      registers: c.registers ?? null,
      metProfile: c.metProfile ?? null,
      semTrace: c.semTrace ?? null,
      semTraceWeight: c.semTraceWeight ?? 0,
      organismType: c.organismType ?? 'unicell',
      ecoRepro: c.ecoRepro === true,
      provenance: c.provenance ?? null,
    })),
    cohortSize: cohortSpec.length,
    durationMs,
    durationLabel: formatFieldDuration(durationMs),
    budgetPass,
    totalCounts: recorder.counts,
    entriesKept: recorder.entries.length,
  };
}
