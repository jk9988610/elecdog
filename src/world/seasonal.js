// GAP-ENV Phase 87 — 季相 [SCL]：慢周期调制 floor/boost/drain/solar

import { T_DAY } from './diurnal.js';

export const T_YEAR = 960;
export const SEASON_COUNT = 4;

/** 四相数字参数（不叫春夏秋冬） */
export const SEASON_MODS = {
  0: { floorMult: 1.14, boostMult: 1.12, drainMult: 0.9, solarMult: 1.1, pulseMult: 1.0 },
  1: { floorMult: 1.0, boostMult: 1.0, drainMult: 1.0, solarMult: 1.0, pulseMult: 1.0 },
  2: { floorMult: 0.86, boostMult: 0.82, drainMult: 1.16, solarMult: 0.78, pulseMult: 1.0 },
  3: { floorMult: 0.96, boostMult: 0.94, drainMult: 1.04, solarMult: 0.92, pulseMult: 1.28 },
};

export function seasonalEnabled(profile) {
  return profile?.seasonalEnabled === true;
}

export function seasonPhase(tick, period = T_YEAR) {
  const T = period > 0 ? period : T_YEAR;
  const slot = Math.floor(((tick % T) / T) * SEASON_COUNT);
  return Math.min(SEASON_COUNT - 1, Math.max(0, slot));
}

export function seasonMods(phase) {
  return SEASON_MODS[phase] ?? SEASON_MODS[1];
}

export function initSeasonalStats(world) {
  world.seasonalStats = {
    phaseTicks: [0, 0, 0, 0],
    phaseLow: [0, 0, 0, 0],
    transitions: 0,
  };
}

export function recordSeasonalLow(world, phase) {
  if (!world.seasonalStats || phase == null) return;
  world.seasonalStats.phaseLow[phase]++;
}

function applySeasonalPulse(world, profile, mods) {
  if (!world.catastrophe || profile.catastropheDisabled) return;
  const base = profile.pulseInterval ?? world.catastrophe._baseInterval ?? 100;
  world.catastrophe._baseInterval = base;
  world.catastrophe.interval = Math.max(40, Math.round(base * (mods.pulseMult ?? 1)));
}

export function tickSeasonal(world, profile) {
  if (!seasonalEnabled(profile)) {
    world.seasonal = null;
    return null;
  }

  const period = profile.seasonalPeriod ?? T_YEAR;
  const phase = seasonPhase(world.tick, period);
  const mods = seasonMods(phase);
  const prev = world.seasonal?.phase;

  if (prev != null && prev !== phase) {
    if (world.seasonalStats) world.seasonalStats.transitions++;
    applySeasonalPulse(world, profile, mods);
  } else if (prev == null) {
    applySeasonalPulse(world, profile, mods);
  }

  world.seasonal = { phase, mods, period };
  if (world.seasonalStats) world.seasonalStats.phaseTicks[phase]++;

  return {
    phase,
    period,
    floorMult: mods.floorMult,
    boostMult: mods.boostMult,
    drainMult: mods.drainMult,
    solarMult: mods.solarMult,
    pulseMult: mods.pulseMult,
    changed: prev != null && prev !== phase,
  };
}

export function currentSeasonalModifiers(world) {
  return world.seasonal?.mods ?? null;
}
