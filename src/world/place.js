// GAP-ENV Phase 85–86 — 区带 band（E/M/P）、terrain（L/O）与 birthPlace 解析

import { SOLAR_CHANNEL } from './diurnal.js';

export const OCEAN_CHANNEL = 1;

export const BANDS = ['E', 'M', 'P'];
export const TERRAINS = ['L', 'O'];

/** 区带静态梯度（数字参数，非温度/纬度名） */
export const BAND_PARAMS = {
  E: { floor: 0.52, drainMult: 0.55, solarPeak: 1.0, diurnalAmp: 0.65 },
  M: { floor: 0.46, drainMult: 0.75, solarPeak: 0.78, diurnalAmp: 1.0 },
  P: { floor: 0.38, drainMult: 1.02, solarPeak: 0.42, diurnalAmp: 1.15 },
};

/** 地形静态梯度（L=陆格 / O=海格） */
export const TERRAIN_PARAMS = {
  L: {
    drainMult: 1.06,
    floor: 0.44,
    nodeRegenMult: 1.0,
    nodeHitMult: 1.0,
    channelBias: { 1: -0.025, 2: 0.015 },
    pcpGain: 1.0,
    evapRate: 0.011,
  },
  O: {
    drainMult: 0.9,
    floor: 0.5,
    nodeRegenMult: 0.52,
    nodeHitMult: 0.72,
    channelBias: { 1: 0.065, 2: -0.02 },
    pcpGain: 0.38,
    evapRate: 0.021,
  },
};

export function parseBirthPlace(raw = '01') {
  const text = String(raw);
  const full = text.match(/^([EMP])-(\d{2})-([LO])$/);
  if (full) {
    return { band: full[1], patch: full[2], terrain: full[3], raw: text };
  }
  const bandOnly = text.match(/^([EMP])-(\d{2})$/);
  if (bandOnly) {
    return { band: bandOnly[1], patch: bandOnly[2], terrain: null, raw: text };
  }
  return { band: 'M', patch: '00', terrain: null, raw: text, legacy: true };
}

export function formatBirthPlace(band = 'M', patch = '00', terrain = null) {
  const base = `${band}-${String(patch).padStart(2, '0')}`;
  return terrain ? `${base}-${terrain}` : base;
}

export function bandParams(band) {
  return BAND_PARAMS[band] ?? BAND_PARAMS.M;
}

export function terrainParams(terrain) {
  return TERRAIN_PARAMS[terrain] ?? TERRAIN_PARAMS.L;
}

export function placeEnabled(profile) {
  return profile?.placeBand != null || profile?.placeEnabled === true;
}

export function initWorldPlace(world, profile) {
  const band = profile.placeBand ?? 'M';
  const patch = profile.placePatch ?? '00';
  const terrain = profile.placeTerrain ?? null;
  world.birthPlace = formatBirthPlace(band, patch, terrain);
  world.place = parseBirthPlace(world.birthPlace);
  return world.place;
}

export function assignBeingPlace(being, { band = 'M', patch = '00', terrain = null } = {}) {
  being.birthPlace = formatBirthPlace(band, patch, terrain);
  being.place = parseBirthPlace(being.birthPlace);
  return being.place;
}

export function applyTerrainSubstrateBias(world) {
  const terrain = world.place?.terrain;
  if (!terrain) return;
  const tp = terrainParams(terrain);
  const ch = world.substrate?.channels;
  if (!ch) return;
  for (const [idx, delta] of Object.entries(tp.channelBias ?? {})) {
    ch[+idx] = Math.max(0, Math.min(1, ch[+idx] + delta));
  }
}

/** 诞生时微弱寄存器偏置 — 同 DNA 不同区位可观察初条件差 */
export function applyPlaceBirthBias(being, solarChannel = SOLAR_CHANNEL) {
  const band = being.place?.band ?? 'M';
  const terrain = being.place?.terrain;
  const bp = bandParams(band);
  const bias = (bp.floor - BAND_PARAMS.M.floor) * 0.35;
  const tp = terrain ? terrainParams(terrain) : null;
  for (let i = 0; i < being.registers.length; i++) {
    let w = i === solarChannel ? 1.25 : 0.55;
    if (tp && i === OCEAN_CHANNEL) w *= terrain === 'O' ? 1.35 : 0.85;
    being.registers[i] = Math.max(0, Math.min(1, being.registers[i] + bias * w));
  }
}

export function effectiveSubstrateModifiers(world, profile) {
  const band = world.place?.band ?? profile?.placeBand ?? null;
  const terrain = world.place?.terrain ?? profile?.placeTerrain ?? null;
  const bp = band ? bandParams(band) : null;
  const tp = terrain ? terrainParams(terrain) : null;
  const drainMult =
    (profile?.substrateDrainMult ?? 1) * (bp?.drainMult ?? 1) * (tp?.drainMult ?? 1);
  const sm = world.seasonal?.mods;
  const floorMult = sm?.floorMult ?? 1;
  const drainSeason = sm?.drainMult ?? 1;
  const airDrain = world.airMods?.drainMult ?? 1;
  const artDrain = world.artMods?.drainReduce
    ? Math.max(0.75, 1 - world.artMods.drainReduce * 0.15)
    : 1;
  const floor =
    Math.max(profile?.substrateFloor ?? 0, bp?.floor ?? 0, tp?.floor ?? 0) * floorMult;
  return {
    drainMult: drainMult * drainSeason * airDrain * artDrain,
    floor,
    boostMult: sm?.boostMult ?? 1,
    solarMult: sm?.solarMult ?? 1,
    band: band ?? 'M',
    terrain: terrain ?? null,
    seasonPhase: world.seasonal?.phase ?? null,
  };
}

export function terrainNodeRegenMult(world, profile) {
  const terrain = world.place?.terrain ?? profile?.placeTerrain ?? null;
  if (!terrain) return 1;
  return terrainParams(terrain).nodeRegenMult ?? 1;
}

export function terrainNodeHitMult(world, profile) {
  const terrain = world.place?.terrain ?? profile?.placeTerrain ?? null;
  if (!terrain) return 1;
  return terrainParams(terrain).nodeHitMult ?? 1;
}
