// GAP-ENV Phase 85 — 区带 band（E/M/P）与 birthPlace 解析

export const BANDS = ['E', 'M', 'P'];

/** 区带静态梯度（数字参数，非温度/纬度名） */
export const BAND_PARAMS = {
  E: { floor: 0.52, drainMult: 0.55, solarPeak: 1.0, diurnalAmp: 0.65 },
  M: { floor: 0.46, drainMult: 0.75, solarPeak: 0.78, diurnalAmp: 1.0 },
  P: { floor: 0.38, drainMult: 1.02, solarPeak: 0.42, diurnalAmp: 1.15 },
};

export function parseBirthPlace(raw = '01') {
  const text = String(raw);
  const m = text.match(/^([EMP])-(\d{2})$/);
  if (m) return { band: m[1], patch: m[2], raw: text };
  return { band: 'M', patch: '00', raw: text, legacy: true };
}

export function formatBirthPlace(band = 'M', patch = '00') {
  return `${band}-${String(patch).padStart(2, '0')}`;
}

export function bandParams(band) {
  return BAND_PARAMS[band] ?? BAND_PARAMS.M;
}

export function placeEnabled(profile) {
  return profile?.placeBand != null || profile?.placeEnabled === true;
}

export function initWorldPlace(world, profile) {
  const band = profile.placeBand ?? 'M';
  const patch = profile.placePatch ?? '00';
  world.birthPlace = formatBirthPlace(band, patch);
  world.place = parseBirthPlace(world.birthPlace);
  return world.place;
}

export function assignBeingPlace(being, { band = 'M', patch = '00' } = {}) {
  being.birthPlace = formatBirthPlace(band, patch);
  being.place = parseBirthPlace(being.birthPlace);
  return being.place;
}

/** 诞生时微弱寄存器偏置 — 同 DNA 不同 band 可观察初条件差 */
export function applyPlaceBirthBias(being, solarChannel = 2) {
  const band = being.place?.band ?? 'M';
  const bp = bandParams(band);
  const bias = (bp.floor - BAND_PARAMS.M.floor) * 0.35;
  for (let i = 0; i < being.registers.length; i++) {
    const w = i === solarChannel ? 1.25 : 0.55;
    being.registers[i] = Math.max(0, Math.min(1, being.registers[i] + bias * w));
  }
}

export function effectiveSubstrateModifiers(world, profile) {
  const band = world.place?.band ?? profile?.placeBand ?? null;
  const bp = band ? bandParams(band) : null;
  const drainMult = (profile?.substrateDrainMult ?? 1) * (bp?.drainMult ?? 1);
  const floor = Math.max(profile?.substrateFloor ?? 0, bp?.floor ?? 0);
  return { drainMult, floor, band: band ?? 'M' };
}
