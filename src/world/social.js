// 公理: A2 — 社会位；可观察标签，非预制角色名

import { hashString } from '../core/hash.js';

export const SLOT_COUNT = 4;

export function assignSocialSlot(beingId) {
  const idx = hashString(beingId) % SLOT_COUNT;
  return `S${idx}`;
}

export function slotIndex(slot) {
  return parseInt(slot.slice(1), 10);
}
