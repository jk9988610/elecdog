// 染色体二倍体 / 单倍体 — 观察台展示用纯数据格式化

import {
  CHR_COUNT,
  CHR_LEN,
  SEX_PAIR_INDEX,
  expressAlleleDigit,
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
  if (!egg.total && !sperm.total) return null;
  return {
    eggMat: egg.maternal,
    eggPat: egg.paternal,
    spermMat: sperm.maternal,
    spermPat: sperm.paternal,
    eggLine: `卵方减数 ${egg.maternal}+${egg.paternal}（母源+父源同源）`,
    spermLine: `精方减数 ${sperm.maternal}+${sperm.paternal}（母源+父源同源）`,
    cardShort: `卵${egg.maternal}·${egg.paternal} 精${sperm.maternal}·${sperm.paternal}`,
    parentTotals: '母源12 · 父源12',
  };
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
    for (let j = 0; j < CHR_LEN; j++) {
      const ex = expressAlleleDigit(mat[j], pat[j]);
      expressed += ex.digit;
      if (ex.mode === 'codominant') codominantBits += 1;
      if (mat[j] !== pat[j]) heterozygousBits += 1;
    }
    rows.push({
      index: i,
      label: chromosomePairLabel(i),
      maternal: mat,
      paternal: pat,
      expressed,
      isSexPair: i === SEX_PAIR_INDEX,
      sexYOnPaternal: i === SEX_PAIR_INDEX && isSexYChromosome(pat),
      eggSeg: prov?.maternalSegregation?.[i] ?? null,
      spermSeg: prov?.paternalSegregation?.[i] ?? null,
      heterozygousBits,
      codominantBits,
    });
  }
  return rows;
}

/** 配子单倍体 12 条 + 减数分裂来源 */
export function haploidDisplayRows(haploid, segregation = null) {
  if (!haploid?.length) return [];
  const rows = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const chr = (haploid[i] ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    rows.push({
      index: i,
      label: chromosomePairLabel(i),
      sequence: chr,
      isSexPair: i === SEX_PAIR_INDEX,
      isY: i === SEX_PAIR_INDEX && isSexYChromosome(chr),
      segregation: segregation?.[i] ?? null,
    });
  }
  return rows;
}
