// GAP-ART Phase 92 — [ART] 持久场态：ACT 沉积 → 局域基底/DRW 效率改善

import { hashString } from '../core/hash.js';
import { SUBSTRATE_CHANNELS } from './substrate.js';

export function artEnabled(profile) {
  return profile?.artEnabled === true;
}

export function initArtState(world, profile) {
  world.art = {
    state: [],
    depositTotal: 0,
    activeTicks: 0,
    floorInjectSum: 0,
  };
  world.artMods = { drawBonus: 0, floorBoost: 0, drainReduce: 0 };
}

function recomputeArtMods(world) {
  const mods = { drawBonus: 0, floorBoost: 0, drainReduce: 0, perChannel: Array(SUBSTRATE_CHANNELS).fill(0) };
  for (const a of world.art?.state ?? []) {
    if (world.tick - a.depositedAt > a.ttl) continue;
    mods.drawBonus += a.drwBonus ?? 0.04;
    mods.floorBoost += a.floorBoost ?? 0.012;
    mods.drainReduce += a.drainReduce ?? 0.02;
    mods.perChannel[a.channel] = (mods.perChannel[a.channel] ?? 0) + (a.drwBonus ?? 0.04);
  }
  world.artMods = mods;
  return mods;
}

/** ACT 达阈值后沉积持久场态（非脚本化增益，需真实 ACT 成本） */
export function tryArtDeposit(world, being, profile, { stress = 0 } = {}) {
  if (!artEnabled(profile) || !being.alive) return null;
  if (stress > (profile.artMaxStress ?? 0.32)) return null;

  being.artActStreak = (being.artActStreak ?? 0) + 1;
  const every = profile.artDepositEvery ?? 10;
  const minActs = profile.artMinActs ?? 6;
  if (being.artActStreak < minActs || being.artActStreak % every !== 0) return null;

  const costIdx = being.artActStreak % SUBSTRATE_CHANNELS;
  const cost = profile.artDepositCost ?? 0.028;
  if ((being.registers[costIdx] ?? 0) < cost) return null;
  being.registers[costIdx] -= cost;

  const h = hashString(`${being.id}:${world.tick}:${being.artActStreak}:art`);
  const channel = h % SUBSTRATE_CHANNELS;
  const artifact = {
    id: `a${(h % 10000).toString().padStart(4, '0')}`,
    channel,
    floorBoost: profile.artFloorBoost ?? 0.014,
    drainReduce: profile.artDrainReduce ?? 0.025,
    drwBonus: profile.artDrwBonus ?? 0.05,
    ttl: profile.artTtl ?? 520,
    creatorId: being.id,
    depositedAt: world.tick,
  };

  world.art.state.push(artifact);
  world.art.depositTotal = (world.art.depositTotal ?? 0) + 1;
  being.artDepositCount = (being.artDepositCount ?? 0) + 1;
  recomputeArtMods(world);

  return artifact;
}

/** 每 tick 维持场态：微注入 floor + 衰减过期 */
export function tickArt(world, profile) {
  if (!artEnabled(profile)) {
    world.artMods = { drawBonus: 0, floorBoost: 0, drainReduce: 0 };
    return null;
  }

  const before = world.art.state.length;
  world.art.state = world.art.state.filter((a) => world.tick - a.depositedAt <= a.ttl);
  const mods = recomputeArtMods(world);

  if (!world.art.state.length) return null;

  const ch = world.substrate?.channels;
  let inject = 0;
  for (const a of world.art.state) {
    const idx = a.channel;
    const delta = (a.floorBoost ?? 0.014) * 0.12;
    const beforeCh = ch[idx];
    ch[idx] = Math.max(0, Math.min(1, beforeCh + delta));
    inject += delta;
  }

  world.art.floorInjectSum = (world.art.floorInjectSum ?? 0) + inject;
  world.art.activeTicks = (world.art.activeTicks ?? 0) + 1;

  return {
    active: world.art.state.length,
    expired: before - world.art.state.length,
    inject: +inject.toFixed(5),
    drawBonus: +mods.drawBonus.toFixed(4),
    depositTotal: world.art.depositTotal,
  };
}

export function artDrawBonus(world, profile) {
  if (!artEnabled(profile)) return 0;
  return world.artMods?.drawBonus ?? 0;
}
