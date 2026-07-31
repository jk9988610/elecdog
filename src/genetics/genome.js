// 简化染色体遗传 — 12 对 × 8 位；减数分裂 + 受精；性染色体决定 pairMorph

import { hashString, mulberry32 } from '../core/hash.js';
import { generateTemplate, mutate, reduceDna, recombineDna } from '../core/dna.js';

const BASES = ['0', '1', '2', '3'];

export const CHR_COUNT = 12;
export const CHR_LEN = 8;
export const GENOME_LEN = CHR_COUNT * CHR_LEN;
export const SEX_PAIR_INDEX = 11;
export const SEX_Y_DIGIT = '3';

/** 12 对 ↔ Z1–Z6（每区 2 对 × 8 位 = 16 位） */
export const CHR_ZONE_BY_PAIR = [
  'Z1', 'Z1', 'Z2', 'Z2', 'Z3', 'Z3', 'Z4', 'Z4', 'Z5', 'Z5', 'Z6', 'Z6',
];

export function crossoverEnabled(profile) {
  if (profile?.meiCrossoverEnabled === false) return false;
  return profile?.meiCrossoverEnabled === true || profile?.multicellV2Enabled === true;
}

export function crossoverRate(profile) {
  if (!crossoverEnabled(profile)) return 0;
  return profile?.meiCrossoverRate ?? 0.32;
}

function crossoverAtPoint(mat, pat, point) {
  const m = mat.padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
  const p = pat.padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
  return {
    maternal: m.slice(0, point) + p.slice(point),
    paternal: p.slice(0, point) + m.slice(point),
  };
}

export function chromosomeGeneticsEnabled(profile) {
  if (profile?.chromosomeGenetics === false) return false;
  return profile?.chromosomeGenetics === true || profile?.multicellV2Enabled === true;
}

export function isSexYChromosome(chr) {
  return chr?.[0] === SEX_Y_DIGIT;
}

/** 合子父源性染色体为 Y → 形态 A（雄）；否则 B（雌） */
export function derivePairMorphFromGenome(genome) {
  const pat = genome?.pairs?.[SEX_PAIR_INDEX]?.paternal;
  return isSexYChromosome(pat) ? 'A' : 'B';
}

export function splitSequenceToHaploid(seq) {
  const s = (seq ?? '').padEnd(GENOME_LEN, '0').slice(0, GENOME_LEN);
  const haploid = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    haploid.push(s.slice(i * CHR_LEN, (i + 1) * CHR_LEN));
  }
  return haploid;
}

export function flattenHaploid(haploid) {
  return (haploid ?? []).map((c) => (c ?? '').slice(0, CHR_LEN).padEnd(CHR_LEN, '0')).join('');
}

/** 单等位表达：纯合 / 强显性(差≥2) / 共显性(差=1 取上取整均值) */
export function expressAlleleDigit(a, b) {
  const ma = Number(a ?? 0);
  const mb = Number(b ?? 0);
  if (ma === mb) {
    return { digit: String(ma), mode: 'homozygous' };
  }
  const hi = Math.max(ma, mb);
  const lo = Math.min(ma, mb);
  if (hi - lo >= 2) {
    return { digit: String(hi), mode: 'dominant' };
  }
  const blended = Math.min(3, Math.ceil((ma + mb) / 2));
  return { digit: String(blended), mode: 'codominant' };
}

/** Z 区差异化显性：Z3/Z4 偏共显；Z1/Z6 偏强显性；Z2/Z5 默认 */
export function expressAlleleDigitForZone(zone, a, b) {
  const ma = Number(a ?? 0);
  const mb = Number(b ?? 0);
  if (ma === mb) {
    return { digit: String(ma), mode: 'homozygous' };
  }
  const hi = Math.max(ma, mb);
  const lo = Math.min(ma, mb);
  const diff = hi - lo;
  const blend = () => {
    const digit = String(Math.min(3, Math.ceil((ma + mb) / 2)));
    return { digit, mode: 'codominant' };
  };
  if (zone === 'Z3' || zone === 'Z4') {
    return blend();
  }
  if (zone === 'Z1' || zone === 'Z6') {
    return { digit: String(hi), mode: 'dominant' };
  }
  if (diff >= 2) {
    return { digit: String(hi), mode: 'dominant' };
  }
  return blend();
}

