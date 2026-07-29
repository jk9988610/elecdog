/** Phase 78 — L6b 多情境开放泛化 */

import { analyzeWisdomOpenField } from './phase77-analyze.js';

export { analyzeWisdomOpenField };

function extSpread(metricsList) {
  const rates = metricsList.map((m) => m.externalRate ?? 0);
  if (!rates.length) return 0;
  return +(Math.max(...rates) - Math.min(...rates)).toFixed(4);
}

export function compareContextGeneralizationForSeed(byTreatment) {
  const base = byTreatment.w5_ctx_base;
  const shock = byTreatment.w5_ctx_shock;
  const sparse = byTreatment.w5_ctx_sparse;
  const juv = byTreatment.w5_ctx_juv;
  const all = [base, shock, sparse, juv];
  const alts = [shock, sparse, juv];
  const spread = extSpread(all);

  return {
    H1_allContextsViable: {
      verdict: all.every((m) => (m.aliveTotal ?? 0) >= 4) ? 'support' : all.every((m) => (m.aliveTotal ?? 0) >= 2) ? 'weak' : 'unsupport',
      alive: Object.fromEntries(
        ['base', 'shock', 'sparse', 'juv'].map((k, i) => [k, all[i].aliveTotal])
      ),
    },
    H2_wisdomLayersInAlt: {
      verdict: alts.every((m) => (m.prdCount ?? 0) >= 50 && (m.socEncCount ?? 0) >= 30)
        ? 'support'
        : alts.filter((m) => (m.prdCount ?? 0) >= 30).length >= 2
          ? 'weak'
          : 'unsupport',
      altPrd: { shock: shock.prdCount, sparse: sparse.prdCount, juv: juv.prdCount },
    },
    H3_contextSensitiveBehavior: {
      verdict: spread >= 0.012 ? 'support' : spread >= 0.006 ? 'weak' : 'unsupport',
      spread,
      rates: {
        base: base.externalRate,
        shock: shock.externalRate,
        sparse: sparse.externalRate,
        juv: juv.externalRate,
      },
    },
    H4_notSingleAttractor: {
      verdict:
        spread >= 0.008 &&
        Math.abs((shock.externalRate ?? 0) - (base.externalRate ?? 0)) >= 0.004
          ? 'support'
          : spread >= 0.005
            ? 'weak'
            : 'unsupport',
      baseVsShock: +((shock.externalRate ?? 0) - (base.externalRate ?? 0)).toFixed(4),
      spread,
    },
  };
}

export function verifyContextGeneralizationBatch(comparisons) {
  const h1 = comparisons.filter((c) => c.H1_allContextsViable.verdict === 'support').length;
  const h2 = comparisons.filter((c) => c.H2_wisdomLayersInAlt.verdict === 'support').length;
  const h3 = comparisons.filter((c) => c.H3_contextSensitiveBehavior.verdict === 'support').length;
  const h4 = comparisons.filter((c) => c.H4_notSingleAttractor.verdict === 'support').length;

  return {
    seedsCompared: comparisons.length,
    h1Support: h1,
    h2Support: h2,
    h3Support: h3,
    h4Support: h4,
    verdict:
      h1 >= 3 && h2 >= 3 && h3 >= 2
        ? 'support'
        : h1 + h2 + h3 + h4 >= 8
          ? 'weak'
          : 'unsupport',
  };
}
