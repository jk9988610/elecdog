/** Phase 101 — WL1 [SEM] 反馈偏置层 */

import { semSnapshot } from '../../src/world/sem.js';
import { analyzeSem, slimSemMetrics } from './phase100-analyze.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

function txActRatio(beings) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  const tx = alive.reduce((s, b) => s + (b.fieldTxCount ?? 0), 0);
  const act = alive.reduce((s, b) => s + (b.fieldActCount ?? 0), 0);
  const total = tx + act;
  return total ? +(tx / total).toFixed(4) : null;
}

export function analyzeSemFeedback(recorder, beings, world, ctx) {
  const base = analyzeSem(recorder, beings, world, ctx);
  return {
    ...base,
    meanFbHits: meanField(beings, (b) => b.semFbHits ?? 0),
    txActRatio: txActRatio(beings),
    semFeedbackEnabled: world.envProfile?.semFeedbackEnabled === true,
    snapshots: beings
      .filter((b) => b.alive)
      .slice(0, 4)
      .map((b) => semSnapshot(b)),
  };
}

export { slimSemMetrics };

export function compareSemFeedbackVsRecord(record, feedback) {
  const condRatio =
    (feedback.top1CondProb ?? 0) / Math.max(record.top1CondProb ?? 0, 0.001);
  const extDelta = (feedback.externalRate ?? 0) - (record.externalRate ?? 0);
  const txRatioDelta = (feedback.txActRatio ?? 0) - (record.txActRatio ?? 0);
  const fbHits = feedback.meanFbHits ?? 0;

  return {
    H1_condAmplified: {
      verdict:
        condRatio >= 1.05 ? 'support' : condRatio >= 1.02 ? 'weak' : 'unsupport',
      recordCond: record.top1CondProb,
      feedbackCond: feedback.top1CondProb,
      ratio: +condRatio.toFixed(4),
    },
    H2_txBiasObservable: {
      verdict:
        fbHits >= 5 || Math.abs(txRatioDelta) >= 0.01
          ? 'support'
          : fbHits >= 1 || Math.abs(txRatioDelta) >= 0.003
            ? 'weak'
            : 'unsupport',
      recordTxRatio: record.txActRatio,
      feedbackTxRatio: feedback.txActRatio,
      txRatioDelta: +txRatioDelta.toFixed(4),
      meanFbHits: fbHits,
    },
    H3_semStillObservable: {
      verdict:
        (feedback.semCount ?? 0) >= 50 || (feedback.pairKinds ?? 0) >= 50
          ? 'support'
          : (feedback.semCount ?? 0) >= 10
            ? 'weak'
            : 'unsupport',
      recordSem: record.semCount,
      feedbackSem: feedback.semCount,
    },
    H4_pairEventsGrow: {
      verdict:
        (feedback.totalPairEvents ?? 0) >= (record.totalPairEvents ?? 0) * 1.03
          ? 'support'
          : (feedback.totalPairEvents ?? 0) >= (record.totalPairEvents ?? 0)
            ? 'weak'
            : 'unsupport',
      recordEvents: record.totalPairEvents,
      feedbackEvents: feedback.totalPairEvents,
    },
    H5_noRunawayExt: {
      verdict: Math.abs(extDelta) <= 0.06 ? 'support' : Math.abs(extDelta) <= 0.1 ? 'weak' : 'unsupport',
      recordExternal: record.externalRate,
      feedbackExternal: feedback.externalRate,
      delta: +extDelta.toFixed(4),
    },
  };
}

export function verifySemFeedbackBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_condAmplified.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_txBiasObservable.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_semStillObservable.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_pairEventsGrow.verdict === 'support').length;
  const h5 = comparisons.filter((c) => c.H5_noRunawayExt.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    h5Support: h5,
    verdict:
      h1 >= 2 && h2 >= 2 && h3 >= 3 && h5 >= comparisons.length
        ? 'support'
        : h1 + h2 + h4 >= 4 && h3 >= 2 && h5 >= comparisons.length - 1
          ? 'weak'
          : 'unsupport',
  };
}
