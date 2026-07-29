/** Phase 94 — GAP-ENV [MIG] patch 迁徙 田野分析 */

import { patchAlt } from '../../src/world/mig.js';

export function analyzeMigField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const migLogs = entries.filter((e) => e.meta?.kind === 'MIG');
  const alive = beings.filter((b) => b.alive);

  const mig = world.mig ?? {};
  const patch = world.place?.patch ?? '00';

  return {
    ticks: ticks ?? null,
    migEnabled: world.envProfile?.migEnabled === true,
    migMoves: mig.moves ?? 0,
    migTaxTotal: +(mig.taxTotal ?? 0).toFixed(4),
    migLogCount: migLogs.length,
    finalPatch: patch,
    patchAlt: patchAlt(patch),
    lastFrom: mig.lastFrom,
    lastTo: mig.lastTo,
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareMigOnOff(offMetrics, onMetrics) {
  const moveDelta = onMetrics.migMoves - offMetrics.migMoves;
  const taxDelta = onMetrics.migTaxTotal - offMetrics.migTaxTotal;
  const patchDelta = onMetrics.finalPatch !== offMetrics.finalPatch ? 1 : 0;
  const logDelta = onMetrics.migLogCount - offMetrics.migLogCount;

  let verdict = 'pending';
  if (moveDelta >= 2 && logDelta >= 2) verdict = 'support';
  else if (moveDelta >= 1 || logDelta >= 1) verdict = 'weak';
  else if (!onMetrics.migEnabled) verdict = 'no_mig';
  else verdict = 'unsupport';

  return { moveDelta, taxDelta, patchDelta, logDelta, finalPatch: onMetrics.finalPatch, verdict };
}

export function verifyPhase94Batch(runsByTreatment) {
  const seeds = runsByTreatment.mig_off_ref?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.mig_off_ref[i]?.metrics;
    const on = runsByTreatment.mig_on_ref[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareMigOnOff(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
  }

  const blockComparisons = [];
  for (let i = 0; i < seeds; i++) {
    const on = runsByTreatment.mig_on_ref[i]?.metrics;
    const block = runsByTreatment.mig_on_block[i]?.metrics;
    if (!on || !block) continue;
    blockComparisons.push({
      seed: i,
      moveDelta: on.migMoves - block.migMoves,
    });
  }

  const migObserved = comparisons.some((c) => c.moveDelta > 0);
  let verdict = 'unsupport';
  if (supportCount >= 3 && migObserved) verdict = 'support';
  else if ((supportCount >= 2 || comparisons.some((c) => c.verdict === 'weak')) && migObserved)
    verdict = 'weak';
  else if (!migObserved) verdict = 'no_mig_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    comparisons,
    blockComparisons,
    migObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'mig_patch_support' : 'mig_record_layer',
  };
}
