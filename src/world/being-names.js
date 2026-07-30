// 个体姓名 — 姓 / 名（机制层，非地球语 CODEX 固定表）

import { hashString, mulberry32 } from '../core/hash.js';

const MALE_SURNAMES = ['赵', '钱', '孙', '李'];
const FEMALE_SURNAMES = ['周', '吴', '郑', '王'];
const MALE_GIVEN = ['雄一', '雄二', '雄三', '雄四'];
const FEMALE_GIVEN = ['雌一', '雌二', '雌三', '雌四'];
const CHILD_GIVEN = ['嗣一', '嗣二', '嗣三', '嗣四', '嗣五', '嗣六', '嗣七', '嗣八', '嗣九', '嗣十'];

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
    if (morph === 'A') family = MALE_SURNAMES[index % MALE_SURNAMES.length];
    else if (morph === 'B') family = FEMALE_SURNAMES[index % FEMALE_SURNAMES.length];
    else family = '氏';
  }
  if (!given) {
    if (morph === 'A') given = MALE_GIVEN[index % MALE_GIVEN.length];
    else if (morph === 'B') given = FEMALE_GIVEN[index % FEMALE_GIVEN.length];
    else given = `体${index + 1}`;
  }
  being.familyName = family;
  being.givenName = given;
  being.name = formatBeingDisplayName(being);
  if (!being.lineageHeadId) being.lineageHeadId = being.id;
  return being;
}

export function assignChildName(being, surnameParent, world) {
  const rng = mulberry32(hashString(`${being.id}:${world?.tick ?? 0}:child-name`));
  const idx = Math.floor(rng() * CHILD_GIVEN.length);
  being.familyName = surnameParent?.familyName ?? surnameParent?.name?.split('·')[0] ?? '氏';
  being.givenName = CHILD_GIVEN[idx];
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
