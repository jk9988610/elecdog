// 公理: A8 基因存在 — 只生成与记录 DNA 原文，不预设表达语义

import { hashString, mulberry32 } from './hash.js';

const BASES = ['0', '1', '2', '3'];
const DEFAULT_LENGTH = 96;

export function generateTemplate(code) {
  const rng = mulberry32(hashString(`template:${code}`));
  let seq = '';
  for (let i = 0; i < DEFAULT_LENGTH; i++) {
    seq += BASES[Math.floor(rng() * 4)];
  }
  return seq;
}

export function mutate(seq, rate = 0.02, seed = Date.now()) {
  const rng = mulberry32(seed);
  const chars = seq.split('');
  let count = 0;
  for (let i = 0; i < chars.length; i++) {
    if (rng() < rate) {
      const choices = BASES.filter((b) => b !== chars[i]);
      chars[i] = choices[Math.floor(rng() * choices.length)];
      count++;
    }
  }
  return { seq: chars.join(''), mutationCount: count };
}

export function createDna(code) {
  const template = generateTemplate(code);
  const { seq, mutationCount } = mutate(template);
  return {
    code,
    template,
    sequence: seq,
    mutationCount,
    length: seq.length,
  };
}

export function createDnaFromSequence(code, sequence) {
  const template = generateTemplate(code);
  let mutationCount = 0;
  const len = Math.min(template.length, sequence.length);
  for (let i = 0; i < len; i++) {
    if (template[i] !== sequence[i]) mutationCount++;
  }
  for (let i = len; i < sequence.length; i++) mutationCount++;
  return {
    code,
    template,
    sequence,
    mutationCount,
    length: sequence.length,
  };
}

/** 减数式缩减：各位点从原文随机解析（不设配子名称） */
export function reduceDna(seq, seed) {
  const rng = mulberry32(seed);
  return seq
    .split('')
    .map((c) => (rng() > 0.5 ? c : BASES[Math.floor(rng() * 4)]))
    .join('');
}

/** 双源汇合：各位点随机取自 A 或 B */
export function recombineDna(seqA, seqB, seed) {
  const rng = mulberry32(seed);
  const len = Math.max(seqA.length, seqB.length);
  let out = '';
  for (let i = 0; i < len; i++) {
    const a = seqA[i % seqA.length];
    const b = seqB[i % seqB.length];
    out += rng() > 0.5 ? a : b;
  }
  return out;
}