export function combineAlleleDigit(a, b) {
  return expressAlleleDigit(a, b).digit;
}

/** 按位合并双等位 → 96 位表达串（供 Z1–Z6 哈希与指纹） */
export function diploidExpressSequence(genome) {
  if (!genome?.pairs?.length) return '';
  let out = '';
  for (let i = 0; i < CHR_COUNT; i++) {
    const pair = genome.pairs[i] ?? {};
    const mat = (pair.maternal ?? '').padEnd(CHR_LEN, '0');
    const pat = (pair.paternal ?? '').padEnd(CHR_LEN, '0');
    const zone = CHR_ZONE_BY_PAIR[i];
    for (let j = 0; j < CHR_LEN; j++) {
      out += expressAlleleDigitForZone(zone, mat[j], pat[j]).digit;
    }
  }
  return out.slice(0, GENOME_LEN);
}

export function diploidFromHaploids(maternalHaploid, paternalHaploid) {
  const pairs = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const mat = (maternalHaploid?.[i] ?? '00000000').slice(0, CHR_LEN).padEnd(CHR_LEN, '0');
    const pat = (paternalHaploid?.[i] ?? '00000000').slice(0, CHR_LEN).padEnd(CHR_LEN, '0');
    pairs.push({ maternal: mat, paternal: pat });
  }
  return { pairs };
}

function makeSexChromosome(isY, seed) {
  const rng = mulberry32(seed);
  let s = '';
  for (let i = 0; i < CHR_LEN; i++) {
    if (i === 0) {
      s += isY ? SEX_Y_DIGIT : BASES[Math.floor(rng() * 3)];
    } else {
      s += BASES[Math.floor(rng() * 4)];
    }
  }
  return s;
}

/** 成体队列等显式 morph 时校正性染色体对 */
export function setSexPairForMorph(genome, morph) {
  if (!genome?.pairs?.[SEX_PAIR_INDEX]) return genome;
  const seed = hashString(`${morph}:sex:${genome.pairs[0]?.maternal ?? ''}`);
  const pair = genome.pairs[SEX_PAIR_INDEX];
  if (morph === 'A') {
    pair.maternal = makeSexChromosome(false, seed);
    pair.paternal = makeSexChromosome(true, seed + 1);
  } else {
    pair.maternal = makeSexChromosome(false, seed);
    pair.paternal = makeSexChromosome(false, seed + 2);
  }
  return genome;
}

function haploidFromMutatedTemplate(code, seed) {
  const template = generateTemplate(code);
  const { seq } = mutate(template, 0.02, seed);
  return splitSequenceToHaploid(seq);
}

/** 随机二倍体：母源/父源各一套单倍体 */
export function createRandomDiploid(code, morph = null, seed = 0) {
  const s0 = hashString(`${code}:${seed}:mat`);
  const s1 = hashString(`${code}:${seed}:pat`);
  const genome = diploidFromHaploids(
    haploidFromMutatedTemplate(code, s0),
    haploidFromMutatedTemplate(code, s1)
  );
  if (morph === 'A' || morph === 'B') {
    setSexPairForMorph(genome, morph);
  }
  return genome;
}

/** 减数分裂：可选同源交叉互换 → 随机分离，记录来源 */
export function meiosis(genome, seed, { crossoverRate: rate = 0 } = {}) {
  const rng = mulberry32(seed);
  const haploid = [];
  const segregation = [];
  const crossovers = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const pair = genome.pairs[i] ?? {};
    let mat = (pair.maternal ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    let pat = (pair.paternal ?? '').padEnd(CHR_LEN, '0').slice(0, CHR_LEN);
    let crossPoint = null;
    if (i !== SEX_PAIR_INDEX && rate > 0 && rng() < rate) {
      crossPoint = 1 + Math.floor(rng() * (CHR_LEN - 1));
      const crossed = crossoverAtPoint(mat, pat, crossPoint);
      mat = crossed.maternal;
      pat = crossed.paternal;
    }
    crossovers.push(crossPoint);
    const fromMaternal = rng() < 0.5;
    haploid.push(fromMaternal ? mat : pat);
    segregation.push(fromMaternal ? 'maternal' : 'paternal');
  }
  return { haploid, segregation, crossovers };
}

