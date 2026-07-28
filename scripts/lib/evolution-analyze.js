/** 多代进化田野统计 — 只输出可观测数据，不作因果断言 */

import { analyzeViability } from './viability-analyze.js';
import { analyzeComposition } from './composition-analyze.js';
import { analyzeCell } from './cell-analyze.js';
import { analyzeCatastrophe } from './catastrophe-analyze.js';

const BASES = ['0', '1', '2', '3'];

export function baseFrequency(seq) {
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const c of seq) {
    if (counts[c] != null) counts[c]++;
  }
  const n = seq.length || 1;
  return Object.fromEntries(BASES.map((b) => [b, +(counts[b] / n).toFixed(4)]));
}

export function aggregateFrequency(sequences) {
  if (!sequences.length) return null;
  const sums = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const seq of sequences) {
    const f = baseFrequency(seq);
    for (const b of BASES) sums[b] += f[b];
  }
  const n = sequences.length;
  return Object.fromEntries(BASES.map((b) => [b, +(sums[b] / n).toFixed(4)]));
}

export function frequencyDrift(before, after) {
  if (!before || !after) return null;
  return Object.fromEntries(
    BASES.map((b) => [b, +(after[b] - before[b]).toFixed(4)])
  );
}

export function frequencyByGeneration(beings) {
  const buckets = {
    '0-3': [],
    '4-7': [],
    '8+': [],
  };
  for (const b of beings) {
    const g = b.generation || 0;
    const seq = b.dna?.sequence;
    if (!seq) continue;
    if (g <= 3) buckets['0-3'].push(seq);
    else if (g <= 7) buckets['4-7'].push(seq);
    else buckets['8+'].push(seq);
  }
  return Object.fromEntries(
    Object.entries(buckets).map(([k, seqs]) => [k, { count: seqs.length, freq: aggregateFrequency(seqs) }])
  );
}

export function endsAfterPulses(entries, window = 50) {
  const pulseTicks = [
    ...new Set(
      entries
        .filter((e) => e.channel === 'environment' && (e.meta?.kind === 'SHK' || e.meta?.kind === 'NPL'))
        .map((e) => e.tick)
    ),
  ];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  let count = 0;
  for (const pt of pulseTicks) {
    count += ends.filter((e) => e.tick >= pt && e.tick <= pt + window).length;
  }
  return { pulseCount: pulseTicks.length, endsInWindow: count };
}

export function mbrCelEndCorrelation(entries) {
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const mbrByBeing = new Map();
  const celByBeing = new Map();
  for (const e of entries) {
    if (e.channel === 'cell' && e.meta?.kind === 'MBR') {
      mbrByBeing.set(e.beingId, (mbrByBeing.get(e.beingId) || 0) + 1);
    }
    if (e.channel === 'cell' && e.meta?.kind === 'CEL') {
      celByBeing.set(e.beingId, (celByBeing.get(e.beingId) || 0) + 1);
    }
  }
  const endedWithMbr = ends.filter((e) => (mbrByBeing.get(e.beingId) || 0) > 0).length;
  const endedWithCel = ends.filter((e) => (celByBeing.get(e.beingId) || 0) > 0).length;
  return {
    endCount: ends.length,
    endedWithMbr,
    endedWithCel,
    mbrEndRate: ends.length ? endedWithMbr / ends.length : null,
    celEndRate: ends.length ? endedWithCel / ends.length : null,
  };
}

export function analyzeEvolution({ entries, beings, ticks }) {
  const viability = analyzeViability(entries, ticks);
  const composition = analyzeComposition(entries);
  const cell = analyzeCell(entries, beings);
  const catastrophe = analyzeCatastrophe(entries, ticks);
  const pulseEnds = endsAfterPulses(entries);
  const cellEnd = mbrCelEndCorrelation(entries);

  const gen0 = beings.filter((b) => (b.generation || 0) === 0);
  const alive = beings.filter((b) => b.alive);
  const allSeqs = beings.map((b) => b.dna?.sequence).filter(Boolean);
  const aliveSeqs = alive.map((b) => b.dna?.sequence).filter(Boolean);
  const gen0Freq = aggregateFrequency(gen0.map((b) => b.dna.sequence));
  const aliveFreq = aggregateFrequency(aliveSeqs);
  const allFreq = aggregateFrequency(allSeqs);
  const byGen = frequencyByGeneration(beings);

  const driftAliveVsGen0 = frequencyDrift(gen0Freq, aliveFreq);
  const driftAllVsGen0 = frequencyDrift(gen0Freq, allFreq);

  return {
    viability,
    composition,
    cell,
    catastrophe,
    pulseEnds,
    cellEnd,
    dna: {
      gen0Count: gen0.length,
      aliveCount: alive.length,
      totalCount: beings.length,
      gen0Freq,
      aliveFreq,
      allFreq,
      driftAliveVsGen0,
      driftAllVsGen0,
      byGeneration: byGen,
      maxGeneration: viability.maxGeneration,
    },
  };
}

