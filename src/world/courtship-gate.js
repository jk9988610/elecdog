// 求偶门控 — 成体、非孕妇、无伴侣、非亲属

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

export function hasPartner(being) {
  return Boolean(being?.partnerId);
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

/** 拥有伴侣的个体不发送求偶 */
export function canSendCourtship(being, world, profile = world?.envProfile) {
  if (!being?.alive || hasPartner(being)) return false;
  if (being.pairMorph === 'A') {
    return isAdultReproMale(being, world, profile);
  }
  if (being.pairMorph === 'B') {
    return isAdultReproFemale(being, world, profile);
  }
  return false;
}

export function canMaleCourtFemale(male, female, world, profile = world?.envProfile) {
  if (!male?.alive || !female?.alive) return { ok: false, reason: 'dead' };
  if (male.pairMorph !== 'A' || female.pairMorph !== 'B') return { ok: false, reason: 'morph' };
  if (!meiAllowedForBeing(male, world, profile)) return { ok: false, reason: 'male-juv' };
  if (!maleHasSperm(male)) return { ok: false, reason: 'no-sperm' };
  if (hasPartner(male) && male.partnerId !== female.id) return { ok: false, reason: 'male-partner' };
  if (isPregnant(female)) return { ok: false, reason: 'pregnant' };
  if (isReproKinBlocked(male, female, profile)) return { ok: false, reason: 'kin' };
  if (female.partnerId && female.partnerId !== male.id) return { ok: false, reason: 'female-partner' };
  return { ok: true, reason: 'ok' };
}

export function canFemaleCourtMale(female, male, world, profile = world?.envProfile) {
  if (!female?.alive || !male?.alive) return { ok: false, reason: 'dead' };
  if (female.pairMorph !== 'B' || male.pairMorph !== 'A') return { ok: false, reason: 'morph' };
  if (!meiAllowedForBeing(female, world, profile)) return { ok: false, reason: 'female-juv' };
  if (!femaleHasEgg(female)) return { ok: false, reason: 'no-egg' };
  if (hasPartner(female) && female.partnerId !== male.id) return { ok: false, reason: 'female-partner' };
  if (hasPartner(male) && male.partnerId !== female.id) return { ok: false, reason: 'male-partner' };
  if (isPregnant(female)) return { ok: false, reason: 'pregnant' };
  if (isReproKinBlocked(female, male, profile)) return { ok: false, reason: 'kin' };
  return { ok: true, reason: 'ok' };
}

export function canCourtPair(initiator, target, world, profile = world?.envProfile) {
  if (initiator?.pairMorph === 'A' && target?.pairMorph === 'B') {
    return canMaleCourtFemale(initiator, target, world, profile);
  }
  if (initiator?.pairMorph === 'B' && target?.pairMorph === 'A') {
    return canFemaleCourtMale(initiator, target, world, profile);
  }
  return { ok: false, reason: 'morph' };
}

export function canFemaleGrantMale(female, male, world, profile = world?.envProfile) {
  const court = canMaleCourtFemale(male, female, world, profile);
  if (!court.ok) return court;
  if (!femaleHasEgg(female)) return { ok: false, reason: 'no-egg' };
  return { ok: true, reason: 'ok' };
}

export function canMaleGrantFemale(male, female, world, profile = world?.envProfile) {
  const court = canFemaleCourtMale(female, male, world, profile);
  if (!court.ok) return court;
  if (!maleHasSperm(male)) return { ok: false, reason: 'no-sperm' };
  return { ok: true, reason: 'ok' };
}
