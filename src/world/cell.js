// 公理: A2 — 细胞边界；DNA 决定的代谢域（4/8 通道），不设膜/器官名称表

import { hashString, mulberry32 } from '../core/hash.js';
import { SUBSTRATE_CHANNELS } from './substrate.js';

export const CELL_DOMAIN_SIZE = 4;
export const CELL_INTEGRITY_LOW = 0.48;

export function assignCellBoundary(dnaSequence, id) {
  const rng = mulberry32(hashString(`${dnaSequence}:${id}:cell`));
  const indices = new Set();
  while (indices.size < CELL_DOMAIN_SIZE) {
    indices.add(Math.floor(rng() * SUBSTRATE_CHANNELS));
  }
  return [...indices].sort((a, b) => a - b);
}

/** 膜内场态对齐占比 → 完整性 0–1 */
export function assessCellIntegrity(being, substrate) {
  if (!being.cellBoundary?.length || !substrate) return 1;
  let inGap = 0;
  let outGap = 0;
  for (let i = 0; i < substrate.length; i++) {
    const gap = Math.abs(being.registers[i] - substrate[i]);
    if (being.cellBoundary.includes(i)) inGap += gap;
    else outGap += gap;
  }
  return Math.max(0, Math.min(1, inGap / (inGap + outGap + 0.001)));
}

export function pickMetabolicChannel(being, channels) {
  const boundary = being.cellBoundary;
  let idx = boundary[0];
  let maxGap = -1;
  for (const i of boundary) {
    const gap = Math.abs(being.registers[i] - channels[i]);
    if (gap > maxGap) {
      maxGap = gap;
      idx = i;
    }
  }

  const boundaryUsable = boundary.some((i) => channels[i] > 0.05);
  let crossBoundary = false;
  if (!boundaryUsable) {
    for (let i = 0; i < SUBSTRATE_CHANNELS; i++) {
      if (boundary.includes(i)) continue;
      const gap = Math.abs(being.registers[i] - channels[i]);
      if (gap > maxGap) {
        maxGap = gap;
        idx = i;
        crossBoundary = true;
      }
    }
  }
  return { idx, crossBoundary };
}
