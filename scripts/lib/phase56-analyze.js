/** Phase 56 — 六层人格栈 EXP+REG+MTB+COOP+RPR+EHU */

import { beingPersonaTransitions, personaStackSnapshot } from '../../src/world/persona-stack.js';
import { evoCount } from './event-stats.js';
import { analyzeElectronicHuman } from './phase55-analyze.js';

function stageHistogram(beings) {
  const hist = { H0: 0, H1: 0, H2: 0, H3: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const s = b.ehuStage ?? 'H0';
    hist[s] = (hist[s] ?? 0) + 1;
  }
  return hist;
}

export function analyzePersonaStack(recorder, beings, world) {
  const ehu = analyzeElectronicHuman(recorder, beings, world);

  return {
    ...ehu,
    personaTransitionCount: evoCount(recorder, 'EHU') + ehu.rprTransitionCount + ehu.totalLayerTransitions,
    meanPersonaTransitions: meanField(beings, beingPersonaTransitions),
    personaSnapshots: beings.filter((b) => b.alive).slice(0, 6).map((b) => personaStackSnapshot(b)),
  };
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(2);
}

export function comparePersonaObserveVsTri(tri, observe) {
  const layerDelta = (observe.totalLayerTransitions ?? 0) - (tri.totalLayerTransitions ?? 0);
  return {
    H1_sixLayersFire: {
      verdict:
        observe.expTransitions >= 1 &&
        observe.regTransitions >= 1 &&
        observe.mtbTransitions >= 1 &&
        observe.coopTransitions >= 1 &&
        observe.rprTransitionCount >= 1 &&
        observe.ehuTransitionCount >= 1
          ? 'support'
          : 'unsupport',
      exp: observe.expTransitions,
      reg: observe.regTransitions,
      mtb: observe.mtbTransitions,
      coop: observe.coopTransitions,
      rpr: observe.rprTransitionCount,
      ehu: observe.ehuTransitionCount,
    },
    H2_personaArc: {
      verdict: (observe.meanPersonaTransitions ?? 0) >= 80 ? 'support' : 'weak',
      tri: tri.meanPersonaTransitions,
      observe: observe.meanPersonaTransitions,
      layerDelta,
    },
  };
}

export function comparePersonaFeedbackVsObserve(observe, feedback) {
  const personaDelta = (feedback.meanPersonaTransitions ?? 0) - (observe.meanPersonaTransitions ?? 0);
  return {
    H3_feedbackPersona: {
      verdict: personaDelta >= 0 ? 'support' : 'weak',
      observe: observe.meanPersonaTransitions,
      feedback: feedback.meanPersonaTransitions,
      delta: personaDelta,
    },
    H4_triPathIntact: {
      verdict:
        (feedback.fissCount ?? 0) >= 8 && (feedback.fusEventCount ?? 0) >= 8 ? 'support' : 'weak',
      fiss: feedback.fissCount,
      fus: feedback.fusEventCount,
      alive: feedback.aliveTotal,
    },
  };
}

export function comparePersonaCoherence(feedback, coherence) {
  const h3Delta = (coherence.ehuStages?.H3 ?? 0) - (feedback.ehuStages?.H3 ?? 0);
  const ehuDelta = (coherence.ehuTransitionCount ?? 0) - (feedback.ehuTransitionCount ?? 0);
  return {
    H5_coherenceAccel: {
      verdict: ehuDelta >= 2 || h3Delta >= 2 ? 'support' : h3Delta >= 0 ? 'weak' : 'unsupport',
      feedbackEhu: feedback.ehuTransitionCount,
      coherenceEhu: coherence.ehuTransitionCount,
      feedbackH3: feedback.ehuStages?.H3 ?? 0,
      coherenceH3: coherence.ehuStages?.H3 ?? 0,
    },
    H6_personaStable: {
      verdict: coherence.meanPersonaTransitions >= (feedback.meanPersonaTransitions ?? 0) * 0.9 ? 'support' : 'weak',
      feedbackPersona: feedback.meanPersonaTransitions,
      coherencePersona: coherence.meanPersonaTransitions,
    },
  };
}
