/** Phase 70 — W1 记忆→行为闭环 */

import { memoryFeedbackSnapshot } from '../../src/world/memory-feedback.js';
import { analyzeCodexConsciousness } from './phase63-analyze.js';

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

function cohortActShare(beings) {
  const alive = beings.filter((b) => b.alive);
  const act = alive.reduce((s, b) => s + (b.fieldActCount ?? 0), 0);
  const tx = alive.reduce((s, b) => s + (b.fieldTxCount ?? 0), 0);
  const total = act + tx;
  return total ? +(act / total).toFixed(4) : null;
}

export function analyzeMemoryFeedback(recorder, beings, world, { ticks = 1920 } = {}) {
  const stack = analyzeCodexConsciousness(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);

  return {
    ...stack,
    aliveTotal: alive.length,
    externalRate: cohortExternalRate(beings, ticks),
    actShare: cohortActShare(beings),
    meanMemRxLoad: meanField(beings, (b) => b.memRxLoad ?? 0),
    meanMemTxLoad: meanField(beings, (b) => b.memTxLoad ?? 0),
    meanMemActLoad: meanField(beings, (b) => b.memActLoad ?? 0),
    memSnapshots: alive.slice(0, 4).map((b) => memoryFeedbackSnapshot(b)),
    memoryFeedbackEnabled: world.envProfile?.memoryFeedbackEnabled === true,
  };
}

export function compareMemOnVsOff(off, on) {
  const extDelta = (on.externalRate ?? 0) - (off.externalRate ?? 0);
  const actDelta = (on.actShare ?? 0) - (off.actShare ?? 0);
  const absExtDelta = Math.abs(extDelta);

  return {
    H1_externalRateDiff: {
      verdict: absExtDelta >= 0.02 ? 'support' : absExtDelta >= 0.005 ? 'weak' : 'unsupport',
      offRate: off.externalRate,
      onRate: on.externalRate,
      delta: +extDelta.toFixed(4),
    },
    H2_actShareDiff: {
      verdict: Math.abs(actDelta) >= 0.02 ? 'support' : Math.abs(actDelta) >= 0.005 ? 'weak' : 'unsupport',
      offShare: off.actShare,
      onShare: on.actShare,
      delta: +actDelta.toFixed(4),
    },
    H3_memLoadsActive: {
      verdict:
        (on.meanMemActLoad ?? 0) >= 0.02 || (on.meanMemRxLoad ?? 0) >= 0.02 ? 'support' : 'weak',
      meanRx: on.meanMemRxLoad,
      meanAct: on.meanMemActLoad,
      meanTx: on.meanMemTxLoad,
    },
    H4_stackIntact: {
      verdict: (on.h3Share ?? 0) >= 0.5 && on.aliveTotal >= 6 ? 'support' : 'weak',
      h3Share: on.h3Share,
      alive: on.aliveTotal,
      offAlive: off.aliveTotal,
    },
  };
}

export function verifyMemFieldBatch(comparisons) {
  const h1Support = comparisons.filter((c) => c.H1_externalRateDiff.verdict === 'support').length;
  const h1Weak = comparisons.filter((c) => c.H1_externalRateDiff.verdict === 'weak').length;
  const directions = comparisons.map((c) => Math.sign(c.H1_externalRateDiff.delta ?? 0));
  const nonZero = directions.filter((d) => d !== 0);
  const signConsistent =
    nonZero.length >= 2 && nonZero.every((d) => d === nonZero[0]);

  return {
    seedsCompared: comparisons.length,
    h1Support,
    h1Weak,
    signConsistent,
    unanimous: h1Support === comparisons.length,
    majority: h1Support + h1Weak >= Math.ceil(comparisons.length * 0.75),
    verdict:
      h1Support >= 3 && signConsistent
        ? 'support'
        : h1Support + h1Weak >= 3
          ? 'weak'
          : 'unsupport',
  };
}
