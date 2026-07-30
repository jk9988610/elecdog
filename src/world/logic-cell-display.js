// 逻辑细胞展示层 — 边缘类型降级为通道/不显示

import { LOGIC_CELL_TYPES, STEM_CELL_CODE, STEM_CELL_TYPE } from './logic-cell-types.js';

/** 已从分化表移除、仅作通道标记的类型（兼容旧存档计数） */
export const CHANNEL_ONLY_LOGIC = new Set([
  'LOG-UMB', // → STR-UMB 脐带通道
  'LOG-BAR', // → 皮肤膜 MBR-SKN
]);

/** 观察台族谱详情中展示的类型 */
export const DISPLAY_LOGIC_CODES = new Set([
  STEM_CELL_CODE,
  'LOG-DIG',
  'LOG-RES',
  'LOG-MOT',
  'LOG-NRV',
  'LOG-BRN',
  'LOG-LNG',
  'LOG-GON',
  'LOG-HRM',
  'LOG-NTR',
  'LOG-SEN-TH',
  'LOG-SEN-TM',
  'LOG-SEN-GU',
  'LOG-SEN-VS',
  'LOG-SEN-AU',
  'LOG-SEN-OL',
]);

export function logicTypeDisplayed(code) {
  return DISPLAY_LOGIC_CODES.has(code);
}

export function displayLogicCellTypes() {
  return LOGIC_CELL_TYPES.filter((t) => DISPLAY_LOGIC_CODES.has(t.code));
}

export function displayLogicRows(being) {
  const counts = being?.logicCells ?? {};
  const rows = [];
  if (DISPLAY_LOGIC_CODES.has(STEM_CELL_CODE)) {
    rows.push({ code: STEM_CELL_CODE, analogy: STEM_CELL_TYPE.analogy, n: counts[STEM_CELL_CODE]?.length ?? 0, max: STEM_CELL_TYPE.max });
  }
  for (const t of displayLogicCellTypes()) {
    rows.push({ code: t.code, analogy: t.analogy, n: counts[t.code]?.length ?? 0, max: t.max });
  }
  return rows;
}
