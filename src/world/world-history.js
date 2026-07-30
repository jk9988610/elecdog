// 观察台 tick 回退 — 世界状态快照（避开 structuredClone 无法克隆 rng / Map）

import { Being } from '../being/being.js';
import { hashString, mulberry32 } from '../core/hash.js';

const MAP_TAG = '__map__';

function snapshotReplacer(_key, value) {
  if (value instanceof Map) {
    return { [MAP_TAG]: true, entries: [...value.entries()] };
  }
  if (typeof value === 'function') {
    return undefined;
  }
  return value;
}

function reviveMaps(value) {
  if (Array.isArray(value)) {
    return value.map(reviveMaps);
  }
  if (value && typeof value === 'object') {
    if (value[MAP_TAG] && Array.isArray(value.entries)) {
      return new Map(value.entries);
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = reviveMaps(v);
    }
    return out;
  }
  return value;
}

/** 可 JSON 序列化的世界快照（剔除函数、保留 Map 条目） */
export function snapshotWorldState(world) {
  if (!world) return null;
  return JSON.parse(JSON.stringify(world, snapshotReplacer));
}

/** 从快照恢复世界，重建 Being 实例、rng 与 Map */
export function restoreWorldState(data) {
  if (!data) return null;
  const world = reviveMaps(data);
  world.beings = (world.beings ?? []).map(rehydrateBeing);
  rehydrateWorldRng(world);
  return world;
}

export function rehydrateBeing(plain) {
  if (!plain?.id || !plain?.dna?.sequence) return plain;
  const being = new Being({
    name: plain.name ?? '个体',
    code: plain.code ?? '001',
    dna: plain.dna,
    id: plain.id,
  });
  for (const key of Object.keys(plain)) {
    if (key === 'rng') continue;
    being[key] = plain[key];
  }
  if (plain.registers?.length) {
    being.registers = [...plain.registers];
  }
  being.rng = mulberry32(hashString(`${plain.dna.sequence}:${plain.id}`));
  return being;
}

function rehydrateWorldRng(world) {
  const name = world.name ?? '';
  const place = world.birthPlace ?? '01';
  if (world.substrate) {
    world.substrate = { ...world.substrate };
    world.substrate.rng = mulberry32(hashString(`drift:${place}:${name}`));
  }
  if (world.catastrophe) {
    world.catastrophe = { ...world.catastrophe };
    world.catastrophe.rng = mulberry32(hashString(`${name}:${place}:catastrophe`));
  }
}
