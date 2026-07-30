/** Phase 103 — WL3 SEM × 社会知识正交对照 */

import { analyzeSem, slimSemMetrics } from './phase100-analyze.js';
import { analyzeSocialKnowledge } from './phase75-analyze.js';
import { evoCount } from './event-stats.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function analyzeSemSocOrthogonal(recorder, beings, world, ctx) {
  const sem = analyzeSem(recorder, beings, world, ctx);
  const soc = analyzeSocialKnowledge(recorder, beings, world, ctx);
  return {
    ...sem,
    socEncCount: soc.socEncCount,
    socLinCount: soc.socLinCount,
    meanSocLoad: soc.meanSocLoad,
    meanTraceIntensity: soc.meanTraceIntensity,
    offspringExternalRate: soc.offspringExternalRate,
    semLinCount: evoCount(recorder, 'SEM-LIN'),
    semEnabled: world.envProfile?.semEnabled === true,
    socialKnowledgeEnabled: world.envProfile?.socialKnowledgeEnabled === true,
    meanTraceWeight: meanField(beings, (b) => b.semTraceWeight ?? 0),
  };
}

export { slimSemMetrics };

function semLift(off, on) {
  return {
    cond: (on.top1CondProb ?? 0) - (off.top1CondProb ?? 0),
    pairs: (on.pairKinds ?? 0) - (off.pairKinds ?? 0),
    events: (on.totalPairEvents ?? 0) - (off.totalPairEvents ?? 0),
    trace: (on.meanTraceWeight ?? 0) - (off.meanTraceWeight ?? 0),
  };
}

function socLift(off, on) {
  return {
    enc: (on.socEncCount ?? 0) - (off.socEncCount ?? 0),
    lin: (on.socLinCount ?? 0) - (off.socLinCount ?? 0),
    load: (on.meanSocLoad ?? 0) - (off.meanSocLoad ?? 0),
  };
}

export function compareFactorialCell(metrics) {
  const { offOff, offOn, onOff, onOn } = metrics;
  const semOff = semLift(offOff, onOff);
  const semOn = semLift(offOn, onOn);
  const socOff = socLift(offOff, offOn);
  const socOn = socLift(onOff, onOn);

  const semInteractCond = Math.abs(semOn.cond - semOff.cond);
  const socInteractLoad = Math.abs(socOn.load - socOff.load);

  return {
    H1_semMainEffect: {
      verdict:
        semOff.pairs >= 15 || semOff.events >= 120
          ? 'support'
          : semOff.pairs >= 5 || semOff.events >= 40
            ? 'weak'
            : 'unsupport',
      lift: semOff,
    },
    H2_socMainEffect: {
      verdict:
        socOff.enc >= 12 && socOff.lin >= 2
          ? 'support'
          : socOff.enc >= 5
            ? 'weak'
            : 'unsupport',
      lift: socOff,
    },
    H3_semOrthogonal: {
      verdict:
        semInteractCond <= 0.08 ? 'support' : semInteractCond <= 0.15 ? 'weak' : 'unsupport',
      semLiftSocOff: semOff.cond,
      semLiftSocOn: semOn.cond,
      interaction: +semInteractCond.toFixed(4),
    },
    H4_socOrthogonal: {
      verdict:
        socInteractLoad <= 0.04 ? 'support' : socInteractLoad <= 0.08 ? 'weak' : 'unsupport',
      socLiftSemOff: socOff.load,
      socLiftSemOn: socOn.load,
      interaction: +socInteractLoad.toFixed(4),
    },
    H5_dualOnStable: {
      verdict:
        (onOn.pairKinds ?? 0) >= (onOff.pairKinds ?? 0) * 0.85 &&
        (onOn.socEncCount ?? 0) >= (offOn.socEncCount ?? 0) * 0.85
          ? 'support'
          : (onOn.pairKinds ?? 0) > 0 && (onOn.socEncCount ?? 0) > 0
            ? 'weak'
            : 'unsupport',
      dualPairs: onOn.pairKinds,
      dualSocEnc: onOn.socEncCount,
    },
  };
}

export function verifySemSocOrthogonalBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_semMainEffect.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_socMainEffect.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_semOrthogonal.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_socOrthogonal.verdict === 'support').length;
  const h5 = comparisons.filter((c) => c.H5_dualOnStable.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    h5Support: h5,
    verdict:
      h1 >= 2 && h2 >= 2 && h3 + h4 >= 4 && h5 >= 2
        ? 'support'
        : h1 + h2 + h3 + h4 + h5 >= 10
          ? 'weak'
          : 'unsupport',
  };
}
