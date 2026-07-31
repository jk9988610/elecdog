// 简化染色体遗传 — 12 对 × 8 位；减数分裂 + 受精；性染色体决定 pairMorph

import { hashString, mulberry32 } from '../core/hash.js';
import { generateTemplate, mutate, reduceDna, recombineDna } from '../core/dna.js';

const BASES = ['0', '1', '2', '3'];

export const CHR_COUNT = 12;
export const CHR_LEN = 8;
export const GENOME_LEN = CHR_COUNT * CHR_LEN;
export const SEX_PAIR_INDEX = 11;
export const SEX_Y_DIGIT = '3';

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

export function combineAlleleDigit(a, b) {
  const ma = Number(a ?? 0);
  const mb = Number(b ?? 0);
  return String(Math.max(ma, mb));
}

/** 按位合并双等位 → 96 位表达串（供 Z1–Z6 哈希与指纹） */
export function diploidExpressSequence(genome) {
  if (!genome?.pairs?.length) return '';
  let out = '';
  for (let i = 0; i < CHR_COUNT; i++) {
    const pair = genome.pairs[i] ?? {};
    const mat = (pair.maternal ?? '').padEnd(CHR_LEN, '0');
    const pat = (pair.paternal ?? '').padEnd(CHR_LEN, '0');
    for (let j = 0; j < CHR_LEN; j++) {
      out += combineAlleleDigit(mat[j], pat[j]);
    }
  }
  return out.slice(0, GENOME_LEN);
}

/** 旧单串存档 → 纯合二倍体（每对两条相同） */
export function sequenceToDiploid(seq) {
  const haploid = splitSequenceToHaploid(seq);
  return {
    pairs: haploid.map((chr) => ({ maternal: chr, paternal: chr })),
  };
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

/** 减数分裂：每对随机分离一条进入配子 */
export function meiosis(genome, seed) {
  const rng = mulberry32(seed);
  const haploid = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const pair = genome.pairs[i] ?? {};
    haploid.push(rng() < 0.5 ? pair.maternal : pair.paternal);
  }
  return haploid;
}

/** 受精：卵单倍体 → 母源；精单倍体 → 父源 */
export function fertilize(eggHaploid, spermHaploid) {
  const pairs = [];
  for (let i = 0; i < CHR_COUNT; i++) {
    const mat = (eggHaploid?.[i] ?? '00000000').slice(0, CHR_LEN).padEnd(CHR_LEN, '0');
    const pat = (spermHaploid?.[i] ?? '00000000').slice(0, CHR_LEN).padEnd(CHR_LEN, '0');
    pairs.push({ maternal: mat, paternal: pat });
  }
  return { pairs };
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
  return { genome: { pairs }, mutationCount };
}

export function ensureBeingGenome(being) {
  if (being?.genome?.pairs?.length === CHR_COUNT) return being.genome;
  const genome = sequenceToDiploid(being?.dna?.sequence ?? '');
  being.genome = genome;
  return genome;
}

/** 成体产生配子（染色体路径）或回退 reduceDna */
export function produceGamete(being, profile, seed) {
  if (!chromosomeGeneticsEnabled(profile)) {
    const seq = reduceDna(being.dna.sequence, seed);
    return { seq, haploid: splitSequenceToHaploid(seq) };
  }
  const genome = ensureBeingGenome(being);
  const haploid = meiosis(genome, seed);
  return { haploid, seq: flattenHaploid(haploid) };
}

/** 双配子 → 合子二倍体 + 表达串 */
export function zygoteFromGametes(seqA, seqB, profile, seed, { eggIsB = true } = {}) {
  if (!chromosomeGeneticsEnabled(profile)) {
    const combined = recombineDna(seqA, seqB, seed);
    const { seq, mutationCount } = mutate(combined, profile?.fusionMutationRate ?? 0.015, seed + 1);
    return { dnaSeq: seq, genome: sequenceToDiploid(seq), mutationCount };
  }
  const haploidA = splitSequenceToHaploid(seqA);
  const haploidB = splitSequenceToHaploid(seqB);
  const eggH = eggIsB ? haploidB : haploidA;
  const spermH = eggIsB ? haploidA : haploidB;
  let genome = fertilize(eggH, spermH);
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

export function attachGenomeFromSequence(being, sequence, morph = null) {
  const genome = sequenceToDiploid(sequence);
  if (morph === 'A' || morph === 'B') {
    setSexPairForMorph(genome, morph);
  }
  being.genome = genome;
  being.dna.sequence = diploidExpressSequence(genome);
  return genome;
}
