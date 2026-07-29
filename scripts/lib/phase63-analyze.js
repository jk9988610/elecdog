/** Phase 63 — CODEX 意识立项验证 */

import { analyzeConsciousnessField } from './phase61-analyze.js';

export function analyzeCodexConsciousness(recorder, beings, world) {
  const base = analyzeConsciousnessField(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const h3Count = alive.filter((b) => (b.ehuStage ?? 'H0') === 'H3').length;

  return {
    ...base,
    h3Alive: h3Count,
    h3Share: alive.length ? +(h3Count / alive.length).toFixed(3) : 0,
    stackCoexist:
      (base.ehuTransitionCount ?? 0) >= 1 &&
      (base.ehuLinCount ?? 0) >= 1 &&
      (base.ehuRenCount ?? 0) >= 1,
  };
}

export function verifyCodexEhuRen(full, off) {
  return {
    H1_ehuRenFires: {
      verdict: (full.ehuRenCount ?? 0) >= 100 && (off.ehuRenCount ?? 0) === 0 ? 'support' : 'weak',
      full: full.ehuRenCount,
      off: off.ehuRenCount,
      renEvents: full.renEventCount,
    },
    H2_renImpliesTrace: {
      verdict:
        (full.renEventCount ?? 0) >= 50 && (full.ehuRenCount ?? 0) >= (full.renEventCount ?? 0) * 0.5
          ? 'support'
          : 'weak',
      ren: full.renEventCount,
      ehuRen: full.ehuRenCount,
    },
  };
}

export function verifyCodexFullStack(full) {
  return {
    H3_h3Majority: {
      verdict: (full.h3Share ?? 0) >= 0.85 ? 'support' : (full.h3Share ?? 0) >= 0.5 ? 'weak' : 'unsupport',
      h3Share: full.h3Share,
      h3Alive: full.h3Alive,
    },
    H4_tracesCoexist: {
      verdict: full.stackCoexist ? 'support' : 'weak',
      ehu: full.ehuTransitionCount,
      lin: full.ehuLinCount,
      ehuRen: full.ehuRenCount,
    },
    H5_narrativeArc: {
      verdict: (full.meanPersonaTransitions ?? 0) >= 60 ? 'support' : 'weak',
      psn: full.meanPersonaTransitions,
    },
  };
}
