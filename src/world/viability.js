// 场压评估与存续终止 — 不预制「饥饿/本能」语义

import { MET_LOW_THRESHOLD } from './substrate.js';

export const LOW_STREAK_END = 12;
export const STRESS_STREAK_END = 18;
export const STRESS_ACT_BIAS = 0.28;
export const EXTERNAL_BASE = 0.55;

export function assessStress(registers, substrate) {
  if (!substrate || substrate.length !== registers.length) return 0;
  let sum = 0;
  let minSub = 1;
  for (let i = 0; i < registers.length; i++) {
    sum += Math.abs(registers[i] - substrate[i]);
    minSub = Math.min(minSub, substrate[i]);
  }
  const gap = sum / registers.length;
  const scarcity = minSub < MET_LOW_THRESHOLD ? (MET_LOW_THRESHOLD - minSub) / MET_LOW_THRESHOLD : 0;
  return Math.min(1, gap * 0.6 + scarcity * 0.5);
}

export function externalThreshold(stress, lowStreak) {
  const lowBoost = Math.min(0.12, lowStreak * 0.01);
  return Math.max(0.25, EXTERNAL_BASE - stress * 0.22 - lowBoost);
}

export function preferAct(stress, lowStreak) {
  return stress > STRESS_ACT_BIAS || lowStreak >= 4;
}

export function shouldTerminate(being, stress) {
  if (!being.alive) return false;
  if (being.lowStreak >= LOW_STREAK_END) return { reason: 'low_streak', lowStreak: being.lowStreak };
  if (being.stressStreak >= STRESS_STREAK_END) return { reason: 'stress_streak', stressStreak: being.stressStreak };
  if (stress > 0.65 && being.lowStreak >= 6) return { reason: 'compound', stress, lowStreak: being.lowStreak };
  return null;
}

export function updateStressStreak(being, stress) {
  if (stress > 0.38) being.stressStreak = (being.stressStreak || 0) + 1;
  else being.stressStreak = 0;
}
