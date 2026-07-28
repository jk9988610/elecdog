// 公理: A1 — 生物圈反馈；种群活动累积改变基底场（不设氧气/代谢物名称表）

import { SUBSTRATE_CHANNELS } from './substrate.js';

export const BIOTIC_GAIN = 0.0009;
export const BIOTIC_INTERVAL = 50;
export const BIOTIC_APPLY_THRESHOLD = 0.035;
export const BIOTIC_CLAMP = 0.12;

export function initBiotic(world) {
  world.biotic = {
    residue: Array(SUBSTRATE_CHANNELS).fill(0),
  };
}

/** 单 tick：个体活动向 residue 累积（寄存器与场态差 × 活动量） */
export function accumulateBiotic(world, being, { internalCount = 1, hadExternal = false } = {}) {
  if (!being.alive || !world.biotic) return;
  const ch = world.substrate.channels;
  const regs = being.registers;
  const activity = 1 + internalCount * 0.15 + (hadExternal ? 0.25 : 0);
  for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
    world.biotic.residue[i] += (regs[i] - ch[i]) * BIOTIC_GAIN * activity;
  }
}

/** 周期或超阈值时将累积施加到基底，返回可记录事件 */
export function applyBioticCycle(world) {
  const alive = world.beings.filter((b) => b.alive).length;
  if (alive === 0 || !world.biotic) return null;

  const due =
    world.tick % BIOTIC_INTERVAL === 0 ||
    world.biotic.residue.some((r) => Math.abs(r) >= BIOTIC_APPLY_THRESHOLD);
  if (!due) return null;

  const events = [];
  for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
    const r = world.biotic.residue[i];
    if (Math.abs(r) < 0.0008) continue;
    const delta = Math.max(-BIOTIC_CLAMP, Math.min(BIOTIC_CLAMP, r));
    const before = world.substrate.channels[i];
    const after = Math.max(0, Math.min(1, before + delta));
    world.substrate.channels[i] = after;
    world.biotic.residue[i] -= delta;
    events.push({ idx: i, delta: after - before, before, after });
  }

  return events.length ? { events, alive, tick: world.tick } : null;
}
