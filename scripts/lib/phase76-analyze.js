/** Phase 76 — W4 谱系记忆回响 */

import { memLineageSnapshot } from '../../src/world/lineage-memory.js';
import { memoryFeedbackSnapshot } from '../../src/world/memory-feedback.js';
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

function echoOffspringExternalRate(beings, ticks) {
  const offspring = beings.filter((b) => b.alive && b.memEchoVia);
  if (!offspring.length || !ticks) return null;
  const extTicks = offspring.reduce((s, b) => s + (b.fieldExtTicks ?? 0), 0);
  return +(extTicks / (offspring.length * ticks)).toFixed(4);
}

function seedExternalRate(beings, ticks) {
  const seeds = beings.filter((b) => b.alive && !b.memEchoVia);
  if (!seeds.length || !ticks) return null;
  const extTicks = seeds.reduce((s, b) => s + (b.fieldExtTicks ?? 0), 0);
  return +(extTicks / (seeds.length * ticks)).toFixed(4);
}

export function analyzeMemLineageEcho(recorder, beings, world, { ticks = 1920 } = {}) {
  const alive = beings.filter((b) => b.alive);
  const memLinCount = evoCount(recorder, 'MEM-LIN');
  const withEcho = alive.filter((b) => b.memEchoVia);

  return {
    aliveTotal: alive.length,
    memLinCount,
    withEchoCount: withEcho.length,
    meanEchoAct: meanField(beings, (b) => b.memEchoAct ?? 0),
    meanMemLoad: meanField(beings, (b) => {
      const snap = memoryFeedbackSnapshot(b);
      return (snap.memRxLoad ?? 0) + (snap.memTxLoad ?? 0) * 0.5 + (snap.memActLoad ?? 0);
    }),
    externalRate: cohortExternalRate(beings, ticks),
    echoOffspringRate: echoOffspringExternalRate(beings, ticks),
    seedExternalRate: seedExternalRate(beings, ticks),
    memLineageEchoEnabled: world.envProfile?.memLineageEchoEnabled === true,
    snapshots: alive.slice(0, 4).map((b) => ({
      mem: memoryFeedbackSnapshot(b),
      echo: memLineageSnapshot(b),
    })),
  };
}

export function compareMemEchoOnVsOff(off, on) {
  const extDelta = (on.externalRate ?? 0) - (off.externalRate ?? 0);
  const echoGap = (on.echoOffspringRate ?? 0) - (on.seedExternalRate ?? 0);
  const echoVsSeed = Math.abs(echoGap);

  return {
    H1_memLinObservable: {
      verdict: on.memLinCount >= 6 ? 'support' : on.memLinCount >= 2 ? 'weak' : 'unsupport',
      offCount: off.memLinCount,
      onCount: on.memLinCount,
    },
    H2_echoSeeded: {
      verdict:
        (on.withEchoCount ?? 0) >= 2 && (on.meanEchoAct ?? 0) >= 0.02
          ? 'support'
          : (on.withEchoCount ?? 0) >= 1
            ? 'weak'
            : 'unsupport',
      offWithEcho: off.withEchoCount,
      onWithEcho: on.withEchoCount,
      onMeanEchoAct: on.meanEchoAct,
    },
    H3_w1BehaviorLinked: {
      verdict:
        Math.abs(extDelta) >= 0.002 ? 'support' : Math.abs(extDelta) >= 0.0008 ? 'weak' : 'unsupport',
      offExternal: off.externalRate,
      onExternal: on.externalRate,
      delta: +extDelta.toFixed(4),
    },
    H4_offspringEchoDiff: {
      verdict:
        on.echoOffspringRate != null &&
        on.seedExternalRate != null &&
        echoVsSeed >= 0.01
          ? 'support'
          : echoVsSeed >= 0.005
            ? 'weak'
            : 'unsupport',
      onEcho: on.echoOffspringRate,
      onSeed: on.seedExternalRate,
      delta: +(echoGap ?? 0).toFixed(4),
    },
  };
}

export function verifyMemEchoFieldBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_memLinObservable.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_echoSeeded.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_w1BehaviorLinked.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_offspringEchoDiff.verdict === 'support').length;

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
