/** Phase 74 — W3 预测误差校正反馈 */

import { predictionSnapshot } from '../../src/world/prediction.js';
import { evoCount } from './event-stats.js';
import { analyzePrediction } from './phase73-analyze.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function analyzePredictionFeedback(recorder, beings, world, ctx) {
  const base = analyzePrediction(recorder, beings, world, ctx);
  return {
    ...base,
    meanLateError: meanField(beings, (b) =>
      b.prdLateErrorCount ? b.prdLateErrorSum / b.prdLateErrorCount : null
    ),
    meanLateTrend: meanField(beings, (b) => {
      const early = b.prdLateEarlyCount ? b.prdLateEarlySum / b.prdLateEarlyCount : null;
      const late = b.prdLateLateCount ? b.prdLateLateSum / b.prdLateLateCount : null;
      return early != null && late != null ? late - early : null;
    }),
    predictionFeedbackEnabled: world.envProfile?.predictionFeedbackEnabled === true,
    snapshots: beings
      .filter((b) => b.alive)
      .slice(0, 4)
      .map((b) => predictionSnapshot(b)),
  };
}

export function comparePrdFeedbackVsRecord(record, feedback) {
  const lateDelta = (feedback.meanLateError ?? 0) - (record.meanLateError ?? 0);
  const trendDelta = (feedback.meanLateTrend ?? 0) - (record.meanLateTrend ?? 0);
  const extDelta = (feedback.externalRate ?? 0) - (record.externalRate ?? 0);
  const highDelta = (feedback.meanHighErrorTicks ?? 0) - (record.meanHighErrorTicks ?? 0);

  return {
    H1_lateErrorLower: {
      verdict:
        lateDelta <= -0.0005 || trendDelta <= -0.0005
          ? 'support'
          : trendDelta <= 0 || lateDelta <= 0
            ? 'weak'
            : 'unsupport',
      recordLate: record.meanLateError,
      feedbackLate: feedback.meanLateError,
      recordTrend: record.meanLateTrend,
      feedbackTrend: feedback.meanLateTrend,
      delta: +lateDelta.toFixed(4),
      trendDelta: +trendDelta.toFixed(4),
    },
    H2_behaviorModulated: {
      verdict: Math.abs(extDelta) >= 0.003 ? 'support' : Math.abs(extDelta) >= 0.001 ? 'weak' : 'unsupport',
      recordExternal: record.externalRate,
      feedbackExternal: feedback.externalRate,
      delta: +extDelta.toFixed(4),
    },
    H3_highErrorReduced: {
      verdict: highDelta <= -0.01 ? 'support' : highDelta <= 0 ? 'weak' : 'unsupport',
      recordHigh: record.meanHighErrorTicks,
      feedbackHigh: feedback.meanHighErrorTicks,
      delta: +highDelta.toFixed(4),
    },
    H4_prdStillObservable: {
      verdict: feedback.prdCount >= 50 ? 'support' : feedback.prdCount >= 10 ? 'weak' : 'unsupport',
      recordPrd: record.prdCount,
      feedbackPrd: feedback.prdCount,
    },
  };
}

export function verifyPrdFeedbackBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_lateErrorLower.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_behaviorModulated.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_highErrorReduced.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_prdStillObservable.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    verdict:
      (h1 >= 2 || h3 >= 2) && h4 >= 3
        ? 'support'
        : h1 + h2 + h3 >= 4 && h4 >= 3
          ? 'weak'
          : 'unsupport',
  };
}
