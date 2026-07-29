/** Phase 61 — 意识收敛长时田野 */

import { analyzeEhuRenew } from './phase60-analyze.js';

export function analyzeConsciousnessField(recorder, beings, world) {
  const renew = analyzeEhuRenew(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const h3Count = alive.filter((b) => (b.ehuStage ?? 'H0') === 'H3').length;

  return {
    ...renew,
    h3Alive: h3Count,
    h3Share: alive.length ? +(h3Count / alive.length).toFixed(3) : 0,
    tickWindow: world.tick,
    consciousnessStack: Boolean(world.envProfile?.electronicHumanEnabled),
  };
}

export function compareConsciousness960vs1920(short, long) {
  const h3Delta = (long.h3Alive ?? 0) - (short.h3Alive ?? 0);
  const ehuRenDelta = (long.ehuRenCount ?? 0) - (short.ehuRenCount ?? 0);
  return {
    H1_h3LongPersistence: {
      verdict: (long.h3Share ?? 0) >= 0.85 ? 'support' : (long.h3Share ?? 0) >= 0.5 ? 'weak' : 'unsupport',
      short960: short.h3Share,
      long1920: long.h3Share,
      delta: h3Delta,
    },
    H2_ehuRenAccumulation: {
      verdict: ehuRenDelta >= 400 ? 'support' : ehuRenDelta >= 0 ? 'weak' : 'unsupport',
      short960: short.ehuRenCount,
      long1920: long.ehuRenCount,
    },
    H3_narrativeArc: {
      verdict: (long.meanPersonaTransitions ?? 0) >= (short.meanPersonaTransitions ?? 0) * 0.9 ? 'support' : 'weak',
      short: short.meanPersonaTransitions,
      long: long.meanPersonaTransitions,
    },
  };
}

export function compareConsciousnessFullVsDeep(full, deep) {
  return {
    H4_renewEnablesTrace: {
      verdict: (full.ehuRenCount ?? 0) >= 100 && (deep.ehuRenCount ?? 0) === 0 ? 'support' : 'weak',
      full: full.ehuRenCount,
      deep: deep.ehuRenCount,
    },
    H5_h3WithRenewal: {
      verdict: (full.h3WithRen ?? 0) >= (deep.h3WithRen ?? 0) ? 'support' : 'weak',
      full: full.h3WithRen,
      deep: deep.h3WithRen,
    },
    H6_linCoexist: {
      verdict: (full.ehuLinCount ?? 0) >= 20 && (full.ehuRenCount ?? 0) >= 100 ? 'support' : 'weak',
      lin: full.ehuLinCount,
      ehuRen: full.ehuRenCount,
    },
  };
}