/** 受精：卵单倍体 → 母源；精单倍体 → 父源 */
export function fertilize(eggHaploid, spermHaploid, provenance = null) {
  const pairs = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const mat = (eggHaploid?.[i] ?? '00000000').slice(0, CHR_LEN).padEnd(CHR_LEN, '0');
    const pat = (spermHaploid?.[i] ?? '00000000').slice(0, CHR_LEN).padEnd(CHR_LEN, '0');
    pairs.push({ maternal: mat, paternal: pat });
  }
  const genome = { pairs };
  if (provenance) genome.provenance = provenance;
  return genome;
}

export function mutateDiploid(genome, rate = 0.015, seed = 0) {
  const rng = mulberry32(seed);
  let mutationCount = 0;
  const pairs = genome.pairs.map((pair) => {
    const maternal = pair.maternal.split('');
    const paternal = pair.paternal.split('');
    for (let i = 0; i < CHR_LEN; i++) {
      if (rng() < rate) {
        const choices = BASES.filter((b) => b !== maternal[i]);
        maternal[i] = choices[Math.floor(rng() * choices.length)];
        mutationCount++;
      }
      if (rng() < rate) {
        const choices = BASES.filter((b) => b !== paternal[i]);
        paternal[i] = choices[Math.floor(rng() * choices.length)];
        mutationCount++;
      }
    }
    return { maternal: maternal.join(''), paternal: paternal.join('') };
  });
  return { genome: { pairs, provenance: genome.provenance ?? null }, mutationCount };
}

/** 成体产生配子（染色体路径）或回退 reduceDna */
export function produceGamete(being, profile, seed) {
  if (!chromosomeGeneticsEnabled(profile)) {
    const seq = reduceDna(being.dna.sequence, seed);
    return { seq, haploid: splitSequenceToHaploid(seq) };
  }
  const genome = being?.genome;
  if (!genome?.pairs?.length) {
    throw new Error('produceGamete: being lacks diploid genome');
  }
  const { haploid, segregation, crossovers } = meiosis(genome, seed, {
    crossoverRate: crossoverRate(profile),
  });
  return { haploid, segregation, crossovers, seq: flattenHaploid(haploid) };
}

/** 双配子 → 合子二倍体 + 表达串 */
export function zygoteFromGametes(
  seqA,
  seqB,
  profile,
  seed,
  { eggIsB = true, eggSegregation = null, spermSegregation = null, eggCrossovers = null, spermCrossovers = null } = {}
) {
  if (!chromosomeGeneticsEnabled(profile)) {
    const combined = recombineDna(seqA, seqB, seed);
    const { seq, mutationCount } = mutate(combined, profile?.fusionMutationRate ?? 0.015, seed + 1);
    return { dnaSeq: seq, genome: null, mutationCount };
  }
  const haploidA = splitSequenceToHaploid(seqA);
  const haploidB = splitSequenceToHaploid(seqB);
  const eggH = eggIsB ? haploidB : haploidA;
  const spermH = eggIsB ? haploidA : haploidB;
  const eggSeg = eggIsB ? eggSegregation : spermSegregation;
  const spermSeg = eggIsB ? spermSegregation : eggSegregation;
  const eggCross = eggIsB ? eggCrossovers : spermCrossovers;
  const spermCross = eggIsB ? spermCrossovers : eggCrossovers;
  const provenance =
    eggSeg?.length || spermSeg?.length || eggCross?.length || spermCross?.length
      ? {
          maternalSegregation: eggSeg ?? null,
          paternalSegregation: spermSeg ?? null,
          maternalCrossovers: eggCross ?? null,
          paternalCrossovers: spermCross ?? null,
        }
      : null;
  let genome = fertilize(eggH, spermH, provenance);
  const { genome: mutated, mutationCount } = mutateDiploid(
    genome,
    profile?.fusionMutationRate ?? 0.015,
    seed + 1
  );
  return {
    dnaSeq: diploidExpressSequence(mutated),
    genome: mutated,
    mutationCount,
  };
}
