// 求偶门控 — 成体、非孕妇、无他人伴侣、非亲属

import { meiAllowedForBeing } from './multicell-v2.js';
import { isReproKinBlocked } from './kinship-gate.js';

export function isPregnant(being) {
  return Boolean(being?.syncyte) || being?.pregnant === true;
}

export function maleHasSperm(being) {
  return Boolean(being?.meiPacket?.seq);
}

export function femaleHasEgg(being) {
  return Boolean(being?.dockedHalf?.seq);
}

export function isAdultReproMale(being, world, profile) {
  return (
    being?.alive &&
    being.pairMorph === 'A' &&
    meiAllowedForBeing(being, world, profile) &&
    maleHasSperm(being)
  );
}

export function isAdultReproFemale(being, world, profile) {
  return (
    being?.alive &&
    being.pairMorph === 'B' &&
    meiAllowedForBeing(being, world, profile) &&
    femaleHasEgg(being) &&
    !isPregnant(being)
  );
}

export function canMaleCourtFemale(male, female, world, profile = world?.envProfile) {
  if (!male?.alive || !female?.alive) return { ok: false, reason: 'dead' };
  if (male.pairMorph !== 'A' || female.pairMorph !== 'B') return { ok: false, reason: 'morph' };
  if (!meiAllowedForBeing(male, world, profile)) return { ok: false, reason: 'male-juv' };
  if (!maleHasSperm(male)) return { ok: false, reason: 'no-sperm' };
  if (isPregnant(female)) return { ok: false, reason: 'pregnant' };
  if (isReproKinBlocked(male, female)) return { ok: false, reason: 'kin' };
  if (female.partnerId && female.partnerId !== male.id) return { ok: false, reason: 'female-partner' };
  if (male.partnerId && male.partnerId !== female.id) return { ok: false, reason: 'male-partner' };
  return { ok: true, reason: 'ok' };
}

export function canFemaleGrantMale(female, male, world, profile = world?.envProfile) {
  const court = canMaleCourtFemale(male, female, world, profile);
  if (!court.ok) return court;
  if (!femaleHasEgg(female)) return { ok: false, reason: 'no-egg' };
  return { ok: true, reason: 'ok' };
}
