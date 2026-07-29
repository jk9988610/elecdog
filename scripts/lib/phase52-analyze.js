/** Phase 52 — 四层档案整合 EXP+REG+MTB+COOP */

import { beingLayerTransitions } from '../../src/world/profile-stack.js';
import { evoCount } from './event-stats.js';
import { analyzeDualPath } from './phase47-analyze.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(2);
}

export function analyzeProfileStack(recorder, beings, world) {
  const isDual = world.envProfile?.organismMode === 'multicell';
  const base = isDual
    ? analyzeDualPath(recorder, beings, world)
    : {
        aliveTotal: beings.filter((b) => b.alive).length,
        fissCount: evoCount(recorder, 'FISS'),
        fusEventCount: evoCount(recorder, 'FUS'),
      };

  const expN = evoCount(recorder, 'EXP');
  const regN = evoCount(recorder, 'REG');
  const mtbN = evoCount(recorder, 'MTB');
  const coopN = evoCount(recorder, 'COOP');

  return {
    ...base,
    expTransitions: expN,
    regTransitions: regN,
    mtbTransitions: mtbN,
    coopTransitions: coopN,
    totalLayerTransitions: expN + regN + mtbN + coopN,
    meanLayerTransitions: meanField(beings, beingLayerTransitions),
    meanExpTransitions: meanField(beings, (b) => b.expTransitions ?? 0),
    meanRegTransitions: meanField(beings, (b) => b.regTransitions ?? 0),
    meanMtbTransitions: meanField(beings, (b) => b.metTransitions ?? 0),
    meanCoopTransitions: meanField(beings, (b) => b.coopTransitions ?? 0),
  };
}

export function compareStackObserveVsNone(none, observe) {
  const totalDelta = observe.totalLayerTransitions - none.totalLayerTransitions;
  return {
    H1_allLayersFire: {
      verdict:
        observe.expTransitions >= 1 &&
        observe.regTransitions >= 1 &&
        observe.mtbTransitions >= 1 &&
        observe.coopTransitions >= 1
          ? 'support'
          : 'unsupport',
      exp: observe.expTransitions,
      reg: observe.regTransitions,
      mtb: observe.mtbTransitions,
      coop: observe.coopTransitions,
    },
    H2_totalTransitions: {
      verdict: totalDelta >= 200 ? 'support' : totalDelta >= 50 ? 'weak' : 'unsupport',
      none: none.totalLayerTransitions,
      observe: observe.totalLayerTransitions,
      delta: totalDelta,
    },
  };
}

export function compareStackFeedbackVsObserve(observe, feedback) {
  const aliveDelta = (feedback.aliveTotal ?? 0) - (observe.aliveTotal ?? 0);
  const fissDelta = (feedback.fissCount ?? 0) - (observe.fissCount ?? 0);
  return {
    H3_feedbackSurvival: {
      verdict: aliveDelta >= -2 ? 'support' : 'unsupport',
      observe: observe.aliveTotal,
      feedback: feedback.aliveTotal,
      delta: aliveDelta,
    },
    H4_feedbackFiss: {
      verdict: fissDelta >= -4 ? 'support' : 'weak',
      observe: observe.fissCount,
      feedback: feedback.fissCount,
      delta: fissDelta,
    },
    H5_layerCoexist: {
      verdict: feedback.totalLayerTransitions >= observe.totalLayerTransitions * 0.85 ? 'support' : 'weak',
      observe: observe.totalLayerTransitions,
      feedback: feedback.totalLayerTransitions,
    },
  };
}

export function compareStackDual(feedback, dual) {
  const fusDelta = (dual.fusEventCount ?? 0) - (feedback.fusEventCount ?? 0);
  const layerDelta = dual.totalLayerTransitions - feedback.totalLayerTransitions;
  return {
    H6_dualHasFus: {
      verdict: (dual.fusEventCount ?? 0) >= 8 ? 'support' : 'weak',
      dualFus: dual.fusEventCount,
      dualFiss: dual.fissCount,
    },
    H7_stackWithDual: {
      verdict:
        dual.totalLayerTransitions >= 200 &&
        (dual.fissCount ?? 0) + (dual.fusEventCount ?? 0) >= 8
          ? 'support'
          : 'weak',
      layers: dual.totalLayerTransitions,
      repro: (dual.fissCount ?? 0) + (dual.fusEventCount ?? 0),
      layerDelta,
      fusDelta,
    },
  };
}
