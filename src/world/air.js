// GAP-ENV Phase 90 — [AIR] 大气标量：日相×atmoStore 耦合，衰减 solar、调制 drain

import { isNightPhase, solarPhase, T_DAY } from './diurnal.js';

export function airEnabled(profile) {
  return profile?.airEnabled === true;
}

export function initAirState(world, profile) {
  world.air = {
    scalar: profile.airInit ?? 0.5,
    samples: 0,
    scalarSum: 0,
    effectiveSolarSum: 0,
    injectAttenSum: 0,
  };
}

/** 厚大气削减日注能：f(air) ∈ [floor, 1] */
export function solarAttenuation(scalar, profile) {
  const floor = profile.airSolarFloor ?? 0.35;
  const a = Math.max(0, Math.min(1, scalar ?? 0));
  return floor + (1 - floor) * (1 - a);
}

/** 稀薄大气提高耗散：g(air) ≥ 1 */
export function drainAirMult(scalar, profile) {
  const boost = profile.airDrainBoost ?? 1.12;
  const a = Math.max(0, Math.min(1, scalar ?? 0));
  return 1 + (1 - a) * (boost - 1);
}

/**
 * 日相耦合：白昼+高 atmoStore → scalar↑（云）；夜间缓释
 * 返回本 tick 的 solar 衰减与 effectiveSolar
 */
export function tickAir(world, profile, { solar, night, atmoStore = 0 } = {}) {
  if (!airEnabled(profile)) {
    return {
      scalar: 0,
      solarAtten: 1,
      drainMult: 1,
      effectiveSolar: solar ?? 0,
      changed: false,
    };
  }

  const air = world.air ?? { scalar: profile.airInit ?? 0.5 };
  world.air = air;
  let changed = false;

  if (!night && solar > (profile.airSolarMin ?? 0.1)) {
    const gain = (atmoStore ?? 0) * (profile.airCloudGain ?? 0.0012) * solar;
    if (gain > 0) {
      const next = Math.min(1, air.scalar + gain);
      if (next !== air.scalar) changed = true;
      air.scalar = next;
    }
  } else if (night) {
    const decay = profile.airNightDecay ?? 0.00035;
    const floor = profile.airFloor ?? 0.05;
    const next = Math.max(floor, air.scalar - decay);
    if (next !== air.scalar) changed = true;
    air.scalar = next;
  }

  const solarAtten = solarAttenuation(air.scalar, profile);
  const drainMult = drainAirMult(air.scalar, profile);
  const effectiveSolar = (solar ?? 0) * solarAtten;

  air.samples = (air.samples ?? 0) + 1;
  air.scalarSum = (air.scalarSum ?? 0) + air.scalar;
  air.effectiveSolarSum = (air.effectiveSolarSum ?? 0) + effectiveSolar;
  air.injectAttenSum = (air.injectAttenSum ?? 0) + solarAtten;

  world.airMods = { solarAtten, drainMult };

  const period = profile.diurnalPeriod ?? T_DAY;
  const quarter = Math.floor(((world.tick % period) / period) * 4);

  return {
    scalar: +air.scalar.toFixed(4),
    solarAtten: +solarAtten.toFixed(4),
    drainMult: +drainMult.toFixed(4),
    effectiveSolar: +effectiveSolar.toFixed(4),
    solar: solar ?? 0,
    night: night ?? false,
    quarter,
    changed,
  };
}

/** 在 tickDiurnal 之前计算 raw solar + air 调制（保持 night 基于 raw solar） */
export function prepAirDiurnal(world, profile) {
  const period = profile.diurnalPeriod ?? T_DAY;
  const solar = solarPhase(world.tick, period);
  const night = isNightPhase(solar, profile.diurnalNightThreshold ?? 0.08);
  const atmoStore = world.pcp?.atmoStore ?? 0;
  const air = tickAir(world, profile, { solar, night, atmoStore });
  return { solar, night, air };
}
