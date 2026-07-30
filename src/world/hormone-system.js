// 激素系统 — LOG-HRM 分泌链、being.hormoneVec、类型级 hormoneGain

import { hashString, mulberry32 } from '../core/hash.js';
import { multicellV2Enabled } from './multicell-v2.js';
import { noteSemDomainFromKind } from './sem-domain.js';

export const HORMONE_KEYS = ['h0', 'h1', 'h2', 'h3', 'h4'];

/** 类型级默认敏感度（Z6 哈希微调） */
const DEFAULT_HORMONE_GAINS = {
  'LOG-DIG': { h0: 0.35, h3: 0.1 },
  'LOG-MOT': { h0: 0.22, h4: 0.12 },
  'LOG-GON': { h1: 0.55 },
  'LOG-HRM': { h4: 0.2 },
  'LOG-NRV': { h4: 0.4 },
  'LOG-BRN': { h4: 0.35 },
  'LOG-UMB': { h2: 0.5 },
  'LOG-LAC': { h2: 0.45 },
  'LOG-CLR': { h3: 0.45 },
  'LOG-RES': { h0: 0.28 },
  STEM: { h0: 0.15 },
  'LOG-SEN-TH': { h4: 0.25 },
  'LOG-SEN-TM': { h4: 0.2 },
  'LOG-SEN-GU': { h0: 0.15, h4: 0.1 },
  'LOG-SEN-VS': { h4: 0.3 },
  'LOG-SEN-AU': { h4: 0.28 },
  'LOG-SEN-OL': { h4: 0.18 },
};

function buildHormoneGainTable(being) {
  const rng = mulberry32(hashString(`${being.dna?.sequence ?? ''}:${being.id}:Z6:homeo`));
  const table = {};
  for (const [code, gains] of Object.entries(DEFAULT_HORMONE_GAINS)) {
    table[code] = {};
    for (const [k, v] of Object.entries(gains)) {
      table[code][k] = +(v * (0.85 + rng() * 0.3)).toFixed(4);
    }
  }
  return table;
}

/** Z3 哈希初始化全身激素向量 */
export function initHormoneVec(being, profile) {
  if (!multicellV2Enabled(profile)) return null;
  const seq = being.dna?.sequence ?? being.id ?? '';
  const rng = mulberry32(hashString(`${seq}:Z3:hormone`));
  const vec = {};
  for (const k of HORMONE_KEYS) {
    vec[k] = +(0.08 + rng() * 0.22).toFixed(4);
  }
  being.hormoneVec = vec;
  being.hormoneGain = buildHormoneGainTable(being);
  return vec;
}

export function hormoneVecEnabled(profile) {
  return multicellV2Enabled(profile);
}

/** activity(code) = Π_k (1 + hormoneVec[k] × hormoneGain[code][k]) */
export function hormoneActivityMult(being, code) {
  if (!being?.hormoneVec) return 1;
  const gains = being.hormoneGain?.[code] ?? DEFAULT_HORMONE_GAINS[code] ?? {};
  let mult = 1;
  for (const k of HORMONE_KEYS) {
    const g = gains[k] ?? 0;
    const h = being.hormoneVec[k] ?? 0;
    if (g && h) mult *= 1 + h * g;
  }
  return +Math.min(2.2, mult).toFixed(4);
}

/** LOG-HRM 分泌 + 衰减；NRV/BRN/SEN 调制 */
export function tickHormoneSecretion(world, recorder, being, profile, hints = {}) {
  if (!hormoneVecEnabled(profile) || !being.alive) return null;

  if (!being.hormoneVec) initHormoneVec(being, profile);

  const hrmN = being.logicCells?.['LOG-HRM']?.length ?? 0;
  const interval = profile.hrmTickInterval ?? 12;
  const shouldLog = hrmN > 0 || world.tick % interval === 0;
  if (!shouldLog && world.tick % interval !== 0) {
    return null;
  }

  const nrvN = being.logicCells?.['LOG-NRV']?.length ?? 0;
  const brnN = being.logicCells?.['LOG-BRN']?.length ?? 0;
  const senN = hints.senCellCount ?? 0;
  const stress = hints.stress ?? 0;
  const pulse = profile.hrmPulseBase ?? 0.012;
  const decay = profile.hrmDecay ?? 0.985;

  for (const k of HORMONE_KEYS) {
    being.hormoneVec[k] = +(being.hormoneVec[k] * decay).toFixed(4);
  }

  if (hrmN > 0) {
    const synth = pulse * hrmN * (1 + nrvN * 0.04 + brnN * 0.03);
    being.hormoneVec.h0 = Math.min(1, being.hormoneVec.h0 + synth * 0.9);
    being.hormoneVec.h1 = Math.min(
      1,
      being.hormoneVec.h1 + synth * (being.lifeStage === 'ADT' ? 1.1 : 0.4)
    );
    being.hormoneVec.h2 = Math.min(1, being.hormoneVec.h2 + synth * (being.syncyte ? 1.2 : 0.5));
    being.hormoneVec.h3 = Math.min(1, being.hormoneVec.h3 + synth * (stress > 0.25 ? 1.4 : 0.3));
    being.hormoneVec.h4 = Math.min(1, being.hormoneVec.h4 + synth * (0.5 + senN * 0.05));
    for (const k of HORMONE_KEYS) {
      being.hormoneVec[k] = +being.hormoneVec[k].toFixed(4);
    }
  }

  if (hrmN > 0 || world.tick % interval === 0) {
    recorder.evolution(
      world.tick,
      being.id,
      `[HRM] h0=${being.hormoneVec.h0} h1=${being.hormoneVec.h1} hrm×${hrmN}`,
      {
        kind: 'HRM',
        trigger: 'tick',
        hrmCount: hrmN,
        ...being.hormoneVec,
      }
    );
    noteSemDomainFromKind(being, 'HRM', world.tick);
  }

  if (world.tick > 0 && world.tick % (profile.regLogInterval ?? 64) === 0) {
    const summary = HORMONE_KEYS.map((k) => `${k}:${being.hormoneVec[k]}`).join(' ');
    recorder.evolution(world.tick, being.id, `[REG] ${summary}`, {
      kind: 'REG',
      hormoneVec: { ...being.hormoneVec },
    });
  }

  return being.hormoneVec;
}
