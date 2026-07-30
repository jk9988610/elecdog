/** Phase 102 — WL2 [SEM-LIN] 谱系约定持久 */

import { semLineageSnapshot } from '../../src/world/sem-lineage.js';
import { analyzeSemFeedback, slimSemMetrics } from './phase101-analyze.js';
import { evoCount } from './event-stats.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

function offspringWithTrace(beings) {
  return beings.filter((b) => b.alive && b.semTraceVia);
}

export function analyzeSemLineage(recorder, beings, world, ctx) {
  const base = analyzeSemFeedback(recorder, beings, world, ctx);
  const offspring = offspringWithTrace(beings);

  return {
    ...base,
    semLinCount: evoCount(recorder, 'SEM-LIN'),
    withTraceCount: offspring.length,
    meanTraceWeight: meanField(beings, (b) => b.semTraceWeight ?? 0),
    offspringTraceWeight: meanField(offspring, (b) => b.semTraceWeight ?? 0),
    semLineageEnabled: world.envProfile?.semLineageEnabled === true,
    snapshots: beings
      .filter((b) => b.alive)
      .slice(0, 4)
      .map((b) => ({ ...semLineageSnapshot(b), fbHits: b.semFbHits ?? 0 })),
  };
}

export { slimSemMetrics };

export function compareSemLinOnVsOff(off, on) {
  const condRatio =
    (on.top1CondProb ?? 0) / Math.max(off.top1CondProb ?? 0, 0.001);
  const extDelta = (on.externalRate ?? 0) - (off.externalRate ?? 0);
  const traceDelta = (on.meanTraceWeight ?? 0) - (off.meanTraceWeight ?? 0);

  return {
    H1_semLinObservable: {
      verdict: on.semLinCount >= 4 ? 'support' : on.semLinCount >= 1 ? 'weak' : 'unsupport',
      offCount: off.semLinCount,
      onCount: on.semLinCount,
    },
    H2_traceSeeded: {
      verdict:
        (on.withTraceCount ?? 0) >= 2 && (on.offspringTraceWeight ?? 0) >= 0.1
          ? 'support'
          : (on.withTraceCount ?? 0) >= 1
            ? 'weak'
            : 'unsupport',
      offWithTrace: off.withTraceCount,
      onWithTrace: on.withTraceCount,
      onOffspringWeight: on.offspringTraceWeight,
    },
    H3_condPersist: {
      verdict: condRatio >= 1.03 ? 'support' : condRatio >= 1.01 ? 'weak' : 'unsupport',
      offCond: off.top1CondProb,
      onCond: on.top1CondProb,
      ratio: +condRatio.toFixed(4),
    },
    H4_traceWeightHigher: {
      verdict: traceDelta >= 0.05 ? 'support' : traceDelta >= 0.01 ? 'weak' : 'unsupport',
      offWeight: off.meanTraceWeight,
      onWeight: on.meanTraceWeight,
      delta: +traceDelta.toFixed(4),
    },
    H5_noRunawayExt: {
      verdict: Math.abs(extDelta) <= 0.06 ? 'support' : Math.abs(extDelta) <= 0.1 ? 'weak' : 'unsupport',
      offExternal: off.externalRate,
      onExternal: on.externalRate,
      delta: +extDelta.toFixed(4),
    },
  };
}

export function verifySemLineageBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_semLinObservable.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_traceSeeded.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_condPersist.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_traceWeightHigher.verdict === 'support').length;
  const h5 = comparisons.filter((c) => c.H5_noRunawayExt.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    h5Support: h5,
    verdict:
      h1 >= 3 && h2 >= 2 && h5 >= comparisons.length && (h3 >= 2 || h4 >= 2)
        ? 'support'
        : h1 + h2 + h3 + h4 >= 5 && h5 >= comparisons.length - 1
          ? 'weak'
          : 'unsupport',
  };
}
