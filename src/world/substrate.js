// 公理: A1 — 数字基底场；世界环境的最小可观测实现

import { hashString, mulberry32 } from '../core/hash.js';
import { effectiveSubstrateModifiers } from './place.js';

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
  const profile = world.envProfile ?? {};
  const { drainMult, floor } = effectiveSubstrateModifiers(world, profile);
  const retain = Math.max(0.9, 0.98 / drainMult);
  const mixW = 0.02 / drainMult;
  const boost = profile.substrateBoost ?? 0;
  for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
    const mix = channels[(i + 1) % SUBSTRATE_CHANNELS];
    const noise = (rng() - 0.5) * 0.05;
    let next = channels[i] * retain + mix * mixW + noise;
    if (boost > 0) {
      next += boost * (1 - next) * 0.2;
    }
    if (floor > 0 && next < floor) {
      next = next * 0.82 + floor * 0.18;
    }
    channels[i] = Math.max(0, Math.min(1, next));
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

/** 代谢：从基底摄取，不写「需求」语义 */
export const MET_DRAW_BASE = 0.004;
export const MET_LOW_THRESHOLD = 0.12;

import { pickMetabolicChannel, assessCellIntegrity } from './cell.js';

export function metabolicExchange(
  world,
  being,
  { internalCount = 1, hadExternal = false, drawMult = 1 } = {}
) {
  const ch = world.substrate.channels;
  const { idx, crossBoundary } = pickMetabolicChannel(being, ch);
  const activity = internalCount + (hadExternal ? 1 : 0);
  const amount = Math.min(ch[idx], MET_DRAW_BASE * activity * drawMult);
  const integrity = assessCellIntegrity(being, ch);
  if (amount <= 0.0001) return { draw: null, low: null, crossBoundary, integrity };

  ch[idx] = Math.max(0, ch[idx] - amount);
  being.registers[idx] = Math.max(0, Math.min(1, being.registers[idx] + amount * 0.3));

  const draw = { idx, amount, activity, channelAfter: ch[idx], crossBoundary };
  const low =
    ch[idx] < MET_LOW_THRESHOLD ? { idx, value: ch[idx], threshold: MET_LOW_THRESHOLD } : null;
  return { draw, low, crossBoundary, integrity };
}
