/** Phase 89 — GAP-ORG FUS [SYM] module 田野分析 */

import { countActiveSymModules } from '../../src/world/sym.js';

export function analyzeSymField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const fus = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FUS');
  const captures = entries.filter((e) => e.meta?.kind === 'SYM' && e.meta?.phase === 'capture');
  const modEvents = entries.filter((e) => e.meta?.kind === 'SYM' && e.meta?.phase === 'module');

  const alive = beings.filter((b) => b.alive);
  const withModules = alive.filter((b) => (b.symModules?.length ?? 0) > 0);
  const symFlux = beings.reduce((s, b) => s + (b.symFluxTotal ?? 0), 0);
  const capturesTotal = world.symCaptureTotal ?? beings.reduce((s, b) => s + (b.symCaptureCount ?? 0), 0);

  return {
    ticks: ticks ?? null,
    symCaptureEnabled: world.envProfile?.symCaptureEnabled === true,
    synthEnabled: world.envProfile?.synthEnabled === true,
    fusCount: fus.length,
    symCaptureCount: capturesTotal,
    symCaptureLog: captures.length,
    symModuleEvents: modEvents.length,
    symFluxTotal: +symFlux.toFixed(4),
    beingsWithModules: withModules.length,
    activeModules: countActiveSymModules(beings),
    endCount: ends.length,
    aliveCount: alive.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function compareSymOnOff(offMetrics, onMetrics) {
  const captureDelta = onMetrics.symCaptureCount - offMetrics.symCaptureCount;
  const moduleDelta = onMetrics.beingsWithModules - offMetrics.beingsWithModules;
  const fluxDelta = onMetrics.symFluxTotal - offMetrics.symFluxTotal;

  let verdict = 'pending';
  if (captureDelta >= 1 && moduleDelta >= 1) verdict = 'support';
  else if (captureDelta >= 1 || fluxDelta > 0.1) verdict = 'weak';
  else if (onMetrics.symCaptureEnabled && captureDelta <= 0) verdict = 'no_capture';
  else verdict = 'unsupport';

  return { captureDelta, moduleDelta, fluxDelta, fusOn: onMetrics.fusCount, verdict };
}

export function verifyPhase89Batch(runsByTreatment) {
  const seeds = runsByTreatment.sym_off_fus?.length ?? 0;
  const comparisons = [];
  let supportCount = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.sym_off_fus[i]?.metrics;
    const on = runsByTreatment.sym_on_fus[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareSymOnOff(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') supportCount++;
  }

  const boostComparisons = [];
  for (let i = 0; i < seeds; i++) {
    const base = runsByTreatment.sym_on_fus[i]?.metrics;
    const boost = runsByTreatment.sym_on_boost[i]?.metrics;
    if (!base || !boost) continue;
    boostComparisons.push({
      seed: i,
      captureDelta: boost.symCaptureCount - base.symCaptureCount,
      fusDelta: boost.fusCount - base.fusCount,
    });
  }

  const symObserved = comparisons.some((c) => c.captureDelta > 0);
  let verdict = 'unsupport';
  if (supportCount >= 3 && symObserved) verdict = 'support';
  else if ((supportCount >= 2 || comparisons.some((c) => c.verdict === 'weak')) && symObserved)
    verdict = 'weak';
  else if (!symObserved) verdict = 'no_sym_observed';

  return {
    seedsCompared: comparisons.length,
    supportCount,
    comparisons,
    boostComparisons,
    symObserved,
    verdict,
    gapOrgStatus: verdict === 'support' ? 'sym_fus_support' : 'sym_capture_layer',
  };
}
