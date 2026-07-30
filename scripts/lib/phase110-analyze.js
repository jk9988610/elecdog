/** Phase 110 — GAP-13 留置链 × COOP/SOC 合作因果 */

import { analyzeTripleChain, slimCarryChainMetrics } from './phase109-analyze.js';
import { analyzeCooperationLayer } from './phase51-analyze.js';
import { analyzeSocialKnowledge } from './phase75-analyze.js';

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx;
    const vy = ys[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den ? +(num / den).toFixed(4) : null;
}

function meanTag(beings, tag, pick) {
  const pool = beings.filter((b) => b.cohortTag === tag);
  if (!pool.length) return null;
  return +(pool.reduce((s, b) => s + pick(b), 0) / pool.length).toFixed(4);
}

function countTagAlive(beings, tag) {
  return beings.filter((b) => b.cohortTag === tag && b.alive).length;
}

export function analyzeCoopCausalChain(recorder, beings, world, ctx) {
  const chain = analyzeTripleChain(recorder, beings, world, ctx);
  const coop = analyzeCooperationLayer(recorder, beings, world);
  const soc = analyzeSocialKnowledge(recorder, beings, world, { ticks: ctx?.ticks });

  const alive = beings.filter((b) => b.alive);
  const crossRx = alive.map((b) => b.socCrossRx ?? 0);
  const coopTrans = alive.map((b) => b.coopTransitions ?? 0);
  const fiss = alive.map((b) => b.fissionCount ?? 0);
  const gens = alive.map((b) => b.generation ?? 0);

  const carryCrossRx = meanTag(beings, 'carry', (b) => b.socCrossRx ?? 0);
  const naiveCrossRx = meanTag(beings, 'naive', (b) => b.socCrossRx ?? 0);
  const carryCoopTrans = meanTag(beings, 'carry', (b) => b.coopTransitions ?? 0);
  const naiveCoopTrans = meanTag(beings, 'naive', (b) => b.coopTransitions ?? 0);
  const carryAlive = countTagAlive(beings, 'carry');
  const naiveAlive = countTagAlive(beings, 'naive');

  return {
    ...chain,
    coopTransitionCount: coop.coopTransitionCount,
    coopModes: coop.coopModes,
    meanCrossRx: coop.meanCrossRx,
    meanContest: coop.meanContest,
    meanCoopTransitions: coop.meanCoopTransitions,
    socEncCount: soc.socEncCount,
    socLinCount: soc.socLinCount,
    meanSocLoad: soc.meanSocLoad,
    cooperationEnabled: world.envProfile?.cooperationProfileEnabled === true,
    socialKnowledgeEnabled: world.envProfile?.socialKnowledgeEnabled === true,
    carryCrossRx,
    naiveCrossRx,
    carryCoopTrans,
    naiveCoopTrans,
    carryAlive,
    naiveAlive,
    crossRxCoopCorr: pearson(crossRx, coopTrans),
    crossRxFissCorr: pearson(crossRx, fiss),
    coopGenCorr: pearson(coopTrans, gens),
    carryCoopAdvantage: carryCoopTrans != null && naiveCoopTrans != null
      ? +(carryCoopTrans - naiveCoopTrans).toFixed(4)
      : null,
    carryCrossRxAdvantage: carryCrossRx != null && naiveCrossRx != null
      ? +(carryCrossRx - naiveCrossRx).toFixed(4)
      : null,
  };
}

export function verifyCoopCausalBatch(byTreatment) {
  const offRuns = byTreatment.ev110_coop_off ?? [];
  const onRuns = byTreatment.ev110_coop_on ?? [];
  const socRuns = byTreatment.ev110_coop_soc ?? [];

  const offOk = offRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const onOk = onRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const socOk = socRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const allOn = [...onOk, ...socOk];

  const h1 = offOk.length >= 2 && onOk.length >= 2;
  const h2 = [...offOk, ...onOk, ...socOk].every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = onOk.some((r) => (r.metrics.coopTransitionCount ?? 0) >= 1);
  const h4 = socOk.some((r) => (r.metrics.socEncCount ?? 0) >= 15);
  const h5 = allOn.some(
    (r) =>
      (r.metrics.carryCoopAdvantage ?? 0) > 0 ||
      (r.metrics.carryCrossRxAdvantage ?? 0) > 0
  );
  const h6 = allOn.some(
    (r) => (r.metrics.coopModes?.MESH ?? 0) + (r.metrics.coopModes?.RIVAL ?? 0) >= 2
  );
  const h7 = allOn.some(
    (r) =>
      r.metrics.crossRxCoopCorr != null && Math.abs(r.metrics.crossRxCoopCorr) >= 0.3
  );

  const meanCoop = (runs) =>
    runs.length
      ? runs.reduce((s, r) => s + (r.metrics.coopTransitionCount ?? 0), 0) / runs.length
      : 0;
  const coopLift = meanCoop(onOk) - meanCoop(offOk);

  const support = [h1, h2, h3, h4, h5, h6, h7].filter(Boolean).length;
  return {
    h1ChainImport: h1,
    h2NoRen: h2,
    h3CoopObservable: h3,
    h4SocObservable: h4,
    h5CarryCoopAdvantage: h5,
    h6MeshRival: h6,
    h7CrossRxCoopCorr: h7,
    coopLift: +coopLift.toFixed(2),
    verdict: support >= 5 ? 'support' : support >= 4 ? 'weak' : support >= 3 ? 'pending' : 'unsupport',
    support,
  };
}

export { slimCarryChainMetrics };
