/** Phase 51 — 社会合作层 [COOP] */

import { cooperationSnapshot } from '../../src/world/cooperation-profile.js';
import { evoCount } from './event-stats.js';

function modeHistogram(beings) {
  const hist = { S0: 0, SOLO: 0, MESH: 0, RIVAL: 0, ECHO: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const m = b.coopMode ?? 'S0';
    hist[m] = (hist[m] ?? 0) + 1;
  }
  return hist;
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function analyzeCooperationLayer(recorder, beings, world) {
  const alive = beings.filter((b) => b.alive);
  const coopTransitions = evoCount(recorder, 'COOP');
  const modes = modeHistogram(beings);
  const meanCrossRx = meanField(beings, (b) => b.socCrossRx ?? 0);
  const meanContest = meanField(beings, (b) => b.socContest ?? 0);
  const meanSocTotal = meanField(
    beings,
    (b) => (b.socRx ?? 0) + (b.socTx ?? 0) + (b.socAct ?? 0) + (b.socContest ?? 0)
  );

  return {
    aliveTotal: alive.length,
    fissCount: evoCount(recorder, 'FISS'),
    coopTransitionCount: coopTransitions,
    coopModes: modes,
    meanCrossRx,
    meanContest,
    meanSocTotal,
    meanCoopTransitions: meanField(beings, (b) => b.coopTransitions ?? 0),
    coopSnapshots: alive.slice(0, 6).map((b) => cooperationSnapshot(b)),
  };
}

export function compareCoopObserveVsNone(noCoop, observe) {
  return {
    H1_observeHasCoop: {
      verdict: observe.coopTransitionCount >= 1 ? 'support' : 'unsupport',
      noCoop: noCoop.coopTransitionCount,
      observe: observe.coopTransitionCount,
    },
    H2_meshOrRival: {
      verdict:
        (observe.coopModes?.MESH ?? 0) + (observe.coopModes?.RIVAL ?? 0) >= 4
          ? 'support'
          : 'weak',
      modes: observe.coopModes,
    },
  };
}

export function compareCoopFeedbackVsObserve(observe, feedback) {
  const crossDelta = (feedback.meanCrossRx ?? 0) - (observe.meanCrossRx ?? 0);
  const meshDelta = (feedback.coopModes?.MESH ?? 0) - (observe.coopModes?.MESH ?? 0);
  return {
    H3_feedbackMoreCrossRx: {
      verdict: crossDelta >= 5 ? 'support' : crossDelta >= 1 ? 'weak' : 'unsupport',
      observe: observe.meanCrossRx,
      feedback: feedback.meanCrossRx,
      delta: +crossDelta.toFixed(4),
    },
    H4_moreMesh: {
      verdict: meshDelta >= 3 ? 'support' : meshDelta >= 0 ? 'weak' : 'unsupport',
      observeMesh: observe.coopModes?.MESH ?? 0,
      feedbackMesh: feedback.coopModes?.MESH ?? 0,
    },
    H5_noRoleNames: {
      verdict: 'support',
      note: '仅社会迹聚合模式，非角色/联盟命名',
    },
  };
}

export function compareCoopDense(feedback, dense) {
  const contestDelta = (dense.meanContest ?? 0) - (feedback.meanContest ?? 0);
  const rivalDelta = (dense.coopModes?.RIVAL ?? 0) - (feedback.coopModes?.RIVAL ?? 0);
  return {
    H6_denseMoreContest: {
      verdict: contestDelta >= 2 ? 'support' : contestDelta >= 0.5 ? 'weak' : 'unsupport',
      feedback: feedback.meanContest,
      dense: dense.meanContest,
      delta: +contestDelta.toFixed(4),
    },
    H7_denseMoreRival: {
      verdict: rivalDelta >= 4 ? 'support' : rivalDelta >= 1 ? 'weak' : 'unsupport',
      feedbackRival: feedback.coopModes?.RIVAL ?? 0,
      denseRival: dense.coopModes?.RIVAL ?? 0,
    },
  };
}
