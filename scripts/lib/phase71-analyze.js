/** Phase 71 — W2 选择压可重复性度量 */

import {
  aggregateFrequency,
  frequencyDrift,
  compareRuns,
  majorityDriftConsensus,
} from './evolution-analyze.js';
import { analyzeSelection, evaluateSelectionHypotheses } from './selection-analyze.js';
import { endCount } from './event-stats.js';

const BASES = ['0', '1', '2', '3'];

function driftMagnitude(drift) {
  if (!drift) return 0;
  return BASES.reduce((s, b) => s + Math.abs(drift[b] ?? 0), 0);
}

function viabilityFromBeings(beings, recorder) {
  const alive = beings.filter((b) => b.alive);
  const maxGeneration = beings.reduce((m, b) => Math.max(m, b.generation ?? 0), 0);
  return {
    endCount: endCount(recorder),
    lineageCount: beings.filter((b) => (b.generation ?? 0) >= 1).length,
    maxGeneration,
    aliveAtEnd: alive.length,
  };
}

export function analyzeW2Repeatability(recorder, beings, world) {
  const alive = beings.filter((b) => b.alive);
  const gen0 = beings.filter((b) => (b.generation ?? 0) === 0);
  const gen0Freq = aggregateFrequency(gen0.map((b) => b.dna?.sequence).filter(Boolean));
  const aliveFreq = aggregateFrequency(alive.map((b) => b.dna?.sequence).filter(Boolean));
  const driftAliveVsGen0 = frequencyDrift(gen0Freq, aliveFreq);
  const viability = viabilityFromBeings(beings, recorder);
  const selection = analyzeSelection(recorder.entries, beings);
  const selHypotheses = evaluateSelectionHypotheses(selection, viability);

  return {
    dna: {
      gen0Count: gen0.length,
      aliveCount: alive.length,
      driftAliveVsGen0,
      driftMagnitude: +driftMagnitude(driftAliveVsGen0).toFixed(4),
      maxGeneration: viability.maxGeneration,
    },
    selection,
    selHypotheses,
    viability,
    catastrophe: !world.envProfile?.catastropheDisabled,
  };
}

/** 适配 evolution-analyze 跨种子比较接口 */
export function toEvolutionCompareRun(run) {
  const m = run.metrics;
  return {
    seed: run.seed,
    evolution: { dna: { driftAliveVsGen0: m.dna.driftAliveVsGen0 } },
    hypotheses: { H1_dnaDrift: { driftMagnitude: m.dna.driftMagnitude } },
  };
}

export function evaluateW2PerSeed(metrics) {
  const drift = metrics.dna.driftMagnitude ?? 0;
  return {
    H1_driftObserved: {
      verdict: drift >= 0.02 && metrics.viability.maxGeneration >= 3 ? 'support' : 'weak',
      driftMagnitude: drift,
      maxGen: metrics.viability.maxGeneration,
    },
    H2_selChannel: {
      verdict: metrics.selHypotheses.H3_selectionChannelComplete.verdict,
      selCount: metrics.selection.selCount,
      endCount: metrics.viability.endCount,
    },
    H3_genStressCorr: {
      verdict: metrics.selHypotheses.H1_genStressCorrelation.verdict,
      corr: metrics.selection.genStressCorr,
    },
  };
}

export function verifyW2Batch(runsByTreatment) {
  const result = {};
  for (const [tid, runs] of Object.entries(runsByTreatment)) {
    const adapted = runs.map(toEvolutionCompareRun);
    const consensus = majorityDriftConsensus(adapted);
    const compare = compareRuns(adapted);
    result[tid] = {
      compare,
      consensus,
      meanDrift: +(
        runs.reduce((s, r) => s + (r.metrics.dna.driftMagnitude ?? 0), 0) / runs.length
      ).toFixed(4),
      meanSel: +(
        runs.reduce((s, r) => s + (r.metrics.selection.selCount ?? 0), 0) / runs.length
      ).toFixed(1),
      perSeed: runs.map((r) => ({
        seed: r.seed,
        drift: r.metrics.dna.driftAliveVsGen0,
        driftMag: r.metrics.dna.driftMagnitude,
        selCount: r.metrics.selection.selCount,
        maxGen: r.metrics.viability.maxGeneration,
        hypotheses: evaluateW2PerSeed(r.metrics),
      })),
    };
  }

  const cat = result.w2_evo_cat;
  const ctrl = result.w2_evo_ctrl;
  const bestUnanimous = Math.max(
    cat?.consensus?.unanimousBases ?? 0,
    ctrl?.consensus?.unanimousBases ?? 0
  );

  return {
    treatments: result,
    metricsEstablished: true,
    signConsistentCat: cat?.compare?.signConsistent ?? false,
    signConsistentCtrl: ctrl?.compare?.signConsistent ?? false,
    unanimousBasesCat: cat?.consensus?.unanimousBases ?? 0,
    unanimousBasesCtrl: ctrl?.consensus?.unanimousBases ?? 0,
    bestUnanimousBases: bestUnanimous,
    w2Repeatable: bestUnanimous >= 2,
    gap10Status: bestUnanimous >= 4 ? 'closed' : bestUnanimous >= 2 ? 'partial' : 'open',
    verdict:
      bestUnanimous >= 2
        ? 'metrics_ready'
        : cat?.compare?.signConsistent || ctrl?.compare?.signConsistent
          ? 'weak_signal'
          : 'gap10_persists',
    phase72Target: '≥2 碱基 unanimous（当前基线 ' + bestUnanimous + '/4）',
  };
}
