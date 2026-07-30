// 繁殖亲属门控 — 禁止父母↔子女求偶

export function isReproKinBlocked(a, b) {
  if (!a?.id || !b?.id || a.id === b.id) return true;
  if (b.pairParentA === a.id || b.pairParentB === a.id) return true;
  if (a.pairParentA === b.id || a.pairParentB === b.id) return true;
  if (b.fissionParent === a.id || a.fissionParent === b.id) return true;
  if (b.lineageParent === a.id || a.lineageParent === b.id) return true;
  return false;
}
