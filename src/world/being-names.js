// 个体姓名 — 数字代号（姓 / 名，机制层）

import { hashString, mulberry32 } from '../core/hash.js';

function numericFromId(id, salt, digits = 2) {
  const rng = mulberry32(hashString(`${id}:${salt}:num-name`));
  const max = 10 ** digits;
  const min = 10 ** (digits - 1);
  return String(Math.floor(rng() * (max - min)) + min);
}

export function formatBeingDisplayName(being) {
  const family = being?.familyName ?? '';
  const given = being?.givenName ?? being?.name ?? '';
  if (family && given) return `${family}·${given}`;
  return (given || family || being?.name) ?? '—';
}

export function assignBeingNames(being, { familyName = null, givenName = null, index = 0, pairMorph = null } = {}) {
  const morph = pairMorph ?? being?.pairMorph;
  let family = familyName;
  let given = givenName;
  if (!family) {
    family = morph === 'A' ? numericFromId(being?.id ?? String(index), 'fam-m', 2) : numericFromId(being?.id ?? String(index), 'fam-f', 2);
  }
  if (!given) {
    given = numericFromId(being?.id ?? String(index), 'giv', 3);
  }
  being.familyName = family;
  being.givenName = given;
  being.name = formatBeingDisplayName(being);
  if (!being.lineageHeadId) being.lineageHeadId = being.id;
  return being;
}

export function assignChildName(being, surnameParent, world) {
  being.familyName = surnameParent?.familyName ?? numericFromId(being.id, 'child-fam', 2);
  being.givenName = numericFromId(`${being.id}:${world?.tick ?? 0}`, 'child-giv', 3);
  being.name = formatBeingDisplayName(being);
  being.lineageHeadId = surnameParent?.lineageHeadId ?? surnameParent?.id ?? being.id;
  return being;
}

/** 伴侣登记中的求偶发起方（雄/雌形态唯一） */
export function courtshipInitiatorFromPair(male, female) {
  if (!male || !female) return null;
  const morph = male.bondCourtshipInitiatorMorph ?? female.bondCourtshipInitiatorMorph;
  if (morph === 'B') return female;
  if (morph === 'A') return male;
  return male;
}

export function formatCourtshipBondLine(initiator, target) {
  if (!initiator || !target) return null;
  const roleFrom = initiator.pairMorph === 'A' ? '雄' : initiator.pairMorph === 'B' ? '雌' : '体';
  const roleTo = target.pairMorph === 'A' ? '雄' : target.pairMorph === 'B' ? '雌' : '体';
  return `${roleFrom}·${formatBeingDisplayName(initiator)} 向 ${roleTo}·${formatBeingDisplayName(target)} 求偶`;
}

export function courtshipBondLineForCouple(male, female) {
  if (!male || !female) return null;
  const initiator = courtshipInitiatorFromPair(male, female);
  const target = initiator === male ? female : male;
  return formatCourtshipBondLine(initiator, target);
}

export function applyGenealogyLineOnBond(
  male,
  female,
  courtshipInitiatorMorph,
  courtshipInitiatorId = null
) {
  if (!male || !female) return null;
  let init = courtshipInitiatorMorph === 'B' ? 'B' : 'A';
  if (courtshipInitiatorId === male.id) init = 'A';
  else if (courtshipInitiatorId === female.id) init = 'B';
  if (init === 'A') {
    const head = male.lineageHeadId ?? male.id;
    male.lineageHeadId = head;
    female.lineageHeadId = head;
    male.surnameLineMorph = 'A';
    female.surnameLineMorph = 'A';
  } else {
    const head = female.lineageHeadId ?? female.id;
    female.lineageHeadId = head;
    male.lineageHeadId = head;
    male.surnameLineMorph = 'B';
    female.surnameLineMorph = 'B';
  }
  male.bondCourtshipInitiatorMorph = init;
  female.bondCourtshipInitiatorMorph = init;
  male.bondCourtshipInitiatorId = init === 'A' ? male.id : female.id;
  female.bondCourtshipInitiatorId = male.bondCourtshipInitiatorId;
  return { initiator: init, headId: init === 'A' ? male.lineageHeadId : female.lineageHeadId };
}
