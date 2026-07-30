// 多细胞 v2 — 一夫一妻伴侣登记（机制：partnerId，非地球婚恋 CODEX）

import { alignPartnerMatingChannels } from './body-structures.js';
export function partnerBondEnabled(profile) {
  return profile?.partnerBondEnabled === true || profile?.multicellV2Enabled === true;
}

export function monogamyEnforced(profile) {
  return profile?.monogamyEnforced === true || profile?.multicellV2Enabled === true;
}

function hasOtherPartner(being, otherId) {
  if (!being.partnerId) return false;
  return being.partnerId !== otherId;
}

/** 登记伴侣；A/B 形态均可调用，族谱 UI 以 A 为主干 */
export function registerPartnerBond(world, recorder, a, b, { trigger = 'BOND' } = {}) {
  const profile = world.envProfile ?? {};
  if (!partnerBondEnabled(profile)) return null;
  if (!a?.alive || !b?.alive || a.id === b.id) return null;

  if (monogamyEnforced(profile)) {
    if (hasOtherPartner(a, b.id) || hasOtherPartner(b, a.id)) return null;
  }

  a.partnerId = b.id;
  b.partnerId = a.id;
  a.partnerBondTick = world.tick;
  b.partnerBondTick = world.tick;
  a.partnerBondCount = (a.partnerBondCount ?? 0) + 1;
  b.partnerBondCount = (b.partnerBondCount ?? 0) + 1;

  const male = a.pairMorph === 'A' ? a : b.pairMorph === 'A' ? b : null;
  const female = a.pairMorph === 'B' ? a : b.pairMorph === 'B' ? b : null;
  if (male && female) {
    alignPartnerMatingChannels(male, female);
    male.pairGrantFrom = female.id;
  }

  if (recorder) {
    recorder.evolution(world.tick, a.id, `[BOND] partner ${b.id} ${trigger}`, {
      kind: 'BOND',
      partnerId: b.id,
      trigger,
      morphA: a.pairMorph ?? null,
      morphB: b.pairMorph ?? null,
    });
    recorder.social(world.tick, a.id, `[SOC] bond ${b.socialSlot}`, {
      kind: 'BOND',
      partnerId: b.id,
      slot: a.socialSlot,
      partnerSlot: b.socialSlot,
    });
  }

  return { aId: a.id, bId: b.id, trigger };
}

export function partnerSnapshot(being) {
  return {
    partnerId: being.partnerId ?? null,
    partnerBondTick: being.partnerBondTick ?? null,
    partnerBondCount: being.partnerBondCount ?? 0,
  };
}
