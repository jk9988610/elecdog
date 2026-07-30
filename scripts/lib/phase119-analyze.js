/** Phase 119 — 8192 tick 长时稳健性（turbo + 截止守卫） */

import { analyzeHexaChain, slimCarryChainMetrics } from './phase117-analyze.js';

export function analyzeLongfieldRobustness(recorder, beings, world, ctx) {
  const base = analyzeHexaChain(recorder, beings, world, ctx);
  const alive = beings.filter((b) => b.alive);
  const generations = alive.map((b) => b.generation ?? 0);
  const ticksRequested = ctx?.ticksRequested ?? ctx?.ticks ?? 0;
  const ticksCompleted = ctx?.ticks ?? 0;

  return {
    ...base,
    mixedTicksRequested: ticksRequested,
    mixedTicksCompleted: ticksCompleted,
    tickCompletionRate: ticksRequested ? +(ticksCompleted / ticksRequested).toFixed(4) : null,
    maxGeneration: generations.length ? Math.max(...generations) : 0,
    meanGeneration: alive.length
      ? +(generations.reduce((a, b) => a + b, 0) / alive.length).toFixed(4)
      : 0,
    fieldTurboMode: world.envProfile?.fieldTurboMode === true,
    deadlineHit: ctx?.deadlineHit === true,
    entriesKept: recorder.entries?.length ?? 0,
  };
}

export function verifyLongfieldBatch(byTreatment) {
  const longRuns = byTreatment.ev119_long_8192 ?? [];
  const stdRuns = byTreatment.ev119_std_960 ?? [];

  const longOk = longRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const stdOk = stdRuns.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = longOk.length >= 3 && stdOk.length >= 3;
  const h2 = [...longOk, ...stdOk].every((r) => !r.deadlineHit);
  const h3 = longOk.every((r) => (r.metrics.tickCompletionRate ?? 0) >= 0.95);
  const h4 = longOk.every((r) => (r.metrics.maxChainDepth ?? 0) >= 5);
  const h5 = longOk.every((r) => (r.metrics.aliveTotal ?? 0) >= 8);
  const h6 =
    longOk.length &&
    stdOk.length &&
    longOk.some((r) => (r.metrics.maxGeneration ?? 0) > (stdOk[0]?.metrics?.maxGeneration ?? 0));
  const h7 = [...longOk, ...stdOk].every((r) => (r.metrics.renCount ?? 0) === 0);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1MultiBatchImport: h1,
    h2NoDeadline: h2,
    h3TickComplete: h3,
    h4ChainDepth5: h4,
    h5PopulationAlive: h5,
    h6DeeperEvolution: h6,
    h7NoRen: h7,
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
