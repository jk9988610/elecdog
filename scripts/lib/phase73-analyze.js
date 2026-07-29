/** Phase 73 — W3 预测误差 [PRD] 记录层 */

import { predictionSnapshot } from '../../src/world/prediction.js';
import { evoCount } from './event-stats.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

function cohortExternalRate(beings, ticks) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length || !ticks) return null;
  const extTicks = alive.reduce((s, b) => s + (b.fieldExtTicks ?? 0), 0);
  return +(extTicks / (alive.length * ticks)).toFixed(4);
}

export function analyzePrediction(recorder, beings, world, { ticks = 1920 } = {}) {
  const alive = beings.filter((b) => b.alive);
  const prdCount = evoCount(recorder, 'PRD');

  return {
    aliveTotal: alive.length,
    prdCount,
    meanLastError: meanField(beings, (b) => b.prdLastError ?? 0),
    meanCumError: meanField(beings, (b) =>
      b.prdErrorCount ? b.prdErrorSum / b.prdErrorCount : 0
    ),
    meanHighErrorTicks: meanField(beings, (b) => b.prdHighErrorTicks ?? 0),
    meanLogCount: meanField(beings, (b) => b.prdLogCount ?? 0),
    externalRate: cohortExternalRate(beings, ticks),
    predictionEnabled: world.envProfile?.predictionEnabled === true,
    snapshots: alive.slice(0, 4).map((b) => predictionSnapshot(b)),
  };
}

export function comparePrdOnVsOff(off, on) {
  const extDelta = Math.abs((on.externalRate ?? 0) - (off.externalRate ?? 0));

  return {
    H1_prdObservable: {
      verdict: on.prdCount >= 50 ? 'support' : on.prdCount >= 10 ? 'weak' : 'unsupport',
      offCount: off.prdCount,
      onCount: on.prdCount,
    },
    H2_errorNonTrivial: {
      verdict: (on.meanCumError ?? 0) >= 0.02 ? 'support' : (on.meanCumError ?? 0) >= 0.01 ? 'weak' : 'unsupport',
      offError: off.meanCumError,
      onError: on.meanCumError,
      onHighTicks: on.meanHighErrorTicks,
    },
    H3_recordOnlyNoBias: {
      verdict: extDelta <= 0.03 ? 'support' : extDelta <= 0.06 ? 'weak' : 'unsupport',
      offExternal: off.externalRate,
      onExternal: on.externalRate,
      delta: +extDelta.toFixed(4),
    },
  };
}

export function verifyPrdFieldBatch(comparisons) {
  const h1Support = comparisons.filter((c) => c.H1_prdObservable.verdict === 'support').length;
  const h2Support = comparisons.filter((c) => c.H2_errorNonTrivial.verdict === 'support').length;
  const h3Support = comparisons.filter((c) => c.H3_recordOnlyNoBias.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support,
    h2Support,
    h3Support,
    verdict:
      h1Support >= 3 && h2Support >= 2
        ? 'support'
        : h1Support + h2Support >= 3
          ? 'weak'
          : 'unsupport',
  };
}
