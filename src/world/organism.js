// 个体形态 — 单细胞域 vs 多子单元域（不设器官/组织名称表）

import { hashString, mulberry32 } from '../core/hash.js';
import { SUBSTRATE_CHANNELS } from './substrate.js';
import { assignCellBoundary, assessCellIntegrity, pickMetabolicChannel } from './cell.js';
import { MET_DRAW_BASE, MET_LOW_THRESHOLD } from './substrate.js';

export const MULTICELL_SUB_COUNT = 3;
const SUB_ROLES = ['draw', 'act', 'balance'];

export function organismModeFromProfile(profile) {
  const mode = profile?.organismMode ?? 'unicell';
  if (mode === 'multicell' || mode === 'all_multicell') return 'multicell';
  return 'unicell';
}

function partitionChannels(dnaSequence, id) {
  const rng = mulberry32(hashString(`${dnaSequence}:${id}:subcell`));
  const pool = Array.from({ length: SUBSTRATE_CHANNELS }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const per = Math.floor(SUBSTRATE_CHANNELS / MULTICELL_SUB_COUNT);
  const subCells = [];
  for (let s = 0; s < MULTICELL_SUB_COUNT; s++) {
    const start = s * per;
    const end = s === MULTICELL_SUB_COUNT - 1 ? SUBSTRATE_CHANNELS : start + per;
    subCells.push({
      id: `sc${s}`,
      role: SUB_ROLES[s],
      channels: pool.slice(start, end).sort((a, b) => a - b),
    });
  }
  return subCells;
}

export function initOrganism(being, profile) {
  const mode = organismModeFromProfile(profile);
  being.organismType = mode;
  if (mode !== 'multicell') {
    being.subCells = null;
    if (!being.cellBoundary?.length) {
      being.cellBoundary = assignCellBoundary(being.dna.sequence, being.id);
    }
    return mode;
  }

  being.subCells = partitionChannels(being.dna.sequence, being.id);
  being.cellBoundary = [
    ...new Set(being.subCells.flatMap((sc) => sc.channels)),
  ].sort((a, b) => a - b);
  being.intraTick = 0;
  return mode;
}

function activeSubCell(being) {
  if (!being.subCells?.length) return null;
  const idx = being.intraTick % being.subCells.length;
  return being.subCells[idx];
}

/** 多子单元代谢：按轮值子单元摄取，子单元间通量再分配 */
export function multicellMetabolicExchange(world, being, opts = {}) {
  const ch = world.substrate.channels;
  const sub = activeSubCell(being);
  if (!sub) {
    return metabolicExchangeUnicell(world, being, opts);
  }

  const pseudo = {
    ...being,
    cellBoundary: sub.channels,
  };
  const { idx, crossBoundary } = pickMetabolicChannel(pseudo, ch);
  const activity = (opts.internalCount ?? 1) + (opts.hadExternal ? 1 : 0);
  const roleBoost = sub.role === 'act' && opts.hadExternal ? 1.15 : sub.role === 'draw' ? 1.1 : 1;
  const amount = Math.min(ch[idx], MET_DRAW_BASE * activity * (opts.drawMult ?? 1) * roleBoost);
  const integrity = assessCellIntegrity(being, ch);

  if (amount <= 0.0001) {
    return { draw: null, low: null, crossBoundary, integrity, intra: null };
  }

  ch[idx] = Math.max(0, ch[idx] - amount);
  being.registers[idx] = Math.max(0, Math.min(1, being.registers[idx] + amount * 0.3));

  const draw = {
    idx,
    amount,
    activity,
    channelAfter: ch[idx],
    crossBoundary,
    subCellId: sub.id,
    subRole: sub.role,
  };
  const low =
    ch[idx] < MET_LOW_THRESHOLD ? { idx, value: ch[idx], threshold: MET_LOW_THRESHOLD } : null;

  const intra = redistributeIntra(being, sub);
  being.intraTick = (being.intraTick ?? 0) + 1;

  return { draw, low, crossBoundary, integrity, intra };
}

function metabolicExchangeUnicell(world, being, opts) {
  const ch = world.substrate.channels;
  const { idx, crossBoundary } = pickMetabolicChannel(being, ch);
  const activity = (opts.internalCount ?? 1) + (opts.hadExternal ? 1 : 0);
  const amount = Math.min(ch[idx], MET_DRAW_BASE * activity * (opts.drawMult ?? 1));
  const integrity = assessCellIntegrity(being, ch);
  if (amount <= 0.0001) return { draw: null, low: null, crossBoundary, integrity, intra: null };

  ch[idx] = Math.max(0, ch[idx] - amount);
  being.registers[idx] = Math.max(0, Math.min(1, being.registers[idx] + amount * 0.3));
  const draw = { idx, amount, activity, channelAfter: ch[idx], crossBoundary };
  const low =
    ch[idx] < MET_LOW_THRESHOLD ? { idx, value: ch[idx], threshold: MET_LOW_THRESHOLD } : null;
  return { draw, low, crossBoundary, integrity, intra: null };
}

function redistributeIntra(being, active) {
  const others = being.subCells.filter((sc) => sc.id !== active.id);
  if (!others.length) return null;

  const transfers = [];
  for (const other of others) {
    const srcIdx = active.channels[0];
    const dstIdx = other.channels[other.channels.length - 1];
    const flux = being.registers[srcIdx] * 0.04;
    if (flux < 0.0005) continue;
    being.registers[srcIdx] = Math.max(0, being.registers[srcIdx] - flux);
    being.registers[dstIdx] = Math.max(0, Math.min(1, being.registers[dstIdx] + flux * 0.85));
    transfers.push({
      fromSub: active.id,
      toSub: other.id,
      fromRole: active.role,
      toRole: other.role,
      srcIdx,
      dstIdx,
      amount: flux,
    });
  }
  return transfers.length ? { activeSub: active.id, transfers } : null;
}

export function runMetabolism(world, being, opts = {}) {
  if (being.organismType === 'multicell') {
    return multicellMetabolicExchange(world, being, opts);
  }
  return metabolicExchangeUnicell(world, being, opts);
}
