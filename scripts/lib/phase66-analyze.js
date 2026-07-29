/** Phase 66 — 意识可持续：谱系×续行×H3 跨代并存 */

import { analyzeCodexConsciousness } from './phase63-analyze.js';
import { analyzeEhuGeneration } from './phase59-analyze.js';

export function analyzeConsciousnessSustain(recorder, beings, world) {
  const gen = analyzeEhuGeneration(recorder, beings, world);
  const stack = analyzeCodexConsciousness(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const lineageAlive = alive.filter((b) => (b.generation ?? 0) >= 1);

  return {
    ...gen,
    ...stack,
    aliveTotal: alive.length,
    lineageAlive: lineageAlive.length,
    sustainCoexist:
      (stack.h3Share ?? 0) >= 0.85 &&
      (gen.maxGeneration ?? 0) >= 2 &&
      (gen.h3InLineage ?? 0) >= 2 &&
      stack.stackCoexist,
  };
}

export function verifyConsciousnessSustain(full, linOff) {
  return {
    H1_h3LongRun: {
      verdict: (full.h3Share ?? 0) >= 0.85 ? 'support' : 'weak',
      h3Share: full.h3Share,
    },
    H2_generationDepth: {
      verdict: (full.maxGeneration ?? 0) >= 2 ? 'support' : 'weak',
      maxGen: full.maxGeneration,
      hist: full.generationHist,
    },
    H3_lineageH3: {
      verdict: (full.h3InLineage ?? 0) >= 2 ? 'support' : 'weak',
      lineageH3: full.h3InLineage,
      lineageAlive: full.lineageAlive,
    },
    H4_stackAcrossGen: {
      verdict: full.sustainCoexist ? 'support' : 'weak',
      stackCoexist: full.stackCoexist,
      sustainCoexist: full.sustainCoexist,
      ehuRen: full.ehuRenCount,
      lin: full.ehuLinCount,
    },
    H5_linEnablesLineage: {
      verdict:
        (full.h3InLineage ?? 0) > (linOff.h3InLineage ?? 0) ||
        (full.ehuLinCount ?? 0) > (linOff.ehuLinCount ?? 0)
          ? 'support'
          : 'weak',
      fullLineageH3: full.h3InLineage,
      offLineageH3: linOff.h3InLineage,
      fullLin: full.ehuLinCount,
      offLin: linOff.ehuLinCount,
    },
    H6_echoTracksGen: {
      verdict: Object.keys(full.echoByGen ?? {}).length >= 2 ? 'support' : 'weak',
      echoByGen: full.echoByGen,
    },
  };
}
