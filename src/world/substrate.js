// 公理: A1 — 数字基底场；世界环境的最小可观测实现

import { hashString, mulberry32 } from '../core/hash.js';

export const SUBSTRATE_CHANNELS = 8;

function toHexByte(n) {
  return Math.floor((n * 255) % 256)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export function initSubstrate(world) {
  const seedRng = mulberry32(hashString(`${world.name}:${world.birthPlace}:substrate`));
  const driftRng = mulberry32(hashString(`drift:${world.birthPlace}:${world.name}`));
  world.substrate = {
    channels: Array.from({ length: SUBSTRATE_CHANNELS }, () => seedRng()),
    rng: driftRng,
  };
}

export function advanceSubstrate(world) {
  const { channels, rng } = world.substrate;
  for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
    const mix = channels[(i + 1) % SUBSTRATE_CHANNELS];
    const noise = (rng() - 0.5) * 0.05;
    channels[i] = Math.max(0, Math.min(1, channels[i] * 0.98 + mix * 0.02 + noise));
  }
}

export function ambienceLine(world) {
  const ch = world.substrate.channels;
  const i = world.tick % SUBSTRATE_CHANNELS;
  const local = mulberry32(hashString(`${world.tick}:${world.birthPlace}:amb`));
  return `[AMB] ${world.birthPlace} 0x${toHexByte(ch[i])} 0x${toHexByte(local())} 0x${toHexByte(local())}`;
}

export function perturbFromAct(world, actLine, beingId) {
  const h = hashString(`${actLine}|${beingId}|${world.tick}`);
  const idx = h % SUBSTRATE_CHANNELS;
  const delta = ((h >>> 8) % 50) / 1000 + 0.01;
  const before = world.substrate.channels[idx];
  world.substrate.channels[idx] = Math.max(0, Math.min(1, before + delta));
  return { idx, delta, before, after: world.substrate.channels[idx] };
}

export function substrateSnapshot(world) {
  return [...world.substrate.channels];
}

export function formatSubstrateState(channels) {
  return channels.map((v, i) => `e${i}=${v.toFixed(4)}`).join(' ');
}

/** 环境→个体：微弱牵引系数，须由田野验证 */
export const COUPLING_STRENGTH = 0.02;

export function couplingDelta(substrate, registers) {
  if (!substrate || substrate.length !== registers.length) return null;
  return substrate.map((e, i) => (e - registers[i]) * COUPLING_STRENGTH);
}
