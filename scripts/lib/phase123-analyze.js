/** Phase 123 — GAP-13 留置繁殖×SOC 继承交互假说 */

import { analyzeSocialKnowledge } from './phase75-analyze.js';
import { analyzeCoopCausalLongLaw } from './phase121-analyze.js';
import { seedConsistency } from './phase123-seed.js';

function meanRuns(runs, pick) {
  const vals = runs.map(pick).filter((v) => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function carryLineageSocLoad(beings) {
  const pool = beings.filter(
    (b) =>
      b.alive &&
      (b.cohortTag === 'carry' || (b.carryProvenance?.chain?.length ?? 0) > 0)
  );
  if (!pool.length) return null;
  return +(
    pool.reduce((s, b) => {
      const trace = b.socTrace ?? [0, 0, 0];
      const encode = b.socEncode ?? [0, 0, 0];
      return s + (trace[2] ?? 0) + (encode[2] ?? 0) * 0.5;
    }, 0) / pool.length
  ).toFixed(4);
}

/**
 * 留置交互假说：COOP+SOC 开启时，留置繁殖（carriedFiss）触发可度量的 SOC-LIN 继承，
 * 而非比较 carry vs naive 的 COOP 跃迁均值。
 */
export function analyzeCarryInteractionLaw(recorder, beings, world, ctx) {
  const base = analyzeCoopCausalLongLaw(recorder, beings, world, ctx);
  const soc = analyzeSocialKnowledge(recorder, beings, world, { ticks: ctx?.ticks });
  const carriedFiss = base.carriedFiss ?? 0;
  const socLin = base.socLinCount ?? soc.socLinCount ?? 0;
  const carryReproSocYield =
    carriedFiss > 0 ? +(socLin / carriedFiss).toFixed(4) : socLin > 0 ? socLin : 0;
  const offspringGap =
    soc.offspringExternalRate != null && soc.seedExternalRate != null
      ? +(soc.offspringExternalRate - soc.seedExternalRate).toFixed(4)
      : null;

  return {
    ...base,
    meanSocLoad: soc.meanSocLoad,
    socEncCount: soc.socEncCount,
    socLinCount: soc.socLinCount,
    offspringExternalRate: soc.offspringExternalRate,
    seedExternalRate: soc.seedExternalRate,
    carryReproSocYield,
    offspringExternalGap: offspringGap,
    carryLineageSocLoad: carryLineageSocLoad(beings),
    interactionHypothesis: 'carry_repro_soc_yield',
  };
}

export function verifyCarryInteractionLawBatch(byTreatment) {
  const onRuns = byTreatment.ev123_coop_interact ?? [];
  const offRuns = byTreatment.ev123_coop_off_interact ?? [];

  const onOk = onRuns.filter((r) => (r.carryCount ?? 0) > 0);
  const offOk = offRuns.filter((r) => (r.carryCount ?? 0) > 0);

  const h1 = onOk.length >= 3 && offOk.length >= 3;
  const h2 = [...onOk, ...offOk].every((r) => (r.metrics.renCount ?? 0) === 0);
  const h3 = onOk.every((r) => (r.metrics.socEncCount ?? 0) >= 1000);

  const yieldLaw = seedConsistency(onOk, (r) => r.metrics.carryReproSocYield ?? 0, {
    minPositive: 3,
  });
  const h4 =
    yieldLaw.pass === true && onOk.every((r) => (r.metrics.carryReproSocYield ?? 0) >= 8);

  const h5 = onOk.filter((r) => (r.metrics.meanSocLoad ?? 0) >= 0.5).length >= 3;

  const meanYieldOn = meanRuns(onOk, (r) => r.metrics.carryReproSocYield ?? 0);
  const meanYieldOff = meanRuns(offOk, (r) => r.metrics.carryReproSocYield ?? 0);
  const h6 = meanYieldOn > meanYieldOff && meanYieldOn >= 8;

  const h7 = onOk.every((r) => !r.deadlineHit);
  const h8 = onOk.every((r) => (r.metrics.tickCompletionRate ?? 0) >= 0.95);
  const h9 = onOk.every((r) => (r.metrics.maxChainDepth ?? 0) >= 5);

  const passed = [h1, h2, h3, h4, h5, h6, h7, h8, h9].filter(Boolean).length;
  const support = passed;

  return {
    hypothesis: 'carry_repro_soc_yield',
    priorHypothesis: 'carry_coop_advantage',
    h1MultiBatchImport: h1,
    h2NoRen: h2,
    h3SocEncRobust: h3,
    h4CarryReproSocYieldLaw: h4,
    h5SocLoadLaw: h5,
    h6InteractOnBeatsOff: h6,
    h7NoDeadline: h7,
    h8TickComplete: h8,
    h9ChainDepth5: h9,
    carryReproSocYieldPositiveSeeds: yieldLaw.count,
    carryReproSocYieldLawRate: yieldLaw.rate,
    meanCarryReproSocYieldOn: +meanYieldOn.toFixed(4),
    meanCarryReproSocYieldOff: +meanYieldOff.toFixed(4),
    passed,
    total: 9,
    support,
    verdict:
      passed >= 7 ? 'support' : passed >= 6 ? 'weak' : passed >= 5 ? 'pending' : 'unsupport',
  };
}

export { slimCarryChainMetrics } from './phase118-analyze.js';
