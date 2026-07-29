/** Phase 100 — GAP-W06 [SEM] 信号载荷共现记录层 */

import { semSnapshot } from '../../src/world/sem.js';
import { evoCount } from './event-stats.js';

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

function extractPairCounts(recorder) {
  const pairCounts = {};
  for (const e of recorder.entries ?? []) {
    if (e.channel !== 'evolution' || e.meta?.kind !== 'SEM') continue;
    const { rxKey, txKey, count } = e.meta;
    if (!rxKey || !txKey) continue;
    const pk = `${rxKey}→${txKey}`;
    pairCounts[pk] = Math.max(pairCounts[pk] ?? 0, count ?? 0);
  }
  return pairCounts;
}

function topCondProb(pairCounts) {
  const rxTotals = {};
  for (const [pk, c] of Object.entries(pairCounts)) {
    const rx = pk.split('→')[0];
    rxTotals[rx] = (rxTotals[rx] ?? 0) + c;
  }
  let top1 = 0;
  for (const [pk, c] of Object.entries(pairCounts)) {
    const rx = pk.split('→')[0];
    const prob = c / (rxTotals[rx] ?? 1);
    if (prob > top1) top1 = prob;
  }
  return +top1.toFixed(4);
}

export function bigramSet(pairCounts) {
  return Object.keys(pairCounts);
}

export function jaccardBigrams(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (!sa.size && !sb.size) return 0;
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union ? +(inter / union).toFixed(4) : 0;
}

export function analyzeSem(recorder, beings, world, { ticks = 1920 } = {}) {
  const alive = beings.filter((b) => b.alive);
  const pairCounts = extractPairCounts(recorder);
  const bigrams = bigramSet(pairCounts);

  return {
    aliveTotal: alive.length,
    semCount: evoCount(recorder, 'SEM'),
    pairKinds: bigrams.length,
    top1CondProb: topCondProb(pairCounts),
    bigrams,
    externalRate: cohortExternalRate(beings, ticks),
    semEnabled: world.envProfile?.semEnabled === true,
    meanLogCount: meanField(beings, (b) => b.semLogCount ?? 0),
    meanPairTally: meanField(beings, (b) => b.semPairTally ?? 0),
    snapshots: alive.slice(0, 4).map((b) => semSnapshot(b)),
  };
}

export function compareSemOffVsOn(off, on) {
  const extDelta = Math.abs((on.externalRate ?? 0) - (off.externalRate ?? 0));
  const jaccard = jaccardBigrams(off.bigrams, on.bigrams);
  const baselineCond = off.top1CondProb || 0.001;
  const condRatio = (on.top1CondProb ?? 0) / baselineCond;

  return {
    H1_semObservable: {
      verdict: on.semCount >= 50 ? 'support' : on.semCount >= 10 ? 'weak' : 'unsupport',
      offCount: off.semCount,
      onCount: on.semCount,
    },
    H2_bigramStability: {
      verdict: jaccard >= 0.08 ? 'support' : jaccard >= 0.03 ? 'weak' : 'unsupport',
      jaccard,
      offPairs: off.pairKinds,
      onPairs: on.pairKinds,
    },
    H3_recordOnlyNoBias: {
      verdict: extDelta <= 0.04 ? 'support' : extDelta <= 0.06 ? 'weak' : 'unsupport',
      offExternal: off.externalRate,
      onExternal: on.externalRate,
      delta: +extDelta.toFixed(4),
    },
    H4_condPattern: {
      verdict: condRatio >= 1.15 ? 'support' : condRatio >= 1.05 ? 'weak' : 'unsupport',
      offCond: off.top1CondProb,
      onCond: on.top1CondProb,
      ratio: +condRatio.toFixed(4),
    },
  };
}

export function verifySemFieldBatch(comparisons, { offRuns = [], onRuns = [] } = {}) {
  const h1Support = comparisons.filter((c) => c.H1_semObservable.verdict === 'support').length;
  const h2Support = comparisons.filter((c) => c.H2_bigramStability.verdict === 'support').length;
  const h3Support = comparisons.filter((c) => c.H3_recordOnlyNoBias.verdict === 'support').length;
  const h4Support = comparisons.filter((c) => c.H4_condPattern.verdict === 'support').length;

  const offBigrams = offRuns.flatMap((r) => r.metrics.bigrams ?? []);
  const onBigrams = onRuns.flatMap((r) => r.metrics.bigrams ?? []);
  const meanJaccard =
    comparisons.length > 0
      ? +(
          comparisons.reduce((s, c) => s + (c.H2_bigramStability.jaccard ?? 0), 0) /
          comparisons.length
        ).toFixed(4)
      : jaccardBigrams([...new Set(offBigrams)], [...new Set(onBigrams)]);

  const h2Batch =
    meanJaccard >= 0.08 ? 'support' : meanJaccard >= 0.03 ? 'weak' : 'unsupport';

  let verdict = 'unsupport';
  if (h1Support >= 3 && h3Support >= comparisons.length && h4Support >= 3) {
    verdict = 'support';
  } else if (h1Support >= 3 && h3Support >= comparisons.length) {
    verdict = 'weak';
  }

  return {
    seedsCompared: comparisons.length,
    h1Support,
    h2Support,
    h2Batch,
    meanJaccard,
    h3Support,
    h4Support,
    verdict,
  };
}
