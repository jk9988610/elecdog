// 染色体二倍体 / 单倍体 — 观察台展示用纯数据格式化

import {
  CHR_COUNT,
  CHR_LEN,
  SEX_PAIR_INDEX,
  CHR_ZONE_BY_PAIR,
  expressAlleleDigitForZone,
  isSexYChromosome,
} from './genome.js';

export function chromosomePairLabel(index) {
  if (index === SEX_PAIR_INDEX) return '性';
  return String(index + 1);
}

export const SEGREGATION_LABEL = {
  maternal: '母源',
  paternal: '父源',
};

export function segregationLabel(side) {
  return SEGREGATION_LABEL[side] ?? '—';
}

export function countSegregation(segregation) {
  let maternal = 0;
  let paternal = 0;
  for (const s of segregation ?? []) {
    if (s === 'maternal') maternal += 1;
    else if (s === 'paternal') paternal += 1;
  }
  return { maternal, paternal, total: maternal + paternal };
}

/** 子代 provenance：父母各贡献 12 条 + 减数分裂同源统计 */
export function provenanceContributionLines(provenance) {
  if (!provenance) return null;
  const egg = countSegregation(provenance.maternalSegregation);
  const sperm = countSegregation(provenance.paternalSegregation);
  const eggX = countCrossovers(provenance.maternalCrossovers);
  const spermX = countCrossovers(provenance.paternalCrossovers);
  if (!egg.total && !sperm.total && !eggX && !spermX) return null;
  return {
    eggMat: egg.maternal,
    eggPat: egg.paternal,
    spermMat: sperm.maternal,
    spermPat: sperm.paternal,
    eggCross: eggX,
    spermCross: spermX,
    eggLine: `卵方减数 ${egg.maternal}+${egg.paternal}（母源+父源同源）`,
    spermLine: `精方减数 ${sperm.maternal}+${sperm.paternal}（母源+父源同源）`,
    cardShort: `卵${egg.maternal}·${egg.paternal} 精${sperm.maternal}·${sperm.paternal}${eggX + spermX > 0 ? ` ×${eggX + spermX}` : ''}`,
    parentTotals: '母源12 · 父源12',
  };
}

/** 族谱登记用紧凑 inherit（无完整 provenance 数组） */
export function provenanceToInheritDetail(provenance) {
  const lines = provenanceContributionLines(provenance);
  if (!lines) return null;
  return {
    eggMat: lines.eggMat,
    eggPat: lines.eggPat,
    spermMat: lines.spermMat,
    spermPat: lines.spermPat,
    eggCross: lines.eggCross ?? 0,
    spermCross: lines.spermCross ?? 0,
    cardShort: lines.cardShort,
  };
}

/** 活体 genome 或登记 inheritDetail */
export function inheritSummaryFromBeing(being) {
  if (being?.genome?.provenance) return provenanceContributionLines(being.genome.provenance);
  const d = being?.inheritDetail;
  if (!d) return null;
  const eggMat = d.eggMat ?? 0;
  const eggPat = d.eggPat ?? 0;
  const spermMat = d.spermMat ?? 0;
  const spermPat = d.spermPat ?? 0;
  const eggX = d.eggCross ?? 0;
  const spermX = d.spermCross ?? 0;
  if (!eggMat && !eggPat && !spermMat && !spermPat && !eggX && !spermX) return null;
  const cardShort = being.inheritSummary ?? d.cardShort ?? `卵${eggMat}·${eggPat} 精${spermMat}·${spermPat}`;
  return {
    eggMat,
    eggPat,
    spermMat,
    spermPat,
    eggCross: eggX,
    spermCross: spermX,
    eggLine: `卵方减数 ${eggMat}+${eggPat}（母源+父源同源）`,
    spermLine: `精方减数 ${spermMat}+${spermPat}（母源+父源同源）`,
    cardShort,
    parentTotals: '母源12 · 父源12',
  };
}

export function formatCrossoverLog(crossovers) {
  const parts = [];
  for (let i = 0; i < (crossovers?.length ?? 0); i++) {
    const c = crossovers[i];
    if (c != null) parts.push(`${i + 1}:${c}`);
  }
  if (!parts.length) return '';
  return `cross ${parts.join(' ')}`;
}

/** 二倍体每对：母源 / 父源 / 表达（显性规则） */
export function genomeDisplayRows(genome) {
  if (!genome?.pairs?.length) return [];
  const prov = genome.provenance;
  const rows = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const pair = genome.pairs[i] ?? {};
    const mat = (pair.maternal ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    const pat = (pair.paternal ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    let expressed = '';
    let heterozygousBits = 0;
    let codominantBits = 0;
    const zone = CHR_ZONE_BY_PAIR[i] ?? 'Z2';
    for (let j = 0; j < CHR_LEN; j++) {
      const ex = expressAlleleDigitForZone(zone, mat[j], pat[j]);
      expressed += ex.digit;
      if (ex.mode === 'codominant') codominantBits += 1;
      if (mat[j] !== pat[j]) heterozygousBits += 1;
    }
    rows.push({
      index: i,
      label: chromosomePairLabel(i),
      zone: CHR_ZONE_BY_PAIR[i] ?? null,
      maternal: mat,
      paternal: pat,
      expressed,
      isSexPair: i === SEX_PAIR_INDEX,
      sexYOnPaternal: i === SEX_PAIR_INDEX && isSexYChromosome(pat),
      eggSeg: prov?.maternalSegregation?.[i] ?? null,
      spermSeg: prov?.paternalSegregation?.[i] ?? null,
      eggCross: prov?.maternalCrossovers?.[i] ?? null,
      spermCross: prov?.paternalCrossovers?.[i] ?? null,
      heterozygousBits,
      codominantBits,
    });
  }
  return rows;
}

/** 配子单倍体 12 条 + 减数分裂来源 */
export function haploidDisplayRows(haploid, segregation = null, crossovers = null) {
  if (!haploid?.length) return [];
  const rows = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const chr = (haploid[i] ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    rows.push({
      index: i,
      label: chromosomePairLabel(i),
      zone: CHR_ZONE_BY_PAIR[i] ?? null,
      sequence: chr,
      isSexPair: i === SEX_PAIR_INDEX,
      isY: i === SEX_PAIR_INDEX && isSexYChromosome(chr),
      segregation: segregation?.[i] ?? null,
      crossover: crossovers?.[i] ?? null,
    });
  }
  return rows;
}

export function countCrossovers(crossovers) {
  let n = 0;
  for (const c of crossovers ?? []) {
    if (c != null) n += 1;
  }
  return n;
}
