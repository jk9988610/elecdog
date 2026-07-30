// MV4 — 多细胞 v2 观察台布局：族谱 vs 经典单细胞卡片

import { multicellV2Observer } from '../world/multicell-v2.js';

const LS_OBSERVER_LAYOUT = 'elecdog-observer-layout';

export const LAYOUT_GENEALOGY = 'genealogy';
export const LAYOUT_CLASSIC = 'classic';

export function getObserverLayoutMode() {
  try {
    const v = localStorage.getItem(LS_OBSERVER_LAYOUT);
    if (v === LAYOUT_CLASSIC || v === LAYOUT_GENEALOGY) return v;
  } catch {
    /* ignore */
  }
  return LAYOUT_GENEALOGY;
}

export function setObserverLayoutMode(mode) {
  if (mode !== LAYOUT_CLASSIC && mode !== LAYOUT_GENEALOGY) {
    throw new Error(`invalid observer layout: ${mode}`);
  }
  try {
    localStorage.setItem(LS_OBSERVER_LAYOUT, mode);
  } catch {
    /* ignore */
  }
  return mode;
}

/** 多细胞 v2 环境是否展示族谱面板（否则经典 being-card） */
export function shouldShowGenealogyPanel(profile, layoutMode = getObserverLayoutMode()) {
  if (!multicellV2Observer(profile)) return false;
  return layoutMode === LAYOUT_GENEALOGY;
}

export function observerLayoutHint() {
  return '多细胞 v2：族谱与经典卡片为同一套机制，仅展示形式不同；无种群层统计。';
}

export function observerLayoutLabel(mode) {
  return mode === LAYOUT_CLASSIC ? '经典卡片' : '族谱';
}
