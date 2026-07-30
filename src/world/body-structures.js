// 体表结构 — 交配凹凸、哺乳/摄取接触（机制层 STR-*）

import { getSubCellByRole } from './organism.js';
import { multicellV2Enabled } from './multicell-v2.js';
import { noteSemDomainFromKind } from './sem-domain.js';
import { slotIndex, SLOT_COUNT } from './social.js';
import { expressMorphSlot } from '../genetics/dna-express.js';

export const STR_PAIR_OUT = 'STR-PAIR-OUT';
export const STR_PAIR_IN = 'STR-PAIR-IN';
export const STR_LACT_OUT = 'STR-LACT-OUT';
export const STR_ING_IN = 'STR-ING-IN';

export function morphSlotHash(being) {
  const seq = being?.dna?.sequence ?? being?.id ?? '';
  if (being?.dnaExpress?.morphSlot != null) return being.dnaExpress.morphSlot;
  return expressMorphSlot(seq, being?.id ?? '');
}

function morphSlotsCompatible(slotA, slotB, profile) {
  const mod = profile.pairMorphMod ?? 97;
  const delta = Math.abs(slotA - slotB) % mod;
  const maxDelta = profile.pairMorphMaxDelta ?? 48;
  return delta <= maxDelta || delta >= mod - maxDelta;
}

function channelOverlap(a, b) {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(b);
  return a.filter((ch) => set.has(ch)).length;
}

function slotDistance(a, b) {
  const ia = slotIndex(a?.socialSlot ?? 'S0');
  const ib = slotIndex(b?.socialSlot ?? 'S0');
  const d = Math.abs(ia - ib);
  return Math.min(d, SLOT_COUNT - d);
}

/** 成体：形态 A 凸出口 / B 凹接受腔 */
export function initAdultMatingStructures(being, profile, atTick = 0) {
  if (!multicellV2Enabled(profile)) return null;
  being.bodyStructures = being.bodyStructures ?? {};
  const morphSlot = morphSlotHash(being);

  if (being.pairMorph === 'A' && !being.bodyStructures[STR_PAIR_OUT]?.open) {
    const act = getSubCellByRole(being, 'act') ?? being.subCells?.[1] ?? being.subCells?.[0];
    being.bodyStructures[STR_PAIR_OUT] = {
      code: STR_PAIR_OUT,
      open: true,
      atTick,
      morphSlot,
      subCellId: act?.id ?? null,
      subRole: act?.role ?? 'act',
      channelIdx: act?.channels?.[0] ?? null,
      channels: act?.channels ? [...act.channels] : [],
    };
    return being.bodyStructures[STR_PAIR_OUT];
  }

  if (being.pairMorph === 'B' && !being.bodyStructures[STR_PAIR_IN]?.open) {
    const draw = getSubCellByRole(being, 'draw') ?? being.subCells?.[0];
    being.bodyStructures[STR_PAIR_IN] = {
      code: STR_PAIR_IN,
      open: true,
      atTick,
      morphSlot,
      subCellId: draw?.id ?? null,
      subRole: draw?.role ?? 'draw',
      channelIdx: draw?.channels?.[0] ?? null,
      channels: draw?.channels ? [...draw.channels] : [],
    };
    return being.bodyStructures[STR_PAIR_IN];
  }
  return null;
}

/** 评估 A 排出结构 ↔ B 接受结构是否匹配 */
export function assessPairStructureFit(emitter, receiver, profile, half = null) {
  if (!multicellV2Enabled(profile)) {
    return { fit: true, reason: 'multicell-off' };
  }
  const out = emitter?.bodyStructures?.[STR_PAIR_OUT];
  const inStr = receiver?.bodyStructures?.[STR_PAIR_IN];
  if (!out?.open || !inStr?.open) {
    return { fit: true, reason: 'structures-pending', overlap: 0, morphMatch: true };
  }

  const outChannels = half?.channels?.length ? half.channels : out.channels ?? [];
  const inChannels = inStr.channels ?? [];
  const overlap = channelOverlap(outChannels, inChannels);
  const minAff = profile.pairStructMinAffinity ?? 1;
  const morphMatch = morphSlotsCompatible(
    out.morphSlot ?? morphSlotHash(emitter),
    inStr.morphSlot ?? morphSlotHash(receiver),
    profile
  );
  const fit = overlap >= minAff && morphMatch;
  return {
    fit,
    overlap,
    morphMatch,
    morphA: out.morphSlot,
    morphB: inStr.morphSlot,
    reason: fit ? 'PAIR-FIT' : overlap < minAff ? 'channel' : 'morph',
  };
}

