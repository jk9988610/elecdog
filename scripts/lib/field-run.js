/** 田野统计运行 — 无仪式、聚合记录、多样本群体 */

import { stepWorld } from '../../src/kernel/engine.js';
import { StatsRecorder } from '../../src/recorder/stats-recorder.js';
import { resetBirthCounters } from '../../src/core/id.js';
import { spawnBeing } from '../../src/birth/spawn.js';
import { buildFieldCohort, buildQuadChainCohort, buildPairCohort, FIELD_TICKS } from './field-cohort.js';
import { checkFieldRunBudget, formatFieldDuration, getFieldRunMaxMs, createFieldDeadline } from './field-budget.js';
import { runFieldTicks } from './field-ticks.js';

export { runFieldTicks } from './field-ticks.js';

export function initFieldWorld(world, { phase, treatmentId, seed, ticks = FIELD_TICKS, cohort = 'default' } = {}) {
  world.envProfile.fieldLiteLog = true;
  world.envProfile.fieldStatMode = true;
  const recorder = new StatsRecorder();
  recorder.system(0, `[field p${phase ?? '?'} ${treatmentId} seed${seed}]`, { phase, treatmentId, seed });
  const cohortSpec =
    cohort === 'pair' || world.envProfile.cohort === 'pair'
      ? buildPairCohort(seed)
      : cohort === 'quad' || world.envProfile.cohort === 'quad'
        ? buildQuadChainCohort(seed)
        : buildFieldCohort(seed);
  for (const spec of cohortSpec) {
    spawnBeing(world, recorder, { ...spec, cohortTag: spec.cohortTag ?? 'naive', pairMorph: spec.pairMorph });
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
  enforceBudget = true,
}) {
  const startedAt = performance.now();
  const deadline = createFieldDeadline(getFieldRunMaxMs(), startedAt);
  resetBirthCounters();
  const world = createWorld(`01-p${phase}-${treatmentId}-${seed}`);
  applyTreatment(world, treatmentId);
  const { recorder, cohort, cohortIds } = initFieldWorld(world, { phase, treatmentId, seed, ticks });
  const label = `${treatmentId} seed${seed}`;
  const tickResult = runFieldTicks(world, recorder, ticks, {
    label,
    deadline,
    onProgress: (tick, total, lbl) => {
      process.stdout.write(`    ${lbl} tick ${tick}/${total}\n`);
      onProgress?.(tick, total, lbl);
    },
  });
  const metrics = analyze(recorder, world.beings, world, {
    cohortIds,
    ticks: tickResult.ticksCompleted,
    ticksRequested: ticks,
    deadlineHit: tickResult.deadlineHit,
  });
  const durationMs = performance.now() - startedAt;
  const maxMs = getFieldRunMaxMs();
  const budgetPass = durationMs <= maxMs;
  if (enforceBudget && !budgetPass) {
    checkFieldRunBudget(durationMs, { label, phase });
  }
  return {
    treatmentId,
    seed,
    phase,
    metrics,
    cohortSize: cohort.length,
    cohortIds,
    durationMs,
    durationLabel: formatFieldDuration(durationMs),
    budgetPass,
    deadlineHit: tickResult.deadlineHit,
    tickCapHit: tickResult.tickCapHit,
    ticksCompleted: tickResult.ticksCompleted,
    ticksRequested: tickResult.ticksRequested,
    totalCounts: recorder.counts,
    entriesKept: recorder.entries.length,
  };
}
