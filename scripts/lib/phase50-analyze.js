/** Phase 50 — 代谢通道层 [MTB] 摄取分布 */

import { metabolicSnapshot } from '../../src/world/metabolic-profile.js';
import { evoCount } from './event-stats.js';

function profileHistogram(beings) {
  const hist = { N0: 0, DOM: 0, BAL: 0, SCAR: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const p = b.metProfile ?? 'N0';
    hist[p] = (hist[p] ?? 0) + 1;
  }
  return hist;
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function analyzeMetabolicLayer(recorder, beings, world) {
  const alive = beings.filter((b) => b.alive);
  const mtbTransitions = evoCount(recorder, 'MTB');
  const profiles = profileHistogram(beings);
  const meanDrawTotal = meanField(beings, (b) => b.metDrawTotal ?? 0);
  const meanDomShare = meanField(beings, (b) => {
    const draws = b.metDrawByChannel ?? [];
    const sum = draws.reduce((a, x) => a + x, 0) || 1;
    return draws[b.metDominantIdx ?? 0] / sum;
  });
  const meanLowTotal = meanField(beings, (b) =>
    (b.metLowByChannel ?? []).reduce((a, x) => a + x, 0)
  );

  return {
    aliveTotal: alive.length,
    fissCount: evoCount(recorder, 'FISS'),
    mtbTransitionCount: mtbTransitions,
    metProfiles: profiles,
    meanDrawTotal,
    meanDomShare,
    meanLowTotal,
    meanMtbTransitions: meanField(beings, (b) => b.metTransitions ?? 0),
    mtbSnapshots: alive.slice(0, 6).map((b) => metabolicSnapshot(b)),
  };
}

export function compareMtbObserveVsNone(noMtb, observe) {
  return {
    H1_observeHasMtb: {
      verdict: observe.mtbTransitionCount >= 1 ? 'support' : 'unsupport',
      noMtb: noMtb.mtbTransitionCount,
      observe: observe.mtbTransitionCount,
    },
    H2_domChannelObservable: {
      verdict: (observe.meanDomShare ?? 0) >= 0.35 ? 'support' : 'weak',
      domShare: observe.meanDomShare,
      profiles: observe.metProfiles,
    },
  };
}

export function compareMtbFeedbackVsObserve(observe, feedback) {
  const domDelta = (feedback.meanDomShare ?? 0) - (observe.meanDomShare ?? 0);
  const scarDelta = (feedback.metProfiles?.SCAR ?? 0) - (observe.metProfiles?.SCAR ?? 0);
  return {
    H3_feedbackMoreDom: {
      verdict: domDelta >= 0.05 ? 'support' : domDelta >= 0 ? 'weak' : 'unsupport',
      observe: observe.meanDomShare,
      feedback: feedback.meanDomShare,
      delta: +domDelta.toFixed(4),
    },
    H4_scarProfile: {
      verdict: (feedback.metProfiles?.SCAR ?? 0) >= 1 ? 'support' : 'weak',
      observeScar: observe.metProfiles?.SCAR ?? 0,
      feedbackScar: feedback.metProfiles?.SCAR ?? 0,
      delta: scarDelta,
    },
    H5_noResourceLabels: {
      verdict: 'support',
      note: '仅通道索引 e0–e7 分布，无资源类型命名',
    },
  };
}

export function compareHarshMtb(fertile, harsh) {
  const scarDelta = (harsh.metProfiles?.SCAR ?? 0) - (fertile.metProfiles?.SCAR ?? 0);
  return {
    H6_harshMoreScar: {
      verdict: scarDelta >= 6 ? 'support' : scarDelta >= 2 ? 'weak' : 'unsupport',
      fertile: fertile.metProfiles?.SCAR ?? 0,
      harsh: harsh.metProfiles?.SCAR ?? 0,
      delta: scarDelta,
    },
    H7_harshStillDraws: {
      verdict: (harsh.meanDrawTotal ?? 0) >= 100 ? 'support' : 'weak',
      fertileDraws: fertile.meanDrawTotal,
      harshDraws: harsh.meanDrawTotal,
    },
  };
}
