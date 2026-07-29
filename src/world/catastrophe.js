// 公理: A1 — 环境剧变；可观测脉冲式场/节点变化（不设灾害名称表）

import { hashString, mulberry32 } from '../core/hash.js';
import { SUBSTRATE_CHANNELS } from './substrate.js';
import { NODE_COUNT, NODE_DEP_THRESHOLD } from './nodes.js';

export const PULSE_INTERVAL = 100;
export const PULSE_FIRST = 100;

export function initCatastrophe(world) {
  const rng = mulberry32(hashString(`${world.name}:${world.birthPlace}:catastrophe`));
  world.catastrophe = {
    rng,
    interval: PULSE_INTERVAL,
    nextAt: PULSE_FIRST,
    pulseCount: 0,
  };
}

export function advanceCatastrophe(world) {
  if (world.envProfile?.catastropheDisabled) return [];
  const cat = world.catastrophe;
  if (!cat || world.tick < cat.nextAt) return [];

  const events = [];
  while (world.tick >= cat.nextAt) {
    events.push(applyPulse(world, cat));
    cat.pulseCount++;
    cat.nextAt += cat.interval;
  }
  return events;
}

function applyPulse(world, cat) {
  const { rng } = cat;
  const pulse = cat.pulseCount;

  if (rng() < 0.55) {
    const idx = Math.floor(rng() * SUBSTRATE_CHANNELS);
    const sign = rng() > 0.35 ? -1 : 1;
    const magnitude = 0.12 + rng() * 0.28;
    const before = world.substrate.channels[idx];
    const after = Math.max(0, Math.min(1, before + sign * magnitude));
    world.substrate.channels[idx] = after;
    return {
      kind: 'SHK',
      pulse,
      idx,
      delta: after - before,
      before,
      after,
    };
  }

  const idx = Math.floor(rng() * NODE_COUNT);
  const node = world.nodes[idx];
  const sign = rng() > 0.7 ? 1 : -1;
  const magnitude = 0.15 + rng() * 0.35;
  const before = node.level;
  const after = Math.max(0, Math.min(1, before + sign * magnitude));
  node.level = after;
  const depleted = before >= NODE_DEP_THRESHOLD && after < NODE_DEP_THRESHOLD;
  return {
    kind: 'NPL',
    pulse,
    nodeId: node.id,
    delta: after - before,
    before,
    after,
    depleted,
  };
}
