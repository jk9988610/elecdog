/** Phase 77 — W5 长时开放演化田野 */

import { evoCount } from './event-stats.js';
import { beingPersonaTransitions } from '../../src/world/persona-stack.js';

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

export function analyzeWisdomOpenField(recorder, beings, world, { ticks = 1920 } = {}) {
  const alive = beings.filter((b) => b.alive);
  const modes = new Set(alive.map((b) => b.coopMode ?? 'S0'));
  const generations = alive.map((b) => b.generation ?? 0);

  return {
    ticks,
    aliveTotal: alive.length,
    maxGeneration: generations.length ? Math.max(...generations) : 0,
    meanGeneration: meanField(beings, (b) => b.generation ?? 0),
    prdCount: evoCount(recorder, 'PRD'),
    socEncCount: evoCount(recorder, 'SOC-ENC'),
    memLinCount: evoCount(recorder, 'MEM-LIN'),
    coopCount: evoCount(recorder, 'COOP'),
    ehuCount: evoCount(recorder, 'EHU'),
    modeDiversity: modes.size,
    externalRate: cohortExternalRate(beings, ticks),
    meanPersonaTransitions: meanField(beings, (b) => beingPersonaTransitions(b)),
    meanMemLoad: meanField(beings, (b) => {
      const rx = b.memRxLoad ?? 0;
      const tx = b.memTxLoad ?? 0;
      const act = b.memActLoad ?? 0;
      return rx + tx * 0.5 + act;
    }),
    wisdomStack: world.envProfile?.memLineageEchoEnabled === true,
  };
}

export function compareOpen8192vs1920(short, long) {
  const genDelta = (long.maxGeneration ?? 0) - (short.maxGeneration ?? 0);
  const extDelta = Math.abs((long.externalRate ?? 0) - (short.externalRate ?? 0));
  const layerScale =
    (long.prdCount ?? 0) / Math.max(short.prdCount ?? 1, 1) +
    (long.socEncCount ?? 0) / Math.max(short.socEncCount ?? 1, 1);

  return {
    H1_populationSustained: {
      verdict: (long.aliveTotal ?? 0) >= 8 ? 'support' : (long.aliveTotal ?? 0) >= 4 ? 'weak' : 'unsupport',
      shortAlive: short.aliveTotal,
      longAlive: long.aliveTotal,
    },
    H2_layersObservable: {
      verdict:
        (long.prdCount ?? 0) >= 150 &&
        (long.socEncCount ?? 0) >= 80 &&
        (long.memLinCount ?? 0) >= 8
          ? 'support'
          : (long.prdCount ?? 0) >= 50 && (long.socEncCount ?? 0) >= 30
            ? 'weak'
            : 'unsupport',
      shortPrd: short.prdCount,
      longPrd: long.prdCount,
      longSocEnc: long.socEncCount,
      longMemLin: long.memLinCount,
    },
    H3_deeperEvolution: {
      verdict: genDelta >= 1 ? 'support' : genDelta >= 0 ? 'weak' : 'unsupport',
      shortMaxGen: short.maxGeneration,
      longMaxGen: long.maxGeneration,
      delta: genDelta,
    },
    H4_behaviorOpen: {
      verdict:
        (long.modeDiversity ?? 0) >= 2 && extDelta >= 0.008
          ? 'support'
          : (long.modeDiversity ?? 0) >= 2 || extDelta >= 0.004
            ? 'weak'
            : 'unsupport',
      shortExternal: short.externalRate,
      longExternal: long.externalRate,
      longModeDiv: long.modeDiversity,
      extDelta: +extDelta.toFixed(4),
      layerScale: +layerScale.toFixed(2),
    },
  };
}

export function verifyOpenFieldBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_populationSustained.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_layersObservable.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_deeperEvolution.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_behaviorOpen.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    verdict:
      h1 >= 3 && h2 >= 3 && (h3 >= 2 || h4 >= 2)
        ? 'support'
        : h1 + h2 + h3 + h4 >= 8
          ? 'weak'
          : 'unsupport',
  };
}
