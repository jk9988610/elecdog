// 族谱个体阶段徽章 — 婴 / 幼 / 成 / 孕（非孕妇误标）

import {
  LIFE_STAGE_GEST,
  LIFE_STAGE_JUV,
  LIFE_STAGE_ADT,
} from './logic-cell-types.js';
import { isPregnant } from './courtship-gate.js';

export const STAGE_BADGE_INFANT = '婴';
export const STAGE_BADGE_JUV = '幼';
export const STAGE_BADGE_ADULT = '成';
export const STAGE_BADGE_PREG = '孕';
export const STAGE_BADGE_GEST = '胎';

/** 是否在哺乳/依赖期（出生后未断奶） */
export function isNursingInfant(being) {
  return being?.alive && being.independent === false;
}

/** 仅成体雌且宫内合胞 — 幼体永不标孕 */
export function isDisplayPregnant(being) {
  if (!being?.alive || being.pairMorph !== 'B') return false;
  if (isNursingInfant(being)) return false;
  if (being.lifeStage === LIFE_STAGE_JUV) return false;
  if ((being.tickCount ?? 0) < (being.adultAtTick ?? Infinity)) return false;
  return isPregnant(being);
}

/**
 * 族谱卡片徽章：婴（未断奶）→ 幼（断奶未成体）→ 成（成体）；
 * 孕仅成体妊娠雌。
 */
export function genealogyStageBadge(being) {
  if (!being?.alive) return null;

  const dev = being.devStage ?? being.lifeStage;
  const life = being.lifeStage;

  if (isDisplayPregnant(being)) {
    return { code: STAGE_BADGE_PREG, className: 'genealogy-preg-badge' };
  }

  if (life === LIFE_STAGE_ADT || dev === LIFE_STAGE_ADT) {
    return { code: STAGE_BADGE_ADULT, className: 'genealogy-stage-badge stage-adt' };
  }

  if (dev === LIFE_STAGE_GEST) {
    if (isNursingInfant(being)) {
      return { code: STAGE_BADGE_INFANT, className: 'genealogy-stage-badge stage-infant' };
    }
    if (life === LIFE_STAGE_JUV || being.devStage === LIFE_STAGE_JUV) {
      return { code: STAGE_BADGE_JUV, className: 'genealogy-stage-badge stage-juv' };
    }
    return { code: STAGE_BADGE_INFANT, className: 'genealogy-stage-badge stage-infant' };
  }

  if (isNursingInfant(being)) {
    return { code: STAGE_BADGE_INFANT, className: 'genealogy-stage-badge stage-infant' };
  }

  if (life === LIFE_STAGE_JUV || dev === LIFE_STAGE_JUV) {
    return { code: STAGE_BADGE_JUV, className: 'genealogy-stage-badge stage-juv' };
  }

  return null;
}

export function stageBadgeLabel(being) {
  const b = genealogyStageBadge(being);
  return b?.code ?? '—';
}