function driftMagnitude(drift) {
  if (!drift) return 0;
  return BASES.reduce((s, b) => s + Math.abs(drift[b]), 0);
}

export function evaluateHypotheses(analysis) {
  const { dna, viability, composition, cell, catastrophe, pulseEnds, cellEnd } = analysis;
  const drift = driftMagnitude(dna.driftAliveVsGen0);
  const h1 =
    drift >= 0.02 && viability.maxGeneration >= 3
      ? 'support'
      : drift < 0.01
        ? 'unsupport'
        : 'pending';

  const h2 =
    viability.endCount > 0 && viability.lineageCount > 0 && dna.aliveCount > 0
      ? 'support'
      : viability.endCount > 0 && viability.lineageCount === 0
        ? 'unsupport'
        : 'pending';

  const h3 =
    composition.cmpCount > 0 && viability.maxGeneration >= 5
      ? composition.structDrift != null && Math.abs(composition.structDrift) >= 0.02
        ? 'support'
        : 'pending'
      : 'pending';

  const h4 =
    cellEnd.endCount >= 3
      ? cellEnd.mbrEndRate != null && cellEnd.mbrEndRate >= 0.5
        ? 'support'
        : cellEnd.mbrEndRate != null && cellEnd.mbrEndRate < 0.3
          ? 'unsupport'
          : 'pending'
      : 'pending';

  return {
    H1_dnaDrift: { verdict: h1, driftMagnitude: +drift.toFixed(4), maxGen: viability.maxGeneration },
    H2_endLineageBalance: {
      verdict: h2,
      endCount: viability.endCount,
      lineageCount: viability.lineageCount,
      alive: dna.aliveCount,
    },
    H3_structIntegrityShift: {
      verdict: h3,
      structDrift: composition.structDrift,
      avgIntegrity: cell.avgIntegrity,
      maxGen: viability.maxGeneration,
    },
    H4_mbrCelEnd: {
      verdict: h4,
      mbrEndRate: cellEnd.mbrEndRate,
      celEndRate: cellEnd.celEndRate,
      pulseEnds: pulseEnds.endsInWindow,
    },
  };
}

export function compareRuns(runs) {
  const drifts = runs.map((r) => r.hypotheses.H1_dnaDrift.driftMagnitude);
  const avgDrift = drifts.reduce((a, b) => a + b, 0) / (drifts.length || 1);
  const signs = runs.map((r) => {
    const d = r.evolution.dna.driftAliveVsGen0;
    if (!d) return null;
    return BASES.map((b) => Math.sign(d[b]));
  });
  const consistent =
    signs.length >= 2 &&
    signs.every((s) => s && signs[0].every((v, i) => v === s[i] || v === 0 || signs[0][i] === 0));
  return { avgDrift: +avgDrift.toFixed(4), signConsistent: consistent, runCount: runs.length };
}

/** 多种子多数票：各碱基漂移方向的跨运行共识 */
export function majorityDriftConsensus(runs) {
  const votes = Object.fromEntries(BASES.map((b) => [b, { pos: 0, neg: 0, zero: 0 }]));
  for (const run of runs) {
    const d = run.evolution?.dna?.driftAliveVsGen0;
    if (!d) continue;
    for (const b of BASES) {
      const s = Math.sign(d[b]);
      if (s > 0) votes[b].pos++;
      else if (s < 0) votes[b].neg++;
      else votes[b].zero++;
    }
  }
  const consensus = {};
  let unanimousBases = 0;
  for (const b of BASES) {
    const v = votes[b];
    const active = v.pos + v.neg;
    let sign = 0;
    if (v.pos > v.neg) sign = 1;
    else if (v.neg > v.pos) sign = -1;
    const unanimous = active > 0 && (v.pos === 0 || v.neg === 0);
    if (unanimous) unanimousBases++;
    consensus[b] = { sign, unanimous, ...v };
  }
  return {
    votes,
    consensus,
    unanimousBases,
    allUnanimous: unanimousBases === BASES.length,
    runCount: runs.length,
  };
}
