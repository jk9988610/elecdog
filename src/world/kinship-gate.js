// 繁殖亲属门控 — 族谱 ID + DNA 血缘标签

import {
  cohortPairKinBlocked,
  isDnaKinBlocked,
  isFullSibling,
  isHalfSibling,
  isParentChildId,
  kinshipRelationLabel,
} from '../genetics/dna-kinship.js';

export function isReproKinBlocked(a, b, profile = null) {
  if (!a?.id || !b?.id || a.id === b.id) return true;
  if (isParentChildId(a, b)) return true;
  if (isFullSibling(a, b)) return true;
  if (isHalfSibling(a, b)) return true;
  if (profile && isDnaKinBlocked(a, b, profile)) return true;
  return false;
}

export function kinshipLabelBetween(a, b, profile = null) {
  return kinshipRelationLabel(a, b, profile ?? {});
}

export function cohortKinBlocked(a, b, profile = null) {
  return cohortPairKinBlocked(a, b, profile ?? {});
}
