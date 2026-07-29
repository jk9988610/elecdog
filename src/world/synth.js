// GAP-ORG Phase 88 — Synth-A/B：e☉/日相 → reservoir → r

import { reservoirEnabled } from './reservoir.js';
import { SOLAR_CHANNEL } from './diurnal.js';

export function synthEnabled(profile) {
  return profile?.synthEnabled === true && reservoirEnabled(profile);
}

export function initSynthCounters(being) {
  being.synthAInTotal = 0;
  being.synthBOutTotal = 0;
}

/**
 * Synth-A：solar × 基底 e☉ → reservoir
 * Synth-B：night 或高压 → reservoir → r
 */
export function tickSynth(being, profile, { stress = 0, solar = 0, night = false, substrate = null } = {}) {
  if (!synthEnabled(profile) || !being.reservoir?.length || !being.alive) {
    return null;
  }

  const solarIdx = profile.solarChannel ?? SOLAR_CHANNEL;
  const solarMin = profile.synthASolarMin ?? 0.12;
  const synthAAmp = profile.synthAAmp ?? 0.024;
  const synthAMaxStress = profile.synthAMaxStress ?? 0.32;
  const synthBStress = profile.synthBStress ?? 0.24;
  const synthBAmp = profile.synthBAmp ?? 0.11;
  const synthBNightAmp = profile.synthBNightAmp ?? 0.14;

  const events = [];
  const eSun = substrate?.[solarIdx] ?? being.registers[solarIdx] ?? 0;

  if (solar >= solarMin && stress < synthAMaxStress && !night) {
    const cap = 1 - (being.reservoir[solarIdx] ?? 0);
    const amount = Math.min(cap, solar * synthAAmp * Math.max(0.35, eSun));
    if (amount >= 0.0003) {
      being.reservoir[solarIdx] = (being.reservoir[solarIdx] ?? 0) + amount;
      events.push({ kind: 'synth-a', idx: solarIdx, amount, solar, eSun });
      being.synthAInTotal = (being.synthAInTotal ?? 0) + amount;
    }
  }

  const needB = night || stress >= synthBStress || being.lowStreak >= 2;
  if (needB) {
    let idx = solarIdx;
    let best = being.reservoir[idx] ?? 0;
    for (let i = 0; i < being.reservoir.length; i++) {
      if ((being.reservoir[i] ?? 0) > best) {
        best = being.reservoir[i];
        idx = i;
      }
    }
    const amp = night ? synthBNightAmp : synthBAmp;
    const release = Math.min(best, amp);
    if (release >= 0.0003) {
      being.reservoir[idx] = best - release;
      being.registers[idx] = Math.min(1, (being.registers[idx] ?? 0) + release * 0.88);
      events.push({
        kind: 'synth-b',
        idx,
        amount: release,
        night,
        stress,
        lowStreak: being.lowStreak,
      });
      being.synthBOutTotal = (being.synthBOutTotal ?? 0) + release;
    }
  }

  if (!events.length) return null;

  const reservoirSum = +being.reservoir.reduce((a, b) => a + b, 0).toFixed(4);
  return { events, reservoirSum };
}
