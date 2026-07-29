// GAP-ENV Phase 85 — 日相 [DLC]：tick 相位调制注能通道

import { bandParams } from './place.js';

export const T_DAY = 240;
export const SOLAR_CHANNEL = 2;

export function diurnalEnabled(profile) {
  return profile?.diurnalEnabled === true;
}

export function solarPhase(tick, period = T_DAY) {
  const T = period > 0 ? period : T_DAY;
  const phase = (tick % T) / T;
  return Math.max(0, Math.sin(2 * Math.PI * phase));
}

export function isNightPhase(solar, threshold = 0.08) {
  return solar < threshold;
}

export function initDiurnalStats(world) {
  world.diurnalStats = {
    dayTicks: 0,
    nightTicks: 0,
    dayLow: 0,
    nightLow: 0,
    solarSum: 0,
    injectSum: 0,
    samples: 0,
  };
}

export function recordDiurnalTick(world, { night }) {
  if (!world.diurnalStats) initDiurnalStats(world);
  const bucket = night ? 'nightTicks' : 'dayTicks';
  world.diurnalStats[bucket]++;
}

export function recordDiurnalLow(world, { night }) {
  if (!world.diurnalStats) initDiurnalStats(world);
  const bucket = night ? 'nightLow' : 'dayLow';
  world.diurnalStats[bucket]++;
}

/**
 * 日相注能：solar × bandSolarPeak → 注入 e☉（默认 e2）
 */
export function tickDiurnal(world, profile) {
  if (!diurnalEnabled(profile)) return null;

  const period = profile.diurnalPeriod ?? T_DAY;
  const solar = solarPhase(world.tick, period);
  const band = world.place?.band ?? profile.placeBand ?? 'M';
  const bp = bandParams(band);
  const peak = profile.diurnalSolarPeak ?? bp.solarPeak;
  const amp = profile.diurnalInjectAmp ?? 0.038;
  const idx = profile.solarChannel ?? SOLAR_CHANNEL;
  const night = isNightPhase(solar, profile.diurnalNightThreshold ?? 0.08);

  const inject = solar * peak * amp * (bp.diurnalAmp ?? 1) * (world.seasonal?.mods?.solarMult ?? 1);
  const ch = world.substrate.channels;
  const before = ch[idx];
  ch[idx] = Math.max(0, Math.min(1, before + inject));

  if (world.diurnalStats) {
    world.diurnalStats.solarSum += solar;
    world.diurnalStats.injectSum += inject;
    world.diurnalStats.samples++;
  }
  recordDiurnalTick(world, { night });

  const quarter = Math.floor(((world.tick % period) / period) * 4);
  return {
    solar: +solar.toFixed(4),
    inject: +inject.toFixed(4),
    idx,
    before,
    after: ch[idx],
    night,
    band,
    quarter,
    period,
  };
}
