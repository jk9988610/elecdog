// DNA 分区表达 — Z1–Z6 哈希派生（96 位四态串，机制层无地球基因名）

import { hashString, mulberry32 } from '../core/hash.js';
import { diploidExpressSequence } from './genome.js';

export const DNA_LENGTH = 96;

/** 区段起点冻结常量（与 DNA_EXPRESSION.md 对齐） */
export const DNA_ZONES = {
  Z1: { start: 0, end: 16, tag: 'axis' },
  Z2: { start: 16, end: 32, tag: 'morph' },
  Z3: { start: 32, end: 48, tag: 'hormone' },
  Z4: { start: 48, end: 64, tag: 'neural' },
  Z5: { start: 64, end: 80, tag: 'sense' },
  Z6: { start: 80, end: 96, tag: 'homeo' },
};

export const SENSE_KINDS = ['th', 'tm', 'gu', 'vs', 'au', 'ol'];

/** 类型级默认激素敏感度（Z6 哈希微调） */
export const DEFAULT_HORMONE_GAINS = {
  'LOG-DIG': { h0: 0.35, h3: 0.1 },
  'LOG-MOT': { h0: 0.22, h4: 0.12 },
  'LOG-GON': { h1: 0.55 },
  'LOG-HRM': { h4: 0.2 },
  'LOG-NRV': { h4: 0.4 },
  'LOG-BRN': { h4: 0.35 },
  'LOG-UMB': { h2: 0.5 },
  'LOG-LAC': { h2: 0.45 },
  'LOG-CLR': { h3: 0.45 },
  'LOG-RES': { h0: 0.28 },
  STEM: { h0: 0.15 },
  'LOG-SEN-TH': { h4: 0.25 },
  'LOG-SEN-TM': { h4: 0.2 },
  'LOG-SEN-GU': { h0: 0.15, h4: 0.1 },
  'LOG-SEN-VS': { h4: 0.3 },
  'LOG-SEN-AU': { h4: 0.28 },
  'LOG-SEN-OL': { h4: 0.18 },
};

export function zoneSlice(sequence, zoneKey) {
  const z = DNA_ZONES[zoneKey];
  if (!z || !sequence) return '';
  return sequence.slice(z.start, z.end);
}

export function expressZoneRng(sequence, zoneKey, subTag = '') {
  const z = DNA_ZONES[zoneKey];
  const slice = zoneSlice(sequence, zoneKey);
  return mulberry32(hashString(`${slice}:${zoneKey}:${z.tag}:${subTag}`));
}

/** Z3 — 激素基线向量 h0–h4 */
export function expressHormoneBaseline(sequence) {
  const rng = expressZoneRng(sequence, 'Z3', 'baseline');
  return {
    h0: +(0.06 + rng() * 0.24).toFixed(4),
    h1: +(0.06 + rng() * 0.24).toFixed(4),
    h2: +(0.06 + rng() * 0.24).toFixed(4),
    h3: +(0.06 + rng() * 0.24).toFixed(4),
    h4: +(0.06 + rng() * 0.24).toFixed(4),
  };
}

/** Z3 — 分泌节律与青春期 h1 阶跃 */
export function expressHormoneRhythm(sequence) {
  const rng = expressZoneRng(sequence, 'Z3', 'rhythm');
  return {
    pulseMult: +(0.85 + rng() * 0.35).toFixed(4),
    decayBias: +(0.978 + rng() * 0.015).toFixed(4),
    pubertyH1Bump: +(0.08 + rng() * 0.2).toFixed(4),
  };
}

/** Z6 — 类型级 hormoneGain 表 */
export function expressHormoneGainTable(sequence, beingId = '') {
  const rng = expressZoneRng(sequence, 'Z6', `gain:${beingId}`);
  const table = {};
  for (const [code, gains] of Object.entries(DEFAULT_HORMONE_GAINS)) {
    table[code] = {};
    for (const [k, v] of Object.entries(gains)) {
      table[code][k] = +(v * (0.85 + rng() * 0.3)).toFixed(4);
    }
  }
  return table;
}

/** Z5 — 单感官阈值/饱和/噪声 */
export function expressSenseProfile(sequence, kind) {
  const rng = expressZoneRng(sequence, 'Z5', `sense:${kind}`);
  return {
    minLoad: +(0.03 + rng() * 0.05).toFixed(4),
    saturation: +(0.75 + rng() * 0.22).toFixed(4),
    noise: +(rng() * 0.08).toFixed(4),
  };
}

/** Z2 — 形态槽 hash（STR 凹凸匹配） */
export function expressMorphSlot(sequence, beingId = '') {
  return hashString(`${sequence}:${beingId}:Z2:morph`) % 997;
}

/** Z4 — 神经分泌调制 */
export function expressNeuralCoupling(sequence) {
  const rng = expressZoneRng(sequence, 'Z4', 'coupling');
  return {
    nrvBoost: +(0.03 + rng() * 0.05).toFixed(4),
    brnBoost: +(0.02 + rng() * 0.04).toFixed(4),
    senDelay: Math.floor(rng() * 4),
  };
}

/** Z6 — 组织 MIT/DIFF 偏置 */
export function expressHomeo(sequence) {
  const rng = expressZoneRng(sequence, 'Z6', 'mit');
  return {
    mitBias: +(0.9 + rng() * 0.25).toFixed(4),
    diffBias: +(0.9 + rng() * 0.25).toFixed(4),
    juvenileBias: +(0.92 + rng() * 0.16).toFixed(4),
  };
}

/** Z1 — 体轴 DIFF 优先级权重（供发育链可选读） */
export function expressAxisWeights(sequence) {
  const rng = expressZoneRng(sequence, 'Z1', 'axis');
  return {
    dig: +(0.7 + rng() * 0.5).toFixed(4),
    mot: +(0.7 + rng() * 0.5).toFixed(4),
    nrv: +(0.7 + rng() * 0.5).toFixed(4),
    embryonicBias: +(rng() * 0.12).toFixed(4),
  };
}

export function expressSequenceForBeing(dna, genome) {
  if (genome?.pairs?.length) return diploidExpressSequence(genome);
  return dna?.sequence ?? '';
}

/** 汇总表达快照，挂 being.dnaExpress（二倍体先合并等位再 Z 区段哈希） */
export function buildDnaExpression(dna, beingId = '', genome = null) {
  const seq = expressSequenceForBeing(dna, genome);
  const sense = Object.fromEntries(
    SENSE_KINDS.map((k) => [k, expressSenseProfile(seq, k)])
  );
  return {
    sequenceLen: seq.length,
    zones: DNA_ZONES,
    expressedSequence: seq,
    hormoneBaseline: expressHormoneBaseline(seq),
    hormoneRhythm: expressHormoneRhythm(seq),
    hormoneGain: expressHormoneGainTable(seq, beingId),
    sense,
    morphSlot: expressMorphSlot(seq, beingId),
    neural: expressNeuralCoupling(seq),
    homeo: expressHomeo(seq),
    axis: expressAxisWeights(seq),
  };
}

export function attachDnaExpression(being) {
  being.dnaExpress = buildDnaExpression(being.dna, being.id, being.genome);
  return being.dnaExpress;
}
