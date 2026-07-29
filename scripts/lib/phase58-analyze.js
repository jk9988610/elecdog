/** Phase 58 — 长时田野 + CODEX 验证 */

import { analyzeEhuDeep } from './phase57-analyze.js';

export function analyzeLongField(recorder, beings, world) {
  const deep = analyzeEhuDeep(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const h3Count = alive.filter((b) => (b.ehuStage ?? 'H0') === 'H3').length;

  return {
    ...deep,
    h3Alive: h3Count,
    h3Share: alive.length ? +(h3Count / alive.length).toFixed(3) : 0,
    tickWindow: world.tick,
  };
}

export function compareLong960vs1920(short, long) {
  const h3Delta = (long.h3Alive ?? 0) - (short.h3Alive ?? 0);
  const ehuDelta = (long.ehuTransitionCount ?? 0) - (short.ehuTransitionCount ?? 0);
  return {
    H1_h3Persistence: {
      verdict: h3Delta >= 4 ? 'support' : h3Delta >= 0 ? 'weak' : 'unsupport',
      short960: short.h3Alive,
      long1920: long.h3Alive,
      delta: h3Delta,
    },
    H2_ehuAccumulation: {
      verdict: ehuDelta >= 40 ? 'support' : ehuDelta >= 0 ? 'weak' : 'unsupport',
      short960: short.ehuTransitionCount,
      long1920: long.ehuTransitionCount,
      delta: ehuDelta,
    },
    H3_personaArc: {
      verdict: (long.meanPersonaTransitions ?? 0) >= (short.meanPersonaTransitions ?? 0) * 1.2 ? 'support' : 'weak',
      short: short.meanPersonaTransitions,
      long: long.meanPersonaTransitions,
    },
  };
}

export function compareLongObserveVsDeep(observe, deep) {
  return {
    H4_observeH3: {
      verdict: (observe.h3Share ?? 0) >= 0.5 ? 'support' : 'weak',
      observeH3: observe.h3Alive,
      observeShare: observe.h3Share,
    },
    H5_deepStable: {
      verdict:
        (deep.fissCount ?? 0) >= 16 && (deep.fusEventCount ?? 0) >= 16 ? 'support' : 'weak',
      fiss: deep.fissCount,
      fus: deep.fusEventCount,
      alive: deep.aliveTotal,
    },
    H6_linLongRun: {
      verdict: (deep.ehuLinCount ?? 0) >= 40 ? 'support' : (deep.ehuLinCount ?? 0) >= 24 ? 'weak' : 'unsupport',
      lin: deep.ehuLinCount,
    },
  };
}
