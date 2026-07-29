// GAP-ORG Phase 84 — 储备池与 r 分离；[RSV] in/out 记录层

import { hashString, mulberry32 } from '../core/hash.js';

export function reservoirEnabled(profile) {
  return profile?.reservoirEnabled === true;
}

export function initReservoir(being, profile) {
  if (!reservoirEnabled(profile)) {
    being.reservoir = null;
    return null;
  }
  const n = being.registers.length;
  const rng = mulberry32(hashString(`${being.dna.sequence}:${being.id}:rsv`));
  const seedMax = profile.reservoirSeedMax ?? 0.08;
  being.reservoir = Array.from({ length: n }, () => rng() * seedMax);
  return being.reservoir;
}

/**
 * 每 tick：DRW 储存分支 + 低压寄存器 skim（in）；高压或 LOW 连击动用（out）
 */
export function tickReservoir(
  being,
  profile,
  { stress = 0, draw = null, hadLow = false } = {}
) {
  if (!reservoirEnabled(profile) || !being.reservoir?.length || !being.alive) {
    return null;
  }

  const storeMaxStress = profile.reservoirStoreMaxStress ?? 0.28;
  const outStress = profile.reservoirOutStress ?? 0.32;
  const outLowStreak = profile.reservoirOutLowStreak ?? 2;
  const storeFrac = profile.reservoirStoreFrac ?? 0.06;
  const outFrac = profile.reservoirOutFrac ?? 0.12;
  const storeRegMin = profile.reservoirStoreRegMin ?? 0.22;
  const drwBranchFrac = profile.reservoirDrwBranchFrac ?? 0.12;

  const events = [];

  if (draw?.idx != null && stress < storeMaxStress) {
    const idx = draw.idx;
    const branch = Math.min(being.registers[idx] ?? 0, draw.amount * drwBranchFrac);
    if (branch >= 0.0003) {
      being.registers[idx] = Math.max(0, being.registers[idx] - branch);
      being.reservoir[idx] = Math.min(1, (being.reservoir[idx] ?? 0) + branch);
      events.push({ phase: 'in', idx, amount: branch, via: 'drw' });
    }
  }

  if (stress < storeMaxStress && !hadLow) {
    for (let i = 0; i < being.registers.length; i++) {
      const reg = being.registers[i];
      if (reg < storeRegMin) continue;
      const move = Math.min(reg * storeFrac, 1 - (being.reservoir[i] ?? 0));
      if (move < 0.0003) continue;
      being.registers[i] = reg - move;
      being.reservoir[i] = (being.reservoir[i] ?? 0) + move;
      events.push({ phase: 'in', idx: i, amount: move, via: 'skim' });
    }
  }

  if (stress >= outStress || being.lowStreak >= outLowStreak) {
    let idx = draw?.idx ?? 0;
    if (draw?.idx == null) {
      let best = 0;
      for (let i = 1; i < being.reservoir.length; i++) {
        if ((being.reservoir[i] ?? 0) > (being.reservoir[best] ?? 0)) best = i;
      }
      idx = best;
    }
    const avail = being.reservoir[idx] ?? 0;
    const release = Math.min(avail, outFrac);
    if (release >= 0.0003) {
      being.reservoir[idx] = avail - release;
      being.registers[idx] = Math.min(1, (being.registers[idx] ?? 0) + release * 0.9);
      events.push({
        phase: 'out',
        idx,
        amount: release,
        stress,
        lowStreak: being.lowStreak,
      });
    }
  }

  if (!events.length) return null;

  const reservoirSum = +being.reservoir.reduce((a, b) => a + b, 0).toFixed(4);
  return { events, reservoirSum };
}
