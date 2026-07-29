// 公理: A6 可诞生 — 身份证格式 [出生地2][日期8][品种码2][序号4]

import { hashString } from './hash.js';

const birthCounters = new Map();

/** 田野批处理每轮运行前重置，避免序号跨种子/global 累积 */
export function resetBirthCounters() {
  birthCounters.clear();
}

function pad(n, len) {
  return String(n).padStart(len, '0');
}

function codeToBreed(code) {
  const num = parseInt(code, 10);
  if (!Number.isNaN(num)) {
    return pad(num % 100, 2);
  }
  return pad(hashString(code) % 100, 2);
}

export function generateId({ birthPlace = '01', code, date = new Date() }) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1, 2);
  const d = pad(date.getDate(), 2);
  const dateStr = `${y}${m}${d}`;
  const breed = codeToBreed(code);
  const key = `${birthPlace}-${dateStr}-${breed}`;
  const seq = (birthCounters.get(key) || 0) + 1;
  birthCounters.set(key, seq);
  return `${birthPlace}${dateStr}${breed}${pad(seq, 4)}`;
}
