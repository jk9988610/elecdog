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
