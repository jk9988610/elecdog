/** Phase 62 — 超长时意识田野 3840 tick */

import { analyzeConsciousnessField } from './phase61-analyze.js';

export function compareConsciousness1920vs3840(short, long) {
  const h3Delta = (long.h3Share ?? 0) - (short.h3Share ?? 0);
  const ehuRenDelta = (long.ehuRenCount ?? 0) - (short.ehuRenCount ?? 0);
  return {
    H1_h3UltraLong: {
      verdict: (long.h3Share ?? 0) >= 0.85 ? 'support' : (long.h3Share ?? 0) >= 0.5 ? 'weak' : 'unsupport',
      short1920: short.h3Share,
      long3840: long.h3Share,
      delta: +h3Delta.toFixed(3),
    },
    H2_ehuRenUltra: {
      verdict: ehuRenDelta >= 0 && (long.ehuRenCount ?? 0) >= 2000 ? 'support' : 'weak',
      short1920: short.ehuRenCount,
      long3840: long.ehuRenCount,
    },
    H3_personaUltra: {
      verdict: (long.meanPersonaTransitions ?? 0) >= (short.meanPersonaTransitions ?? 0) * 0.85 ? 'support' : 'weak',
      short: short.meanPersonaTransitions,
      long: long.meanPersonaTransitions,
    },
    H4_linStable: {
      verdict: (long.ehuLinCount ?? 0) >= (short.ehuLinCount ?? 0) * 0.8 ? 'support' : 'weak',
      short: short.ehuLinCount,
      long: long.ehuLinCount,
    },
  };
}

export { analyzeConsciousnessField };
