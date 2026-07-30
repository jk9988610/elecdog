// 激素系统 — LOG-HRM 分泌链、being.hormoneVec、类型级 hormoneGain

import { multicellV2Enabled } from './multicell-v2.js';
import { noteSemDomainFromKind } from './sem-domain.js';
import {
  DEFAULT_HORMONE_GAINS,
  expressHormoneBaseline,
  attachDnaExpression,
} from '../genetics/dna-express.js';

export const HORMONE_KEYS = ['h0', 'h1', 'h2', 'h3', 'h4'];

/** Z3 哈希初始化全身激素向量（经 dna-express） */
export function initHormoneVec(being, profile) {
  if (!multicellV2Enabled(profile)) return null;
  if (!being.dnaExpress) attachDnaExpression(being);
  being.hormoneVec = { ...being.dnaExpress.hormoneBaseline };
  being.hormoneGain = being.dnaExpress.hormoneGain ?? {};
  return being.hormoneVec;
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

function applyPubertyH1Bump(being, profile) {
  const rhythm = being.dnaExpress?.hormoneRhythm;
  if (!rhythm?.pubertyH1Bump) return false;
  const juvenileTicks = profile.juvenileTicks ?? 96;
  const tc = being.tickCount ?? 0;
  if (tc < juvenileTicks - 8 || tc > juvenileTicks + 4) return false;
  being.hormoneVec.h1 = Math.min(
    1,
    +(being.hormoneVec.h1 + rhythm.pubertyH1Bump).toFixed(4)
  );
  return true;
}

/** LOG-HRM 分泌 + 衰减；NRV/BRN/SEN 调制（Z3/Z4 表达） */
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
  const rhythm = being.dnaExpress?.hormoneRhythm;
  const neural = being.dnaExpress?.neural;
  const pulse = (profile.hrmPulseBase ?? 0.012) * (rhythm?.pulseMult ?? 1);
  const decay = rhythm?.decayBias ?? profile.hrmDecay ?? 0.985;
  const puberty = applyPubertyH1Bump(being, profile);

  for (const k of HORMONE_KEYS) {
    being.hormoneVec[k] = +(being.hormoneVec[k] * decay).toFixed(4);
  }

  if (hrmN > 0) {
    const synth =
      pulse *
      hrmN *
      (1 + nrvN * (neural?.nrvBoost ?? 0.04) + brnN * (neural?.brnBoost ?? 0.03));
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
      `[HRM] h0=${being.hormoneVec.h0} h1=${being.hormoneVec.h1} hrm×${hrmN}${puberty ? ' puberty' : ''}`,
      {
        kind: 'HRM',
        trigger: 'tick',
        hrmCount: hrmN,
        pubertyBump: puberty,
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
