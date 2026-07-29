// GAP-ORG Phase 89 — FUS 捕获 [SYM] module packet

import { hashString } from '../core/hash.js';
import { SOLAR_CHANNEL } from './diurnal.js';
import { reservoirEnabled } from './reservoir.js';

export function symCaptureEnabled(profile) {
  return profile?.symCaptureEnabled === true && reservoirEnabled(profile);
}

export function initSymModules(being) {
  if (!being.symModules) being.symModules = [];
  being.symCaptureCount = being.symCaptureCount ?? 0;
  being.symFluxTotal = being.symFluxTotal ?? 0;
}

/** FUS 成功时并入半自治模块 packet */
export function captureSymOnFus(world, child, parentA, parentB, profile) {
  if (!symCaptureEnabled(profile)) return null;
  initSymModules(child);

  const h = hashString(`${parentA.id}:${parentB.id}:${child.id}:${world.tick}:sym`);
  const role = h % 2 === 0 ? 'store' : 'draw';
  const mod = {
    id: `m${(h % 10000).toString().padStart(4, '0')}`,
    role,
    channel: SOLAR_CHANNEL,
    active: true,
    amp: role === 'store' ? (profile.symStoreAmp ?? 0.015) : (profile.symDrawAmp ?? 0.095),
    capturedAt: world.tick,
    fromFus: { a: parentA.id, b: parentB.id },
    fluxTotal: 0,
  };

  child.symModules.push(mod);
  child.symCaptureCount = (child.symCaptureCount ?? 0) + 1;
  world.symCaptureTotal = (world.symCaptureTotal ?? 0) + 1;

  return mod;
}

/** 模块每 tick 通量：store → reservoir；draw → r */
export function tickSymModules(
  being,
  profile,
  { stress = 0, solar = 0, night = false } = {}
) {
  if (!being.symModules?.length || !being.alive || !being.reservoir?.length) {
    return null;
  }

  const events = [];
  for (const mod of being.symModules) {
    if (!mod.active) continue;

    if (mod.role === 'store' && solar >= (profile.symSolarMin ?? 0.1) && !night && stress < 0.34) {
      const idx = mod.channel ?? SOLAR_CHANNEL;
      const cap = 1 - (being.reservoir[idx] ?? 0);
      const amount = Math.min(cap, solar * (mod.amp ?? 0.015));
      if (amount < 0.0003) continue;
      being.reservoir[idx] = (being.reservoir[idx] ?? 0) + amount;
      mod.fluxTotal = (mod.fluxTotal ?? 0) + amount;
      events.push({ action: 'store', moduleId: mod.id, idx, amount });
    }

    if (mod.role === 'draw' && (night || stress >= (profile.symDrawStress ?? 0.22) || being.lowStreak >= 2)) {
      const idx = mod.channel ?? SOLAR_CHANNEL;
      const release = Math.min(being.reservoir[idx] ?? 0, mod.amp ?? 0.095);
      if (release < 0.0003) continue;
      being.reservoir[idx] -= release;
      being.registers[idx] = Math.min(1, (being.registers[idx] ?? 0) + release * 0.85);
      mod.fluxTotal = (mod.fluxTotal ?? 0) + release;
      events.push({ action: 'draw', moduleId: mod.id, idx, amount: release });
    }
  }

  if (!events.length) return null;

  const flux = events.reduce((s, e) => s + e.amount, 0);
  being.symFluxTotal = (being.symFluxTotal ?? 0) + flux;

  const reservoirSum = +being.reservoir.reduce((a, b) => a + b, 0).toFixed(4);
  return { events, reservoirSum, flux: +flux.toFixed(4) };
}

export function countActiveSymModules(beings) {
  return beings.reduce((s, b) => s + (b.symModules?.filter((m) => m.active)?.length ?? 0), 0);
}
