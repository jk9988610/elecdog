/** Phase 53 — 繁殖路径层 [RPR] × 四层档案 */

import { reproductionSnapshot } from '../../src/world/reproduction-profile.js';
import { evoCount } from './event-stats.js';
import { analyzeProfileStack } from './phase52-analyze.js';

function modeHistogram(beings) {
  const hist = { R0: 0, SEED_DOM: 0, LIN_DOM: 0, FIS_DOM: 0, RCM_DOM: 0, MULTI: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const m = b.rprMode ?? 'R0';
    hist[m] = (hist[m] ?? 0) + 1;
  }
  return hist;
}

function originHistogram(beings) {
  const hist = { SEED: 0, LIN: 0, FIS: 0, RCM: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const o = b.rprOrigin ?? 'SEED';
    hist[o] = (hist[o] ?? 0) + 1;
  }
  return hist;
}

export function analyzeReproductionPath(recorder, beings, world) {
  const stack = analyzeProfileStack(recorder, beings, world);
  const lineageEventCount = beings.reduce((s, b) => s + (b.rprLineageAsParent ?? 0), 0);

  return {
    ...stack,
    rprTransitionCount: evoCount(recorder, 'RPR'),
    rprModes: modeHistogram(beings),
    rprOrigins: originHistogram(beings),
    lineageEventCount,
    meanRprTransitions: meanField(beings, (b) => b.rprTransitions ?? 0),
    rprSnapshots: beings.filter((b) => b.alive).slice(0, 6).map((b) => reproductionSnapshot(b)),
  };
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(2);
}

export function compareRprObserveVsNone(none, observe) {
  return {
    H1_rprFires: {
      verdict: observe.rprTransitionCount >= 1 ? 'support' : 'unsupport',
      none: none.rprTransitionCount,
      observe: observe.rprTransitionCount,
    },
    H2_originsTracked: {
      verdict:
        (observe.rprOrigins?.FIS ?? 0) + (observe.rprOrigins?.RCM ?? 0) + (observe.rprOrigins?.LIN ?? 0) >=
        3
          ? 'support'
          : 'weak',
      origins: observe.rprOrigins,
    },
  };
}

export function compareRprFissVsObserve(observe, fiss) {
  const fissDomDelta = (fiss.rprModes?.FIS_DOM ?? 0) - (observe.rprModes?.FIS_DOM ?? 0);
  return {
    H3_fissDominant: {
      verdict: fissDomDelta >= 4 ? 'support' : fissDomDelta >= 1 ? 'weak' : 'unsupport',
      observe: observe.rprModes?.FIS_DOM ?? 0,
      fiss: fiss.rprModes?.FIS_DOM ?? 0,
    },
    H4_fissRepro: {
      verdict: fiss.fissCount >= observe.fissCount ? 'support' : 'weak',
      observeFiss: observe.fissCount,
      fissOnly: fiss.fissCount,
    },
  };
}

export function compareRprTri(fiss, tri) {
  const fusDelta = (tri.fusEventCount ?? 0) - (fiss.fusEventCount ?? 0);
  const multiDelta = (tri.rprModes?.MULTI ?? 0) - (fiss.rprModes?.MULTI ?? 0);
  return {
    H5_triHasFus: {
      verdict: (tri.fusEventCount ?? 0) >= 8 ? 'support' : 'weak',
      triFus: tri.fusEventCount,
      triFiss: tri.fissCount,
    },
    H6_multiPath: {
      verdict: multiDelta >= 2 ? 'support' : multiDelta >= 0 ? 'weak' : 'unsupport',
      fissMulti: fiss.rprModes?.MULTI ?? 0,
      triMulti: tri.rprModes?.MULTI ?? 0,
    },
    H7_stackCoexist: {
      verdict: tri.totalLayerTransitions >= 300 ? 'support' : 'weak',
      layers: tri.totalLayerTransitions,
      rpr: tri.rprTransitionCount,
      fusDelta,
    },
  };
}
