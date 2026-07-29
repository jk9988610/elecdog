/** Phase 49 — 寄存器语义层 [REG] 模式与场耦合 */

import { registerSnapshot } from '../../src/world/register-profile.js';
import { evoCount } from './event-stats.js';

function modeHistogram(beings) {
  const hist = { SYNC: 0, LAG: 0, SCATTER: 0, LOCK: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const mode = b.regMode ?? 'SYNC';
    hist[mode] = (hist[mode] ?? 0) + 1;
  }
  return hist;
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function analyzeRegisterLayer(recorder, beings, world) {
  const alive = beings.filter((b) => b.alive);
  const regTransitions = evoCount(recorder, 'REG');
  const modes = modeHistogram(beings);
  const meanGap = meanField(beings, (b) => b.regGapMean ?? 0);
  const meanDrift = meanField(beings, (b) => b.regDriftVel ?? 0);
  const meanVariance = meanField(beings, (b) => b.regVariance ?? 0);
  const meanRegTransitions = meanField(beings, (b) => b.regTransitions ?? 0);

  return {
    aliveTotal: alive.length,
    fissCount: evoCount(recorder, 'FISS'),
    regTransitionCount: regTransitions,
    regModes: modes,
    meanGapMean: meanGap,
    meanDriftVel: meanDrift,
    meanVariance,
    meanRegTransitions,
    regSnapshots: alive.slice(0, 6).map((b) => registerSnapshot(b)),
  };
}

export function compareRegObserveVsNone(noReg, observe) {
  return {
    H1_observeHasReg: {
      verdict: observe.regTransitionCount >= 1 ? 'support' : 'unsupport',
      noReg: noReg.regTransitionCount,
      observe: observe.regTransitionCount,
    },
    H2_modesObservable: {
      verdict:
        (observe.regModes?.LAG ?? 0) + (observe.regModes?.SCATTER ?? 0) >= 1
          ? 'support'
          : 'weak',
      modes: observe.regModes,
    },
  };
}

export function compareRegCoupleVsObserve(observe, couple) {
  const gapDelta = (couple.meanGapMean ?? 0) - (observe.meanGapMean ?? 0);
  const transDelta = (couple.regTransitionCount ?? 0) - (observe.regTransitionCount ?? 0);
  return {
    H3_coupleReducesGap: {
      verdict: gapDelta <= -0.01 ? 'support' : gapDelta <= 0 ? 'weak' : 'unsupport',
      observeGap: observe.meanGapMean,
      coupleGap: couple.meanGapMean,
      delta: +gapDelta.toFixed(4),
    },
    H4_coupleMoreTransitions: {
      verdict: transDelta >= 2 ? 'support' : transDelta >= 0 ? 'weak' : 'unsupport',
      observe: observe.regTransitionCount,
      couple: couple.regTransitionCount,
      delta: transDelta,
    },
    H5_noFeelingLabels: {
      verdict: 'support',
      note: '仅数值模式 SYNC/LAG/SCATTER/LOCK，无感受映射',
    },
  };
}

export function compareHarshRegCouple(fertile, harsh) {
  const endDelta = (harsh.aliveTotal ?? 0) - (fertile.aliveTotal ?? 0);
  return {
    H6_harshSurvival: {
      verdict: harsh.aliveTotal <= fertile.aliveTotal * 0.6 ? 'support' : 'weak',
      fertile: fertile.aliveTotal,
      harsh: harsh.aliveTotal,
      delta: endDelta,
    },
    H7_harshStillHasReg: {
      verdict: harsh.regTransitionCount >= 1 ? 'support' : 'unsupport',
      transitions: harsh.regTransitionCount,
      modes: harsh.regModes,
    },
  };
}