export function recordPairStructureEvent(world, recorder, emitter, receiver, assessment, trigger) {
  const kind = assessment.fit ? 'PAIR-FIT' : 'PAIR-MISMATCH';
  recorder.evolution(
    world.tick,
    emitter?.id ?? receiver?.id,
    `[${kind}] ${trigger} overlap ${assessment.overlap} morph ${assessment.morphMatch}`,
    {
      kind,
      trigger,
      emitterId: emitter?.id ?? null,
      receiverId: receiver?.id ?? null,
      overlap: assessment.overlap,
      morphMatch: assessment.morphMatch,
      morphA: assessment.morphA,
      morphB: assessment.morphB,
    }
  );
  if (emitter) noteSemDomainFromKind(emitter, kind, world.tick);
  if (receiver) noteSemDomainFromKind(receiver, kind, world.tick);
}

/** 分娩后：B 泌乳出口 + 幼体摄取入口 */
export function initNursingStructures(parent, child, profile, atTick = 0) {
  if (!multicellV2Enabled(profile) || parent.pairMorph !== 'B') return null;
  const lactTicks = profile.lactationTicks ?? profile.nurtureTicks ?? 64;
  const drawP = getSubCellByRole(parent, 'draw') ?? parent.subCells?.[0];
  const drawC = getSubCellByRole(child, 'draw') ?? child.subCells?.[0];

  parent.bodyStructures = parent.bodyStructures ?? {};
  parent.bodyStructures[STR_LACT_OUT] = {
    code: STR_LACT_OUT,
    open: true,
    atTick,
    untilTick: atTick + lactTicks,
    subCellId: drawP?.id ?? null,
    channels: drawP?.channels ? [...drawP.channels] : [],
    childId: child.id,
  };

  child.bodyStructures = child.bodyStructures ?? {};
  child.bodyStructures[STR_ING_IN] = {
    code: STR_ING_IN,
    open: true,
    atTick,
    parentId: parent.id,
    subCellId: drawC?.id ?? null,
    channels: drawC?.channels ? [...drawC.channels] : [],
  };
  return { lact: parent.bodyStructures[STR_LACT_OUT], ing: child.bodyStructures[STR_ING_IN] };
}

/** 幼体摄取口接触泌乳结构时额外通量 [LAC] */
export function tickLactationContact(world, recorder, child, profile) {
  if (!multicellV2Enabled(profile) || child.independent !== false) return null;

  const ing = child.bodyStructures?.[STR_ING_IN];
  if (!ing?.open) return null;

  const parentId = ing.parentId ?? child.nurtureParentId;
  const parent = world.beings.find((b) => b.alive && b.id === parentId);
  if (!parent) return null;

  const lact = parent.bodyStructures?.[STR_LACT_OUT];
  if (!lact?.open) return null;
  if (lact.untilTick != null && world.tick > lact.untilTick) {
    lact.open = false;
    return null;
  }

  const overlap = channelOverlap(lact.channels ?? [], ing.channels ?? []);
  const minOverlap = profile.lactMinChannelOverlap ?? 1;
  const maxSlot = profile.lactMaxSlotDist ?? 2;
  if (overlap < minOverlap || slotDistance(parent, child) > maxSlot) return null;

  const grant = profile.lactTickGrant ?? 0.016;
  const transfers = [];
  for (let i = 0; i < parent.registers.length; i++) {
    const amount = Math.min(parent.registers[i], grant);
    if (amount <= 0.0001) continue;
    parent.registers[i] = Math.max(0, parent.registers[i] - amount);
    child.registers[i] = Math.max(0, Math.min(1, child.registers[i] + amount * 0.65));
    transfers.push({ idx: i, amount });
  }
  if (!transfers.length) return null;

  recorder.evolution(
    world.tick,
    child.id,
    `[LAC] contact ${parent.id} overlap ${overlap} ch×${transfers.length}`,
    {
      kind: 'LAC',
      parentId: parent.id,
      overlap,
      slotDist: slotDistance(parent, child),
      transfers: transfers.length,
    }
  );
  noteSemDomainFromKind(child, 'LAC', world.tick);
  noteSemDomainFromKind(parent, 'LAC', world.tick);
  parent.lactContactCount = (parent.lactContactCount ?? 0) + 1;
  parent.lastLacTick = world.tick;
  if (parent.hormoneVec?.h2 != null) {
    parent.lactHormonePulse = +Math.min(1, parent.hormoneVec.h2 + 0.04).toFixed(4);
  }
  return { transfers, parentId: parent.id, overlap };
}
