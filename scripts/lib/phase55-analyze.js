/** Phase 55 — 电子人层 [EHU] × 四层栈 + RPR */

import { electronicHumanSnapshot } from '../../src/world/electronic-human-profile.js';
import { evoCount } from './event-stats.js';
import { analyzeReproductionPath } from './phase53-analyze.js';

function stageHistogram(beings) {
  const hist = { H0: 0, H1: 0, H2: 0, H3: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const s = b.ehuStage ?? 'H0';
    hist[s] = (hist[s] ?? 0) + 1;
  }
  return hist;
}

export function analyzeElectronicHuman(recorder, beings, world) {
  const rpr = analyzeReproductionPath(recorder, beings, world);

  return {
    ...rpr,
    ehuTransitionCount: evoCount(recorder, 'EHU'),
    ehuStages: stageHistogram(beings),
    meanEhuTransitions: meanField(beings, (b) => b.ehuTransitions ?? 0),
    meanEhuCoherence: meanField(beings, (b) => b.ehuCoherence ?? 0),
    meanEhuDistinction: meanField(beings, (b) => b.ehuDistinction ?? 0),
    meanEhuArc: meanField(beings, (b) => electronicHumanSnapshot(b).arc),
    ehuSnapshots: beings.filter((b) => b.alive).slice(0, 6).map((b) => electronicHumanSnapshot(b)),
  };
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(2);
}

export function compareEhuObserveVsNone(none, observe) {
  return {
    H1_ehuFires: {
      verdict: observe.ehuTransitionCount >= 1 ? 'support' : 'unsupport',
      none: none.ehuTransitionCount,
      observe: observe.ehuTransitionCount,
    },
    H2_stagesTracked: {
      verdict:
        (observe.ehuStages?.H2 ?? 0) + (observe.ehuStages?.H3 ?? 0) >= 4 ? 'support' : 'weak',
      stages: observe.ehuStages,
    },
  };
}

export function compareEhuFeedbackVsObserve(observe, feedback) {
  const h3Delta = (feedback.ehuStages?.H3 ?? 0) - (observe.ehuStages?.H3 ?? 0);
  return {
    H3_feedbackArc: {
      verdict: (feedback.meanEhuArc ?? 0) >= (observe.meanEhuArc ?? 0) ? 'support' : 'weak',
      observeArc: observe.meanEhuArc,
      feedbackArc: feedback.meanEhuArc,
    },
    H4_stackCoexist: {
      verdict: feedback.totalLayerTransitions >= 300 ? 'support' : 'weak',
      layers: feedback.totalLayerTransitions,
      ehu: feedback.ehuTransitionCount,
      rpr: feedback.rprTransitionCount,
    },
  };
}

export function compareEhuNarrative(feedback, narrative) {
  const h3Delta = (narrative.ehuStages?.H3 ?? 0) - (feedback.ehuStages?.H3 ?? 0);
  return {
    H5_narrativeStage: {
      verdict: h3Delta >= 2 ? 'support' : h3Delta >= 0 ? 'weak' : 'unsupport',
      feedbackH3: feedback.ehuStages?.H3 ?? 0,
      narrativeH3: narrative.ehuStages?.H3 ?? 0,
    },
    H6_triPathIntact: {
      verdict: (narrative.fissCount ?? 0) >= 8 && (narrative.fusEventCount ?? 0) >= 8 ? 'support' : 'weak',
      fiss: narrative.fissCount,
      fus: narrative.fusEventCount,
      alive: narrative.aliveTotal,
    },
  };
}
