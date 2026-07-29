/** Phase 65 — 意识交叉验证：EHU × 长时 × 多体信号链（个体级计数，无全量日志） */

import { analyzeCodexConsciousness } from './phase63-analyze.js';

function sumBeingField(beings, pick) {
  return beings.reduce((s, b) => s + (pick(b) ?? 0), 0);
}

/** 从初始队列个体的 socTx/socRx/socCrossRx 推断多体信号活跃度 */
export function analyzeCohortSignalActivity(beings, cohortIds = []) {
  const cohortSet = new Set(cohortIds);
  const cohort =
    cohortSet.size > 0 ? beings.filter((b) => cohortSet.has(b.id)) : beings.slice(0, 4);

  const txCount = sumBeingField(cohort, (b) => b.socTx);
  const rxCount = sumBeingField(cohort, (b) => b.socRx);
  const crossRx = sumBeingField(cohort, (b) => b.socCrossRx);
  const txBeings = cohort.filter((b) => (b.socTx ?? 0) >= 1).length;
  const rxBeings = cohort.filter((b) => (b.socRx ?? 0) >= 1).length;

  // 多跳可观测：布尔代理 + 原始计数（避免 crossRx 累积被误读为链数）
  const chainObservable = txBeings >= 2 && rxBeings >= 2 && crossRx >= 10;
  const threeHopObservable = txBeings >= 3 && rxBeings >= 3 && crossRx >= 30;

  return {
    txCount,
    rxCount,
    crossRx,
    txBeings,
    rxBeings,
    chainObservable,
    twoPlusHopChains: chainObservable ? 1 : 0,
    threeHopChains: threeHopObservable ? 1 : 0,
  };
}

export function analyzeConsciousnessCrossValidate(recorder, beings, world, { cohortIds = [], ticks } = {}) {
  const consciousness = analyzeCodexConsciousness(recorder, beings, world);
  const signal = analyzeCohortSignalActivity(beings, cohortIds);

  const alive = beings.filter((b) => b.alive);
  const cohortSet = new Set(cohortIds);
  const cohortAlive = cohortSet.size
    ? alive.filter((b) => cohortSet.has(b.id))
    : alive.slice(0, 4);
  const h3WithCrossRx = cohortAlive.filter(
    (b) => (b.ehuStage ?? 'H0') === 'H3' && (b.socCrossRx ?? 0) > 0
  ).length;

  return {
    ...consciousness,
    cohortSize: cohortIds.length || Math.min(4, beings.length),
    aliveTotal: alive.length,
    ...signal,
    totalCrossRx: signal.crossRx,
    meanCrossRx: cohortAlive.length
      ? +(signal.crossRx / cohortAlive.length).toFixed(2)
      : 0,
    h3WithCrossRx,
    tickWindow: ticks ?? world.tick,
  };
}

export function verifyConsciousnessCrossValidate(full, off) {
  return {
    H1_h3WithMultiBody: {
      verdict: (full.h3Share ?? 0) >= 0.85 && full.aliveTotal >= 3 ? 'support' : 'weak',
      h3Share: full.h3Share,
      alive: full.aliveTotal,
    },
    H2_signalChainActive: {
      verdict: full.chainObservable ? 'support' : (full.txCount ?? 0) >= 20 ? 'weak' : 'unsupport',
      threeHop: full.threeHopChains,
      twoPlus: full.twoPlusHopChains,
      tx: full.txCount,
      rx: full.rxCount,
      crossRx: full.crossRx,
    },
    H3_ehuCoexistsWithChain: {
      verdict: full.stackCoexist && full.chainObservable ? 'support' : 'weak',
      stackCoexist: full.stackCoexist,
      chainObservable: full.chainObservable,
    },
    H4_crossRxBindsH3: {
      verdict: (full.h3WithCrossRx ?? 0) >= 1 && (full.meanCrossRx ?? 0) >= 1 ? 'support' : 'weak',
      h3WithCrossRx: full.h3WithCrossRx,
      meanCrossRx: full.meanCrossRx,
    },
    H5_ehuOffNoH3: {
      verdict: (off.h3Share ?? 0) < 0.1 && (off.ehuTransitionCount ?? 0) === 0 ? 'support' : 'weak',
      offH3: off.h3Share,
      offEhu: off.ehuTransitionCount,
    },
    H6_chainWithoutEhu: {
      verdict: off.chainObservable ? 'support' : (off.txCount ?? 0) >= 15 ? 'weak' : 'unsupport',
      offChain: off.chainObservable,
      offTx: off.txCount,
    },
  };
}
