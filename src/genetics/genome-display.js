// 染色体二倍体 / 单倍体 — 观察台展示用纯数据格式化

import {
  CHR_COUNT,
  CHR_LEN,
  SEX_PAIR_INDEX,
  combineAlleleDigit,
  isSexYChromosome,
} from './genome.js';

export function chromosomePairLabel(index) {
  if (index === SEX_PAIR_INDEX) return '性';
  return String(index + 1);
}

/** 二倍体每对：母源 / 父源 / 表达（按位 max） */
export function genomeDisplayRows(genome) {
  if (!genome?.pairs?.length) return [];
  const rows = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const pair = genome.pairs[i] ?? {};
    const mat = (pair.maternal ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    const pat = (pair.paternal ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    let expressed = '';
    for (let j = 0; j < CHR_LEN; j++) {
      expressed += combineAlleleDigit(mat[j], pat[j]);
    }
    rows.push({
      index: i,
      label: chromosomePairLabel(i),
      maternal: mat,
      paternal: pat,
      expressed,
      isSexPair: i === SEX_PAIR_INDEX,
      sexYOnPaternal: i === SEX_PAIR_INDEX && isSexYChromosome(pat),
    });
  }
  return rows;
}

/** 配子单倍体 12 条 */
export function haploidDisplayRows(haploid) {
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
    });
  }
  return rows;
}
