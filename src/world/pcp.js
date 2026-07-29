// GAP-ENV Phase 86 — [PCP] 相态转移：atmoStore 蓄 → 落地补场

import { terrainParams, OCEAN_CHANNEL } from './place.js';

export function pcpEnabled(profile) {
  return profile?.pcpEnabled === true;
}

export function initPcpState(world, profile) {
  world.pcp = {
    atmoStore: profile.pcpAtmoInit ?? 0.12,
    events: 0,
    totalInject: 0,
  };
  world.pcpStats = {
    events: 0,
    totalInject: 0,
    landLow: 0,
    oceanLow: 0,
    drwOcean: 0,
    drwLand: 0,
  };
}

export function recordPcpLow(world, { idx }) {
  if (!world.pcpStats) return;
  if (idx === OCEAN_CHANNEL) world.pcpStats.oceanLow++;
  else world.pcpStats.landLow++;
}

export function recordPcpDrw(world, { idx }) {
  if (!world.pcpStats) return;
  if (idx === OCEAN_CHANNEL) world.pcpStats.drwOcean++;
  else world.pcpStats.drwLand++;
}

/**
 * 日相驱动蒸发蓄池；阈值触发 [PCP] 向通道补量
 */
export function tickPcp(world, profile, { solar = 0, night = false } = {}) {
  if (!pcpEnabled(profile)) return null;

  const terrain = world.place?.terrain ?? profile.placeTerrain ?? 'L';
  const tp = terrainParams(terrain);
  const store = world.pcp ?? { atmoStore: 0.12, events: 0, totalInject: 0 };

  const evapMult = night ? 0.18 : 1;
  const evap = evapMult * solar * (tp.evapRate ?? 0.015);
  store.atmoStore = Math.min(1, store.atmoStore + evap);

  const threshold = profile.pcpThreshold ?? 0.4;
  if (store.atmoStore < threshold) {
    return {
      fired: false,
      evap: +evap.toFixed(4),
      atmoStore: +store.atmoStore.toFixed(4),
      terrain,
    };
  }

  const burst = (store.atmoStore - threshold) * 0.62 + 0.035;
  store.atmoStore = Math.max(0, store.atmoStore * 0.32);

  const ch = world.substrate.channels;
  const gain = tp.pcpGain ?? 1;
  const targets =
    terrain === 'L'
      ? [0, 2, 3, 4, 5, 6, 7]
      : [OCEAN_CHANNEL, 0, 2];

  const per = (burst * gain) / targets.length;
  const transfers = [];
  for (const idx of targets) {
    const before = ch[idx];
    ch[idx] = Math.min(1, ch[idx] + per);
    transfers.push({ idx, delta: +per.toFixed(4), before, after: ch[idx] });
  }

  store.events = (store.events ?? 0) + 1;
  store.totalInject = (store.totalInject ?? 0) + burst;
  if (world.pcpStats) {
    world.pcpStats.events++;
    world.pcpStats.totalInject += burst;
  }

  return {
    fired: true,
    burst: +burst.toFixed(4),
    evap: +evap.toFixed(4),
    atmoStore: +store.atmoStore.toFixed(4),
    terrain,
    transfers,
  };
}
