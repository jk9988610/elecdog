/** Phase 59 — EHU × 谱系代次交叉分析 */

import { analyzeEhuDeep } from './phase57-analyze.js';

function generationHistogram(beings) {
  const hist = {};
  for (const b of beings) {
    const g = b.generation ?? 0;
    hist[g] = (hist[g] ?? 0) + 1;
  }
  return hist;
}

function ehuStageByGeneration(beings) {
  const byGen = {};
  for (const b of beings.filter((x) => x.alive)) {
    const g = b.generation ?? 0;
    if (!byGen[g]) byGen[g] = { H0: 0, H1: 0, H2: 0, H3: 0 };
    const stage = b.ehuStage ?? 'H0';
    byGen[g][stage] = (byGen[g][stage] ?? 0) + 1;
  }
  return byGen;
}

function echoOffspringByGeneration(beings) {
  const byGen = {};
  for (const b of beings.filter((x) => x.ehuLineageEcho)) {
    const g = b.generation ?? 0;
    byGen[g] = (byGen[g] ?? 0) + 1;
  }
  return byGen;
}

function meanGeneration(beings) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return null;
  const sum = alive.reduce((s, b) => s + (b.generation ?? 0), 0);
  return +(sum / alive.length).toFixed(2);
}

export function analyzeEhuGeneration(recorder, beings, world) {
  const deep = analyzeEhuDeep(recorder, beings, world);
  const alive = beings.filter((b) => b.alive);
  const lineageAlive = alive.filter((b) => (b.generation ?? 0) >= 1);

  return {
    ...deep,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
    meanGeneration: meanGeneration(beings),
    aliveLineage: lineageAlive.length,
    generationHist: generationHistogram(beings),
    ehuStageByGen: ehuStageByGeneration(beings),
    echoByGen: echoOffspringByGeneration(beings),
    h3InLineage: lineageAlive.filter((b) => (b.ehuStage ?? 'H0') === 'H3').length,
  };
}

export function compareEhuGenLin(base, lin) {
  const linDelta = (lin.ehuLinCount ?? 0) - (base.ehuLinCount ?? 0);
  const echoGenKeys = Object.keys(lin.echoByGen ?? {}).length;
  return {
    H1_linFiresWithEcho: {
      verdict: linDelta >= 16 ? 'support' : linDelta >= 1 ? 'weak' : 'unsupport',
      base: base.ehuLinCount ?? 0,
      lin: lin.ehuLinCount ?? 0,
    },
    H2_echoTracksGeneration: {
      verdict: echoGenKeys >= 2 ? 'support' : echoGenKeys >= 1 ? 'weak' : 'unsupport',
      echoByGen: lin.echoByGen,
      maxGen: lin.maxGeneration,
    },
    H3_lineageH3: {
      verdict: (lin.h3InLineage ?? 0) >= (base.h3InLineage ?? 0) ? 'support' : 'weak',
      base: base.h3InLineage,
      lin: lin.h3InLineage,
    },
  };
}

export function compareEhuGenFull(lin, full) {
  const genDelta = (full.maxGeneration ?? 0) - (lin.maxGeneration ?? 0);
  const h3Delta = (full.ehuStages?.H3 ?? 0) - (lin.ehuStages?.H3 ?? 0);
  return {
    H4_generationDepth: {
      verdict: genDelta >= 0 && (full.maxGeneration ?? 0) >= 3 ? 'support' : 'weak',
      linMax: lin.maxGeneration,
      fullMax: full.maxGeneration,
    },
    H5_fullBindEcho: {
      verdict:
        (full.meanSocialBind ?? 0) > 0 &&
        (full.ehuLinCount ?? 0) >= (lin.ehuLinCount ?? 0) * 0.8
          ? 'support'
          : 'weak',
      bind: full.meanSocialBind,
      lin: full.ehuLinCount,
    },
    H6_h3AcrossGen: {
      verdict: h3Delta >= 0 && (full.h3InLineage ?? 0) >= 2 ? 'support' : 'weak',
      fullH3: full.ehuStages?.H3 ?? 0,
      lineageH3: full.h3InLineage,
    },
  };
}
