/** Phase 48 — 阅历层 [EXP] 积累与行为反馈 */

import { experienceSnapshot } from '../../src/world/experience.js';
import { evoCount } from './event-stats.js';
import { analyzeDualPath } from './phase47-analyze.js';

function stageHistogram(beings) {
  const hist = { E0: 0, E1: 0, E2: 0, E3: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const stage = b.expStage ?? 'E0';
    hist[stage] = (hist[stage] ?? 0) + 1;
  }
  return hist;
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function analyzeExperience(recorder, beings, world) {
  const alive = beings.filter((b) => b.alive);
  const expTransitions = evoCount(recorder, 'EXP');
  const stages = stageHistogram(beings);
  const meanExpAct = meanField(beings, (b) => b.expAct ?? 0);
  const meanExpLoad = meanField(
    beings,
    (b) => (b.expStress ?? 0) + (b.expLow ?? 0) + (b.expSocial ?? 0) + (b.expAct ?? 0)
  );
  const meanTransitions = meanField(beings, (b) => b.expTransitions ?? 0);

  const base =
    world.envProfile?.organismMode === 'multicell'
      ? analyzeDualPath(recorder, beings, world)
      : {
          aliveTotal: alive.length,
          fissCount: evoCount(recorder, 'FISS'),
          meiEventCount: evoCount(recorder, 'MEI'),
          fusEventCount: evoCount(recorder, 'FUS'),
        };

  return {
    ...base,
    expTransitionCount: expTransitions,
    expStages: stages,
    meanExpAct,
    meanExpLoad,
    meanExpTransitions: meanTransitions,
    expSnapshots: alive.slice(0, 6).map((b) => experienceSnapshot(b)),
  };
}

export function compareExpRecordVsNone(noExp, record) {
  return {
    H1_recordHasExp: {
      verdict: record.expTransitionCount >= 1 ? 'support' : 'unsupport',
      noExp: noExp.expTransitionCount,
      record: record.expTransitionCount,
    },
    H2_recordAccumulates: {
      verdict: (record.meanExpLoad ?? 0) >= 0.15 ? 'support' : 'weak',
      noExpLoad: noExp.meanExpLoad,
      recordLoad: record.meanExpLoad,
    },
  };
}

export function compareExpFeedbackVsRecord(record, feedback) {
  const actDelta = (feedback.meanExpAct ?? 0) - (record.meanExpAct ?? 0);
  const e2Delta = (feedback.expStages?.E2 ?? 0) - (record.expStages?.E2 ?? 0);
  return {
    H3_feedbackMoreAct: {
      verdict: actDelta >= 0.04 ? 'support' : actDelta >= 0.01 ? 'weak' : 'unsupport',
      recordAct: record.meanExpAct,
      feedbackAct: feedback.meanExpAct,
      delta: +actDelta.toFixed(4),
    },
    H4_reachesE2: {
      verdict: (feedback.expStages?.E2 ?? 0) >= 2 ? 'support' : (feedback.expStages?.E2 ?? 0) >= 1 ? 'weak' : 'unsupport',
      recordE2: record.expStages?.E2 ?? 0,
      feedbackE2: feedback.expStages?.E2 ?? 0,
      delta: e2Delta,
    },
    H5_stageTransitions: {
      verdict: feedback.expTransitionCount >= record.expTransitionCount ? 'support' : 'weak',
      record: record.expTransitionCount,
      feedback: feedback.expTransitionCount,
    },
  };
}

export function compareExpDual(dual, feedback) {
  return {
    H6_dualStillReproduces: {
      verdict: (dual.fissCount ?? 0) + (dual.fusEventCount ?? 0) >= 8 ? 'support' : 'weak',
      fiss: dual.fissCount,
      fus: dual.fusEventCount,
    },
    H7_dualHasExp: {
      verdict: dual.expTransitionCount >= 1 ? 'support' : 'unsupport',
      transitions: dual.expTransitionCount,
      meanLoad: dual.meanExpLoad,
    },
    H8_coexist: {
      verdict:
        dual.expTransitionCount >= 1 && (dual.fissCount ?? 0) + (dual.fusEventCount ?? 0) >= 1
          ? 'support'
          : 'weak',
      exp: dual.expTransitionCount,
      repro: (dual.fissCount ?? 0) + (dual.fusEventCount ?? 0),
    },
  };
}
