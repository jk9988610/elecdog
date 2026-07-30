/** Phase 106 — 进化留置 + 生态分裂 + 减数分裂后代 */

import { evoCount, evoWithMeta } from './event-stats.js';

function meanTag(beings, tag, pick) {
  const pool = beings.filter((b) => b.cohortTag === tag);
  if (!pool.length) return null;
  return +(pool.reduce((s, b) => s + pick(b), 0) / pool.length).toFixed(4);
}

function countTagAlive(beings, tag) {
  return beings.filter((b) => b.cohortTag === tag && b.alive).length;
}

export function analyzeEvoCarry(recorder, beings, world, ctx = {}) {
  const alive = beings.filter((b) => b.alive);
  const mei = evoCount(recorder, 'MEI');
  const fiss = evoCount(recorder, 'FISS');
  const fus = evoCount(recorder, 'FUS');
  const ren = evoCount(recorder, 'REN');
  const ecoFiss = evoWithMeta(recorder, 'FISS', (m) => m.ecoFiss === true);

  const gen0 = beings.filter((b) => (b.generation ?? 0) === 0);
  const nonGen0 = beings.filter((b) => (b.generation ?? 0) > 0);
  const carried = beings.filter((b) => b.cohortTag === 'carry');
  const naive = beings.filter((b) => b.cohortTag === 'naive');

  const carriedRen = carried.reduce((s, b) => s + (b.renCount ?? 0), 0);
  const carriedFiss = carried.reduce((s, b) => s + (b.fissionCount ?? 0), 0);
  const carriedMei = carried.reduce((s, b) => s + (b.meiCount ?? 0), 0);

  const offspringNonZero = beings.filter((b) => (b.generation ?? 0) > 0 && b.alive).length;

  return {
    aliveTotal: alive.length,
    carryMode: ctx.carryMode ?? world.envProfile?.carryMode ?? 'none',
    carryImported: ctx.carryCount ?? 0,
    meiCount: mei,
    fissCount: fiss,
    fusCount: fus,
    renCount: ren,
    ecoFissCount: ecoFiss,
    gen0Count: gen0.length,
    nonGen0Count: nonGen0.length,
    offspringAlive: offspringNonZero,
    naiveAlive: countTagAlive(beings, 'naive'),
    carryAlive: countTagAlive(beings, 'carry'),
    meanGenNaive: meanTag(beings, 'naive', (b) => b.generation ?? 0),
    meanGenCarry: meanTag(beings, 'carry', (b) => b.generation ?? 0),
    carriedRenTicks: carriedRen,
    carriedFiss: carriedFiss,
    carriedMei: carriedMei,
    meiFromGen0: evoWithMeta(recorder, 'MEI', () => true) > 0 && gen0.some((b) => (b.meiCount ?? 0) > 0),
    fusOffspring: fus > 0,
  };
}

export function verifyEvoCarryBatch(byTreatment) {
  const mixed = byTreatment.ev106_mixed_eco ?? [];
  const naive = byTreatment.ev106_naive_only ?? [];

  const mixedRuns = mixed.filter((r) => (r.carryCount ?? 0) > 0);
  const naiveRuns = naive;
  const h1 = mixedRuns.length >= 2;
  const h2 =
    mixedRuns.every((r) => (r.metrics.renCount ?? 0) === 0) &&
    naiveRuns.every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = [...mixedRuns, ...naiveRuns].some(
    (r) => (r.metrics.fissCount ?? 0) > 0 || (r.metrics.ecoFissCount ?? 0) > 0
  );
  const h4 = mixedRuns.some((r) => (r.metrics.ecoFissCount ?? 0) > 0 || (r.metrics.fissCount ?? 0) > 0);
  const h5 = mixedRuns.some((r) => (r.metrics.nonGen0Count ?? 0) > (r.metrics.carryImported ?? 0));

  const support = [h1, h2, h3, h4].filter(Boolean).length;
  return {
    h1CarryImported: h1,
    h2NoCarryRen: h2,
    h3MeiFusObserved: h3,
    h4EcoFissObserved: h4,
    h5OffspringBeyondCarry: h5,
    verdict: support >= 3 ? 'weak' : support >= 2 ? 'pending' : 'unsupport',
    support,
  };
}

export function slimEvoCarryMetrics(m) {
  if (!m) return m;
  return { ...m };
}
