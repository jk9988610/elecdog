// 逻辑细胞 ↔ 电子狗世界环境场耦合（有空气才呼吸、有温度场才感温等）

import { airEnabled } from './air.js';
import { diurnalEnabled, solarPhase, isNightPhase, T_DAY } from './diurnal.js';
import { seasonalEnabled } from './seasonal.js';
import { ventEnabled } from './vent.js';

const RES_CODE = 'LOG-RES';
const TM_CODE = 'LOG-SEN-TM';
const GU_CODE = 'LOG-SEN-GU';
const VS_CODE = 'LOG-SEN-VS';
const AU_CODE = 'LOG-SEN-AU';
const OL_CODE = 'LOG-SEN-OL';
const TH_CODE = 'LOG-SEN-TH';

const SEN_ENV_GATES = {
  [TH_CODE]: 'TOUCH',
  [TM_CODE]: 'TEMP',
  [GU_CODE]: 'SUB',
  [VS_CODE]: 'VIS',
  [AU_CODE]: 'AUD',
  [OL_CODE]: 'OLF',
};

/** 本 tick 可观测环境载荷（与 W6 环境栈字段对齐） */
export function sampleOrganismEnv(world, profile = world?.envProfile ?? {}, being = null) {
  const channels = world?.substrate?.channels ?? [];
  let substrateAvg = 0;
  let substrateMin = 0;
  if (channels.length) {
    substrateAvg = channels.reduce((a, b) => a + b, 0) / channels.length;
    substrateMin = Math.min(...channels);
  }

  const airOn = airEnabled(profile);
  const airScalar = airOn ? (world.air?.scalar ?? profile.airInit ?? 0) : 0;
  const minAir = profile.cellCoupleMinAir ?? 0.08;
  const hasBreathableAir = airOn && airScalar >= minAir;

  const diurnalOn = diurnalEnabled(profile);
  const period = profile.diurnalPeriod ?? T_DAY;
  const solarRaw = diurnalOn ? solarPhase(world.tick ?? 0, period) : 0;
  const night = diurnalOn
    ? isNightPhase(solarRaw, profile.diurnalNightThreshold ?? 0.08)
    : false;
  const effectiveSolar =
    world.airMods?.effectiveSolar ??
    world.air?.effectiveSolar ??
    solarRaw * (world.airMods?.solarAtten ?? 1);

  const seasonalOn = seasonalEnabled(profile);
  const seasonSolarMult = world.seasonal?.mods?.solarMult ?? 1;

  const ventOn = ventEnabled(profile);
  const ventInject = ventOn
    ? (world.vent?.lastInject ?? world.vent?.inject ?? 0)
    : 0;

  // 温度代理：日相 solar、大气 scalar、季相、地热注入 — 无场则接近 0
  let tempScalar = 0;
  if (diurnalOn || airOn || seasonalOn || ventOn) {
    tempScalar =
      (airOn ? airScalar * 0.22 : 0) +
      (diurnalOn ? effectiveSolar * 0.38 + solarRaw * seasonSolarMult * 0.18 : 0) +
      (ventOn ? Math.min(1, ventInject * 24) * 0.22 : 0);
    if (!night && diurnalOn) tempScalar += 0.08;
    tempScalar = Math.max(0, Math.min(1, tempScalar));
  }

  const minTemp = profile.cellCoupleMinTemp ?? 0.12;
  const hasWarmthField =
    (diurnalOn || airOn || seasonalOn || ventOn) && tempScalar >= minTemp;

  const minSubstrate = profile.cellCoupleMinSubstrate ?? 0.12;
  const hasSubstrateField = substrateAvg >= minSubstrate;

  const minVisual = profile.cellCoupleMinVisual ?? 0.08;
  const hasVisualField =
    diurnalOn && !night && effectiveSolar >= minVisual;

  const audWindow = profile.senAuditoryWindow ?? 6;
  const tick = world?.tick ?? 0;
  const bus = world?.signalBus ?? [];
  const hasAuditoryField = bus.some(
    (s) => s.emittedAt >= tick - audWindow && s.fromId && s.fromId !== being?.id
  );

  const symModuleCount = being?.symModules?.filter((m) => m.active)?.length ?? 0;
  const hasOlfactoryField = hasSubstrateField || symModuleCount > 0;

  return {
    place: world.birthPlace ?? null,
    airEnabled: airOn,
    airScalar: +airScalar.toFixed(4),
    hasBreathableAir,
    diurnalEnabled: diurnalOn,
    night,
    solarRaw: +solarRaw.toFixed(4),
    effectiveSolar: +effectiveSolar.toFixed(4),
    seasonalEnabled: seasonalOn,
    seasonPhase: world.seasonal?.phase ?? null,
    ventEnabled: ventOn,
    ventInject: +ventInject.toFixed(5),
    tempScalar: +tempScalar.toFixed(4),
    hasWarmthField,
    substrateAvg: +substrateAvg.toFixed(4),
    substrateMin: +substrateMin.toFixed(4),
    hasSubstrateField,
    hasVisualField,
    hasAuditoryField,
    hasOlfactoryField,
    symModuleCount,
  };
}

/** 分化/维持某类逻辑细胞是否要求环境场就绪 */
export function envAllowsLogicCode(world, profile, code, being = null) {
  const env = sampleOrganismEnv(world, profile, being);
  if (code === RES_CODE) {
    return env.hasBreathableAir;
  }
  if (code === TM_CODE) {
    return env.hasWarmthField;
  }
  if (code === GU_CODE) {
    return env.hasSubstrateField;
  }
  if (code === VS_CODE) {
    return env.hasVisualField;
  }
  if (code === AU_CODE) {
    return env.hasAuditoryField;
  }
  if (code === OL_CODE) {
    return env.hasOlfactoryField;
  }
  if (code === TH_CODE) {
    return true;
  }
  return true;
}

/** 运行时感官是否可采样（与分化门控对齐，触觉另需场接触） */
export function senseRuntimeActive(code, env, hints = {}) {
  if (code === TH_CODE) {
    return hints.hadExternal || hints.contestHit || hints.hadFieldExt;
  }
  if (code === TM_CODE) return env.hasWarmthField;
  if (code === GU_CODE) return env.hasSubstrateField;
  if (code === VS_CODE) return env.hasVisualField;
  if (code === AU_CODE) {
    return env.hasAuditoryField || (hints.heardCount ?? 0) > 0;
  }
  if (code === OL_CODE) return env.hasOlfactoryField;
  return true;
}

export function envGateLabel(code) {
  if (code === RES_CODE) return 'AIR';
  return SEN_ENV_GATES[code] ?? null;
}
