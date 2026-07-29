/** Phase 75 — W4 社会知识累积 */

import { socialKnowledgeSnapshot } from '../../src/world/social-knowledge.js';
import { evoCount } from './event-stats.js';

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

function cohortExternalRate(beings, ticks) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length || !ticks) return null;
  const extTicks = alive.reduce((s, b) => s + (b.fieldExtTicks ?? 0), 0);
  return +(extTicks / (alive.length * ticks)).toFixed(4);
}

function offspringExternalRate(beings, ticks) {
  const offspring = beings.filter(
    (b) => b.alive && (b.fissionParent || b.lineageParent || b.socTraceVia)
  );
  if (!offspring.length || !ticks) return null;
  const extTicks = offspring.reduce((s, b) => s + (b.fieldExtTicks ?? 0), 0);
  return +(extTicks / (offspring.length * ticks)).toFixed(4);
}

function seedExternalRate(beings, ticks) {
  const seeds = beings.filter(
    (b) => b.alive && !b.fissionParent && !b.lineageParent && !b.socTraceVia
  );
  if (!seeds.length || !ticks) return null;
  const extTicks = seeds.reduce((s, b) => s + (b.fieldExtTicks ?? 0), 0);
  return +(extTicks / (seeds.length * ticks)).toFixed(4);
}

export function analyzeSocialKnowledge(recorder, beings, world, { ticks = 1920 } = {}) {
  const alive = beings.filter((b) => b.alive);
  const socEncCount = evoCount(recorder, 'SOC-ENC');
  const socLinCount = evoCount(recorder, 'SOC-LIN');
  const withTrace = alive.filter((b) => b.socTrace && (b.socTrace[2] ?? 0) > 0);

  return {
    aliveTotal: alive.length,
    socEncCount,
    socLinCount,
    withTraceCount: withTrace.length,
    meanSocLoad: meanField(beings, (b) => {
      const trace = b.socTrace ?? [0, 0, 0];
      const encode = b.socEncode ?? [0, 0, 0];
      return (trace[2] ?? 0) + (encode[2] ?? 0) * 0.5;
    }),
    meanEncodeIntensity: meanField(beings, (b) => (b.socEncode ?? [0, 0, 0])[2] ?? 0),
    meanTraceIntensity: meanField(beings, (b) => (b.socTrace ?? [0, 0, 0])[2] ?? 0),
    externalRate: cohortExternalRate(beings, ticks),
    offspringExternalRate: offspringExternalRate(beings, ticks),
    seedExternalRate: seedExternalRate(beings, ticks),
    socialKnowledgeEnabled: world.envProfile?.socialKnowledgeEnabled === true,
    snapshots: alive.slice(0, 4).map((b) => socialKnowledgeSnapshot(b)),
  };
}

export function compareSocOnVsOff(off, on) {
  const extDelta = (on.externalRate ?? 0) - (off.externalRate ?? 0);
  const offspringDelta = (on.offspringExternalRate ?? 0) - (on.seedExternalRate ?? 0);
  const offOffspringGap =
    (off.offspringExternalRate ?? 0) - (off.seedExternalRate ?? 0);

  return {
    H1_socEncObservable: {
      verdict: on.socEncCount >= 40 ? 'support' : on.socEncCount >= 15 ? 'weak' : 'unsupport',
      offCount: off.socEncCount,
      onCount: on.socEncCount,
    },
    H2_inheritanceEvents: {
      verdict: on.socLinCount >= 8 ? 'support' : on.socLinCount >= 3 ? 'weak' : 'unsupport',
      offCount: off.socLinCount,
      onCount: on.socLinCount,
    },
    H3_behaviorModulated: {
      verdict:
        Math.abs(extDelta) >= 0.003 ? 'support' : Math.abs(extDelta) >= 0.001 ? 'weak' : 'unsupport',
      offExternal: off.externalRate,
      onExternal: on.externalRate,
      delta: +extDelta.toFixed(4),
    },
    H4_offspringDifference: {
      verdict:
        Math.abs(offspringDelta) >= 0.004 && Math.abs(offspringDelta) > Math.abs(offOffspringGap)
          ? 'support'
          : Math.abs(offspringDelta) >= 0.002
            ? 'weak'
            : 'unsupport',
      onOffspring: on.offspringExternalRate,
      onSeed: on.seedExternalRate,
      offOffspring: off.offspringExternalRate,
      offSeed: off.seedExternalRate,
      delta: +(offspringDelta ?? 0).toFixed(4),
    },
  };
}

export function verifySocFieldBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_socEncObservable.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_inheritanceEvents.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_behaviorModulated.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_offspringDifference.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    verdict:
      h1 >= 3 && h2 >= 2 && (h3 >= 2 || h4 >= 2)
        ? 'support'
        : h1 + h2 + h3 + h4 >= 6
          ? 'weak'
          : 'unsupport',
  };
}
