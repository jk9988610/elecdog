// GAP-ENV Phase 91 — [LTC] 月相：潮汐调制节点再生与 e◐ 通道

export const T_MOON = 28;
export const LUNAR_CHANNEL = 3;

export function ltcEnabled(profile) {
  return profile?.ltcEnabled === true;
}

export function lunarTide(tick, period = T_MOON) {
  const T = period > 0 ? period : T_MOON;
  const phase = (tick % T) / T;
  return Math.sin(2 * Math.PI * phase);
}

export function lunarPhaseSlot(tick, period = T_MOON) {
  const T = period > 0 ? period : T_MOON;
  return Math.floor(((tick % T) / T) * 4) % 4;
}

export function initLunarStats(world) {
  world.lunarStats = {
    phaseTicks: [0, 0, 0, 0],
    transitions: 0,
    injectSum: 0,
    regenMultSum: 0,
    samples: 0,
  };
}

export function tickLunar(world, profile) {
  if (!ltcEnabled(profile)) {
    world.lunarMods = null;
    return null;
  }

  const period = profile.ltcPeriod ?? T_MOON;
  const tide = lunarTide(world.tick, period);
  const phase = lunarPhaseSlot(world.tick, period);
  const amp = profile.ltcAmp ?? 0.02;
  const regenMult = 1 + amp * tide * (profile.ltcRegenScale ?? 5);
  const prev = world.lunar?.phase;

  world.lunar = { phase, tide, regenMult, period };
  world.lunarMods = { regenMult, tide, phase };

  if (world.lunarStats) {
    world.lunarStats.phaseTicks[phase]++;
    world.lunarStats.regenMultSum += regenMult;
    world.lunarStats.samples++;
    if (prev != null && prev !== phase) world.lunarStats.transitions++;
  }

  let inject = 0;
  const idx = profile.lunarChannel ?? LUNAR_CHANNEL;
  if (tide > 0.35 && world.substrate?.channels) {
    inject = amp * tide * (profile.ltcInjectAmp ?? 0.014);
    const ch = world.substrate.channels;
    ch[idx] = Math.max(0, Math.min(1, ch[idx] + inject));
    if (world.lunarStats) world.lunarStats.injectSum += inject;
  }

  return {
    phase,
    tide: +tide.toFixed(4),
    regenMult: +regenMult.toFixed(4),
    inject: +inject.toFixed(5),
    idx,
    changed: prev != null && prev !== phase,
    period,
  };
}
