// GAP-PAIR-0 — 体内合胞、宫内通量、外排与依赖期（不设配子/性别/通道名）

import { hashString, mulberry32 } from '../core/hash.js';
import { reduceDna, recombineDna, mutate } from '../core/dna.js';
import { birthIntoWorld } from '../birth/spawn.js';
import { applyNurtureAtBirth } from './nurture.js';
import { replicationEnabled } from './replication.js';
import { meiEnabled } from './recombination.js';
import { applyEhuLineageEcho } from './electronic-human-profile.js';
import { applyMemLineageEcho } from './lineage-memory.js';
import { applySemLineageEcho } from './sem-lineage.js';
import { slotIndex, SLOT_COUNT } from './social.js';
import { getSubCellByRole } from './organism.js';
import { noteSemDomainFromKind } from './sem-domain.js';
import { multicellV2Enabled, LIFE_STAGE_ADT, LIFE_STAGE_JUV, initEmbryoInSyncyte, tickEmbryoDevelopment, applyEmbryoLogicToChild } from './multicell-v2.js';
import {
  initGestationalUmbilical,
  tickUmbilicalFlux,
  umbilicalActive,
  closeUmbilicalOnExpel,
} from './umbilical.js';
import {
  assessPairStructureFit,
  alignPartnerMatingChannels,
  initAdultMatingStructures,
  STR_PAIR_IN,
  STR_PAIR_OUT,
  recordPairStructureEvent,
} from './body-structures.js';
import { registerPartnerBond } from './partner-bond.js';
import { meiAllowedForBeing } from './multicell-v2.js';
import {
  canCourtPair,
  canFemaleGrantMale,
  canMaleGrantFemale,
  canSendCourtship,
  isPregnant,
} from './courtship-gate.js';
import { isReproKinBlocked } from './kinship-gate.js';
import { dnaFingerprint } from '../genetics/dna-kinship.js';
import { issueHealthReport } from './health-report.js';
import { assignChildName } from './being-names.js';

function substrateAvg(world) {
  const ch = world.substrate?.channels;
  if (!ch?.length) return 0;
  return ch.reduce((a, b) => a + b, 0) / ch.length;
}

export function pairReproEnabled(profile) {
  return profile?.pairReproEnabled === true;
}

export function pairFusInBodyEnabled(profile) {
  return pairReproEnabled(profile) && profile?.pairFusInBody === true;
}

/** PAIR-1：半态排入环境场，体内不直接合胞 */
export function pairHalfReleaseEnabled(profile) {
  return pairFusInBodyEnabled(profile) && profile?.pairHalfRelease === true;
}

/** PAIR-2：排入场前须 [PRQ]/[PGR] 许可握手 */
export function pairHandshakeEnabled(profile) {
  return pairHalfReleaseEnabled(profile) && profile?.pairHandshake === true;
}

/** 繁殖言语驱动：许可请求/授予仅来自定向 [TX]，不自动广播 [PRQ] */
export function pairSpeechDriven(profile) {
  return pairHandshakeEnabled(profile) && profile?.pairSpeechDriven === true;
}

/** 伴侣登记后优先体内通道合胞（相对排入场） */
export function pairPartnerChannelFus(profile) {
  return pairFusInBodyEnabled(profile) && profile?.pairPartnerChannelFus === true;
}

/** PAIR-3：半态排出/接受绑定 subCell 与 r_k / e_k */
export function pairChannelBindEnabled(profile) {
  return pairHalfReleaseEnabled(profile) && profile?.pairChannelBind === true;
}

/** PAIR-4：接受方子单元多维激素向量 h_k = r_k − w·e_k */
export function pairHormoneVectorEnabled(profile) {
  return pairHalfReleaseEnabled(profile) && profile?.pairHormoneVector === true;
}

export function ensurePairRequests(world) {
  if (!world.pairRequests) world.pairRequests = [];
}

export function ensureFieldHalves(world) {
  if (!world.fieldHalves) world.fieldHalves = [];
}

function dnaDockBias(being) {
  return mulberry32(hashString(`${being.dna.sequence}:${being.id}:dock`))();
}

/** 形态 B 激素标量（PAIR-0 对照） */
export function pairGateH(being, world) {
  const profile = world.envProfile ?? {};
  const rMean = being.registers.reduce((a, b) => a + b, 0) / being.registers.length;
  const eMean = substrateAvg(world);
  return +(rMean - eMean * (profile.pairGateFieldWeight ?? 0.35)).toFixed(4);
}

/** PAIR-4：八通道激素向量 h_k = r_k − w·e_k */
export function pairGateVector(being, world) {
  const profile = world.envProfile ?? {};
  const w = profile.pairGateFieldWeight ?? 0.35;
  const e = world.substrate?.channels ?? [];
  return being.registers.map((r, k) => +(r - w * (e[k] ?? 0)).toFixed(4));
}

function hormoneVectorSummary(being, world, profile) {
  const hVec = pairGateVector(being, world);
  const acceptSub = resolveAcceptSubCell(being, profile);
  const indices = acceptSub?.channels?.length ? acceptSub.channels : hVec.map((_, i) => i);
  const vals = indices.map((k) => hVec[k]);
  const hMean = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4) : 0;
  const hMin = vals.length ? +Math.min(...vals).toFixed(4) : 0;
  return { hVec, indices, hMean, hMin, acceptSubId: acceptSub?.id ?? null };
}

function hormoneVectorGateOpen(being, world, profile) {
  const { hMean, hMin } = hormoneVectorSummary(being, world, profile);
  const meanMin = profile.pairHormoneMeanMin ?? 0.06;
  const floorMin = profile.pairHormoneFloorMin ?? 0.01;
  return hMean > meanMin && hMin > floorMin;
}

function recordHormoneVector(world, recorder, being, trigger) {
  if (!pairHormoneVectorEnabled(world.envProfile)) return;
  const profile = world.envProfile ?? {};
  const { hVec, indices, hMean, hMin, acceptSubId } = hormoneVectorSummary(being, world, profile);
  recorder.evolution(world.tick, being.id, `[HRM] ${trigger} μ${hMean} min${hMin}`, {
    kind: 'HRM',
    trigger,
    hMean,
    hMin,
    hVec: indices.map((k) => hVec[k]),
    channels: indices,
    acceptSubId,
  });
  noteSemDomainFromKind(being, 'HRM', world.tick);
}

export function pairGateOpen(being, world) {
  const profile = world.envProfile ?? {};
  if (pairHormoneVectorEnabled(profile)) {
    return hormoneVectorGateOpen(being, world, profile);
  }
  return pairGateH(being, world) > (profile.pairGateMin ?? 0.08);
}

function resolveReleaseChannelMeta(being, profile) {
  if (!pairChannelBindEnabled(profile)) return null;
  const role = profile.pairReleaseSubRole ?? 'act';
  const sub = getSubCellByRole(being, role) ?? being.subCells?.[0];
  if (!sub?.channels?.length) return null;
  const channelIdx = sub.channels.reduce(
    (best, ch) => ((being.registers[ch] ?? 0) > (being.registers[best] ?? 0) ? ch : best),
    sub.channels[0]
  );
  return {
    subCellId: sub.id,
    subRole: sub.role,
    channelIdx,
    channels: [...sub.channels],
  };
}

function resolveAcceptSubCell(being, profile) {
  const role = profile.pairAcceptSubRole ?? 'draw';
  return getSubCellByRole(being, role) ?? being.subCells?.[0] ?? null;
}

/** MEI/DCK 后附加 subCell·通道元数据（PAIR-3） */
export function annotatePairHalfMetadata(being, profile) {
  const meta = resolveReleaseChannelMeta(being, profile);
  if (!meta) return null;
  if (being.meiPacket) Object.assign(being.meiPacket, meta);
  if (being.dockedHalf) Object.assign(being.dockedHalf, meta);
  return meta;
}

function channelAffinity(half, being, profile) {
  const acceptSub = resolveAcceptSubCell(being, profile);
  if (!half?.channels?.length || !acceptSub?.channels?.length) return 0;
  return half.channels.filter((ch) => acceptSub.channels.includes(ch)).length;
}

/** PAIR-3：接受方须在绑定通道上满足 r_k / e_k 阈值 */
export function pairChannelAcceptOpen(being, world, half, profile = world.envProfile ?? {}) {
  if (!pairChannelBindEnabled(profile)) return pairGateOpen(being, world);
  if (!pairGateOpen(being, world)) return false;

  const acceptSub = resolveAcceptSubCell(being, profile);
  const rMin = profile.pairAcceptRMin ?? 0.08;
  const eMin = profile.pairAcceptEMin ?? 0.06;

  const candidateChannels = new Set();
  if (half?.channelIdx != null) candidateChannels.add(half.channelIdx);
  for (const ch of half?.channels ?? []) {
    if (!acceptSub || acceptSub.channels.includes(ch)) candidateChannels.add(ch);
  }
  if (!candidateChannels.size && acceptSub?.channels?.length) {
    for (const ch of acceptSub.channels) candidateChannels.add(ch);
  }

  for (const ch of candidateChannels) {
    const rK = being.registers[ch] ?? 0;
    const eK = world.substrate?.channels?.[ch] ?? 0;
    if (rK > rMin && eK > eMin) return true;
  }
  return false;
}

/** 出生时为形态 B 预置驻留半态（singleton） */
export function initDockedHalf(world, being) {
  const profile = world.envProfile ?? {};
  if (!pairReproEnabled(profile) || being.pairMorph !== 'B') return null;
  if (being.dockedHalf) return being.dockedHalf;
  const seed = hashString(`${being.id}:${world.tick}:dock-init`);
  being.dockedHalf = { seq: reduceDna(being.dna.sequence, seed), atTick: world.tick, init: true };
  annotatePairHalfMetadata(being, profile);
  return being.dockedHalf;
}

const ADULT_MATE_CHANNEL = 7;

function pinMatingChannel(being, structCode, channel) {
  const st = being?.bodyStructures?.[structCode];
  if (st) {
    st.channels = [channel];
    st.channelIdx = channel;
  }
}

/** 分娩或伴侣登记后恢复成体配子包与交配结构 */
export function restoreAdultReproPackages(being, world, profile) {
  if (!being?.alive) return being;
  initAdultMatingStructures(being, profile, world.tick ?? 0);
  if (being.pairMorph === 'A') {
    pinMatingChannel(being, STR_PAIR_OUT, ADULT_MATE_CHANNEL);
    if (!being.meiPacket?.seq) {
      const seed = hashString(`${being.id}:${world.tick ?? 0}:sperm-restore`);
      being.meiPacket = {
        seq: reduceDna(being.dna.sequence, seed),
        atTick: world.tick ?? 0,
        adultSeed: true,
      };
    }
    annotatePairHalfMetadata(being, profile);
  } else if (being.pairMorph === 'B' && !being.syncyte) {
    pinMatingChannel(being, STR_PAIR_IN, ADULT_MATE_CHANNEL);
    if (!being.dockedHalf) initDockedHalf(world, being);
    annotatePairHalfMetadata(being, profile);
    const pairIn = being.bodyStructures?.[STR_PAIR_IN];
    if (pairIn?.pregnancyClosed) {
      pairIn.open = true;
      pairIn.pregnancyClosed = false;
    }
  }
  const partner = world.beings?.find((b) => b.id === being.partnerId);
  if (partner?.alive) {
    const male = being.pairMorph === 'A' ? being : partner.pairMorph === 'A' ? partner : null;
    const female = being.pairMorph === 'B' ? being : partner.pairMorph === 'B' ? partner : null;
    if (male && female) {
      alignPartnerMatingChannels(male, female);
      male.pairGrantFrom = female.id;
    }
  }
  return being;
}

/** 形态 B 补全驻留半态（至多 1 个） */
export function tryDockedHalf(world, recorder, being, { stress = 0, integrity = 1 } = {}) {
  const profile = world.envProfile;
  if (!pairFusInBodyEnabled(profile) || !meiEnabled(profile) || !being.alive) return null;
  if (!meiAllowedForBeing(being, world, profile)) return null;
  if (being.pairMorph !== 'B' || being.syncyte) return null;
  if (being.dockedHalf || being.independent === false) return null;
  if (!replicationEnabled(profile)) return null;

  if (being.tickCount < (profile.meiMinAge ?? 40)) return null;
  if (stress > (profile.meiMaxStress ?? 0.26)) return null;
  if (integrity != null && integrity < (profile.meiMinIntegrity ?? 0.5)) return null;
  if (substrateAvg(world) < (profile.meiMinSubstrate ?? 0.44)) return null;

  const cooldown = profile.dockCooldown ?? profile.meiCooldown ?? 80;
  const since = world.tick - (being.lastDockTick ?? -cooldown);
  if (since < cooldown) return null;

  const bias = dnaDockBias(being);
  const prob = Math.min(0.75, (profile.dockBaseProb ?? 0.32) + bias * 0.28);
  const roll = mulberry32(hashString(`${being.id}:${world.tick}:dock`))();
  if (roll > prob) return null;

  const seed = hashString(`${being.id}:${world.tick}:dock-reduce`);
  const seq = reduceDna(being.dna.sequence, seed);
  being.dockedHalf = { seq, atTick: world.tick };
  being.lastDockTick = world.tick;
  being.dockCount = (being.dockCount ?? 0) + 1;
  annotatePairHalfMetadata(being, profile);

  recorder.evolution(world.tick, being.id, `[DCK] half len ${seq.length}`, {
    kind: 'DCK',
    packetLen: seq.length,
    pairMorph: 'B',
  });
  noteSemDomainFromKind(being, 'DCK', world.tick);
  return { seq };
}

function slotDistance(a, b) {
  const ia = slotIndex(a?.socialSlot ?? 'S0');
  const ib = slotIndex(b?.socialSlot ?? 'S0');
  const d = Math.abs(ia - ib);
  return Math.min(d, SLOT_COUNT - d);
}

function resolveParentA(world, half, fallbackB) {
  const found = world.beings.find((b) => b.id === half.fromId);
  if (found) return found;
  return {
    id: half.fromId,
    name: 'A',
    code: fallbackB.code,
    registers: fallbackB.registers,
    generation: 0,
  };
}

function hasValidPairGrant(world, being) {
  if (!being.pairGrantFrom) return false;
  const grantor = world.beings.find((b) => b.id === being.pairGrantFrom);
  return Boolean(grantor?.alive && grantor.pairMorph === 'B');
}

/** 定向言语 [TX] PRQ — 雄或雌向非血缘异性求偶（仅附带 DNA 指纹） */
export function registerPairSpeechPRQ(world, recorder, from, toId, txLine = null) {
  if (!pairSpeechDriven(world.envProfile)) return null;
  if (!from?.alive || !canSendCourtship(from, world)) return null;
  const target = world.beings.find((x) => x.id === toId);
  if (!target?.alive) return null;
  const gate = canCourtPair(from, target, world);
  if (!gate.ok) {
    recorder.evolution(world.tick, from.id, `[PRQ-BLOCK] ${toId} ${gate.reason}`, {
      kind: 'PRQ-BLOCK',
      toId,
      reason: gate.reason,
    });
    return null;
  }
  if (from.pairMorph === 'A' && hasValidPairGrant(world, from)) return null;

  ensurePairRequests(world);
  const profile = world.envProfile ?? {};
  const maxAge = profile.pairRequestMaxAge ?? 48;
  const tick = world.tick;
  const dnaFp = dnaFingerprint(from.dna?.sequence ?? '');

  world.pairRequests = world.pairRequests.filter((r) => r.fromId !== from.id);
  const req = {
    fromId: from.id,
    toId,
    fromMorph: from.pairMorph,
    socialSlot: from.socialSlot ?? 'S0',
    atTick: tick,
    expireTick: tick + maxAge,
    packetLen:
      from.pairMorph === 'A'
        ? from.meiPacket?.seq?.length ?? 0
        : from.dockedHalf?.seq?.length ?? 0,
    speechDriven: true,
    dnaFp,
    beingId: from.id,
  };
  world.pairRequests.push(req);

  recorder.evolution(tick, from.id, `[PRQ] speech @${toId} fp ${dnaFp}`, {
    kind: 'PRQ',
    packetLen: req.packetLen,
    expireTick: req.expireTick,
    grantTo: toId,
    fromMorph: from.pairMorph,
    speechDriven: true,
    dnaFp,
    txLine,
  });
  noteSemDomainFromKind(from, 'PRQ', tick);
  return req;
}

/** 定向言语 PGR — 雌授予雄，或雄回应雌的求偶 */
export function registerPairSpeechPGR(world, recorder, grantor, initiatorId, txLine = null) {
  if (!pairSpeechDriven(world.envProfile)) return null;
  const profile = world.envProfile ?? {};
  const initiator = world.beings.find((x) => x.id === initiatorId);
  if (!grantor?.alive || !initiator?.alive) return null;

  let gate;
  let a;
  let b;
  if (grantor.pairMorph === 'B' && initiator.pairMorph === 'A') {
    if (!grantor.dockedHalf || isPregnant(grantor)) return null;
    if (!initiator.meiPacket) return null;
    gate = canFemaleGrantMale(grantor, initiator, world);
    a = initiator;
    b = grantor;
    if (!pairGateOpen(grantor, world)) return null;
  } else if (grantor.pairMorph === 'A' && initiator.pairMorph === 'B') {
    if (!grantor.meiPacket) return null;
    if (!initiator.dockedHalf || isPregnant(initiator)) return null;
    gate = canMaleGrantFemale(grantor, initiator, world);
    a = grantor;
    b = initiator;
    if (!pairGateOpen(initiator, world)) return null;
  } else {
    return null;
  }
  if (!gate.ok) return null;

  ensurePairRequests(world);
  const req = world.pairRequests.find(
    (r) => r.fromId === initiatorId && r.toId === grantor.id
  );
  if (req && initiator && isReproKinBlocked(grantor, initiator, profile)) {
    recorder.evolution(world.tick, grantor.id, `[PRQ-IGNORE] ${initiatorId} kin-dna`, {
      kind: 'PRQ-IGNORE',
      fromId: initiatorId,
      reason: 'kin-dna',
    });
    world.pairRequests = world.pairRequests.filter((r) => r.fromId !== initiatorId);
    return null;
  }

  const structFit = assessPairStructureFit(a, b, profile, a.meiPacket);
  if (b.bodyStructures?.['STR-PAIR-IN']?.open && a.bodyStructures?.['STR-PAIR-OUT']?.open) {
    alignPartnerMatingChannels(a, b);
    const refit = assessPairStructureFit(a, b, profile, a.meiPacket);
    recordPairStructureEvent(world, recorder, a, b, refit, 'PGR');
    if (!refit.fit) return null;
  }

  const tick = world.tick;
  const hadReq = Boolean(req);

  a.pairGrantFrom = b.id;
  world.pairRequests = world.pairRequests.filter((r) => r.fromId !== initiatorId);
  b.pairGrantCount = (b.pairGrantCount ?? 0) + 1;
  recordHormoneVector(world, recorder, b, 'PGR');

  recorder.evolution(tick, grantor.id, `[PGR] speech grant ${initiatorId}`, {
    kind: 'PGR',
    grantTo: initiatorId,
    fromId: grantor.id,
    grantMorph: grantor.pairMorph,
    speechDriven: true,
    hadReq,
    txLine,
  });
  noteSemDomainFromKind(a, 'PGR', tick);
  noteSemDomainFromKind(b, 'PGR', tick);
  if (!req) return null;
  registerPartnerBond(world, recorder, a, b, {
    trigger: 'PGR',
    courtshipInitiatorMorph: initiator.pairMorph,
    courtshipInitiatorId: initiator.id,
  });
  return { aId: a.id, bId: b.id };
}

/** PAIR-2：形态 A 发 [PRQ]，形态 B 门控后发 [PGR] */
export function processPairHandshake(world, recorder) {
  if (!pairHandshakeEnabled(world.envProfile)) return [];
  ensurePairRequests(world);
  const profile = world.envProfile ?? {};
  const speechDriven = pairSpeechDriven(profile);
  const maxAge = profile.pairRequestMaxAge ?? 48;
  const tick = world.tick;
  const events = [];

  world.pairRequests = world.pairRequests.filter((r) => r.expireTick > tick);

  if (!speechDriven) {
    for (const a of world.beings.filter((b) => b.alive && b.pairMorph === 'A' && b.meiPacket)) {
      if (hasValidPairGrant(world, a)) continue;
      if (world.pairRequests.some((r) => r.fromId === a.id)) continue;

      const req = {
        fromId: a.id,
        socialSlot: a.socialSlot ?? 'S0',
        atTick: tick,
        expireTick: tick + maxAge,
        packetLen: a.meiPacket.seq.length,
      };
      world.pairRequests.push(req);
      recorder.evolution(tick, a.id, `[PRQ] request len ${req.packetLen}`, {
        kind: 'PRQ',
        packetLen: req.packetLen,
        expireTick: req.expireTick,
      });
      noteSemDomainFromKind(a, 'PRQ', tick);
      events.push({ type: 'PRQ', aId: a.id });
    }
  }

  if (speechDriven) {
    return events;
  }

  const morphB = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'B' && b.dockedHalf && !b.syncyte && pairGateOpen(b, world)
  );
  const grantedA = new Set();

  for (const b of morphB) {
    const candidates = world.pairRequests
      .filter((r) => !grantedA.has(r.fromId))
      .sort((x, y) => slotDistance({ socialSlot: x.socialSlot }, b) - slotDistance({ socialSlot: y.socialSlot }, b));
    if (!candidates.length) continue;

    const req = candidates[0];
    const a = world.beings.find((x) => x.id === req.fromId);
    if (!a?.alive || !a.meiPacket) continue;

    a.pairGrantFrom = b.id;
    grantedA.add(req.fromId);
    world.pairRequests = world.pairRequests.filter((r) => r.fromId !== req.fromId);
    b.pairGrantCount = (b.pairGrantCount ?? 0) + 1;
    recordHormoneVector(world, recorder, b, 'PGR');

    recorder.evolution(tick, b.id, `[PGR] grant ${a.id}`, {
      kind: 'PGR',
      grantTo: a.id,
      fromId: b.id,
    });
    noteSemDomainFromKind(a, 'PGR', tick);
    noteSemDomainFromKind(b, 'PGR', tick);
    events.push({ type: 'PGR', aId: a.id, bId: b.id });
  }

  return events;
}

/** 形态 A 将体内半态排入环境场（singleton / 源） */
export function releaseFieldHalves(world, recorder) {
  if (!pairHalfReleaseEnabled(world.envProfile)) return [];
  const profile = world.envProfile ?? {};
  if (pairPartnerChannelFus(profile)) return [];
  ensureFieldHalves(world);
  const handshake = pairHandshakeEnabled(profile);
  const maxAge = profile.pairFieldHalfMaxAge ?? 96;
  const events = [];

  for (const a of world.beings.filter((b) => b.alive && b.pairMorph === 'A' && b.meiPacket)) {
    if (handshake && !hasValidPairGrant(world, a)) continue;
    if (pairPartnerChannelFus(profile)) {
      const mate = a.partnerId ? world.beings.find((x) => x.id === a.partnerId) : null;
      if (!mate?.alive || mate.pairMorph !== 'B' || a.pairGrantFrom !== mate.id) continue;
    }

    world.fieldHalves = world.fieldHalves.filter((h) => h.fromId !== a.id);
    const chMeta = pairChannelBindEnabled(profile)
      ? {
          subCellId: a.meiPacket.subCellId,
          subRole: a.meiPacket.subRole,
          channelIdx: a.meiPacket.channelIdx,
          channels: a.meiPacket.channels ? [...a.meiPacket.channels] : undefined,
        }
      : {};
    const half = {
      id: `${a.id}:${world.tick}`,
      seq: a.meiPacket.seq,
      fromId: a.id,
      socialSlot: a.socialSlot ?? 'S0',
      grantFrom: a.pairGrantFrom ?? null,
      atTick: world.tick,
      expireTick: world.tick + maxAge,
      ...chMeta,
    };
    world.fieldHalves.push(half);
    a.meiPacket = null;
    a.pairGrantFrom = null;
    a.fieldReleaseCount = (a.fieldReleaseCount ?? 0) + 1;
    const fldKind = chMeta.channelIdx != null ? 'FLD-CH' : 'FLD';
    recorder.evolution(world.tick, a.id, `[${fldKind}] release len ${half.seq.length} e${chMeta.channelIdx ?? '?'}`, {
      kind: fldKind,
      packetLen: half.seq.length,
      expireTick: half.expireTick,
      grantFrom: half.grantFrom,
      channelIdx: chMeta.channelIdx ?? null,
      subCellId: chMeta.subCellId ?? null,
    });
    noteSemDomainFromKind(a, fldKind, world.tick);
    events.push(half);
  }
  return events;
}

export function decayFieldHalves(world) {
  if (!pairHalfReleaseEnabled(world.envProfile)) return 0;
  ensureFieldHalves(world);
  const before = world.fieldHalves.length;
  const tick = world.tick;
  world.fieldHalves = world.fieldHalves.filter((h) => h.expireTick > tick);
  return before - world.fieldHalves.length;
}

/** 场合胞仅允许已登记伴侣的雌接受其伴侣释放的半态 */
function fieldFusPartnerAllowed(b, half, profile) {
  if (!b?.partnerId || b.partnerId !== half.fromId) return false;
  if (pairPartnerChannelFus(profile)) return true;
  return half.grantFrom == null || half.grantFrom === b.id;
}

/** PAIR-1：环境半态 + B 驻留半态 → 体内合胞（须伴侣登记；伴侣通道模式下由体内通道合胞） */
export function processPairFusFromField(world, recorder) {
  const profile = world.envProfile;
  if (!pairHalfReleaseEnabled(profile)) return [];
  if (pairPartnerChannelFus(profile)) return [];

  ensureFieldHalves(world);
  const morphB = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'B' && b.dockedHalf && !b.syncyte
  );
  if (!morphB.length || !world.fieldHalves.length) return [];

  const events = [];
  const usedHalves = new Set();
  const usedB = new Set();

  for (const b of morphB) {
    if (usedB.has(b.id)) continue;
    const candidates = world.fieldHalves
      .filter(
        (h) =>
          !usedHalves.has(h.id) &&
          fieldFusPartnerAllowed(b, h, profile) &&
          pairChannelAcceptOpen(b, world, h, profile)
      )
      .sort((x, y) => {
        const slotD = slotDistance({ socialSlot: x.socialSlot }, b) - slotDistance({ socialSlot: y.socialSlot }, b);
        if (slotD !== 0) return slotD;
        if (pairChannelBindEnabled(profile)) {
          return channelAffinity(y, b, profile) - channelAffinity(x, b, profile);
        }
        return 0;
      });
    if (!candidates.length) continue;

    const half = candidates[0];
    const parentA = resolveParentA(world, half, b);
    createSyncyteOnB(world, recorder, parentA, b, half.seq, b.dockedHalf.seq);
    usedHalves.add(half.id);
    usedB.add(b.id);
    b.fieldPickupCount = (b.fieldPickupCount ?? 0) + 1;
    const inKind = half.channelIdx != null ? 'FLD-CH-IN' : 'FLD-IN';
    recordHormoneVector(world, recorder, b, inKind);
    recorder.evolution(world.tick, b.id, `[${inKind}] ${half.fromId} → syncyte e${half.channelIdx ?? '?'}`, {
      kind: inKind,
      fromId: half.fromId,
      halfId: half.id,
      channelIdx: half.channelIdx ?? null,
      subCellId: half.subCellId ?? null,
    });
    noteSemDomainFromKind(b, inKind, world.tick);
    events.push({ type: inKind, aId: half.fromId, bId: b.id, halfId: half.id, channelIdx: half.channelIdx });
  }

  world.fieldHalves = world.fieldHalves.filter((h) => !usedHalves.has(h.id));
  return events;
}

function avgRegisters(a, b) {
  const n = Math.min(a.length, b.length);
  return Array.from({ length: n }, (_, i) => +((a[i] + b[i]) * 0.5).toFixed(4));
}

export function createSyncyteOnB(world, recorder, parentA, parentB, seqA, seqB) {
  const profile = world.envProfile ?? {};
  if (
    pairPartnerChannelFus(profile) &&
    (parentB.partnerId !== parentA.id || parentA.partnerId !== parentB.id)
  ) {
    return null;
  }
  if (parentB.postpartumUntilTick != null && world.tick < parentB.postpartumUntilTick) {
    return null;
  }
  if (parentB.syncyte || parentB.pregnant) {
    return null;
  }
  const gestationTicks = profile.gestationTicks ?? profile.nurtureTicks ?? 80;
  const seed = hashString(`${parentA.id}:${parentB.id}:${world.tick}:pair-fus`);
  const combined = recombineDna(seqA, seqB, seed);
  const rate = profile.fusionMutationRate ?? 0.015;
  const { seq, mutationCount } = mutate(combined, rate, seed + 1);

  parentB.syncyte = {
    dnaSeq: seq,
    registers: avgRegisters(parentA.registers, parentB.registers),
    gestationUntilTick: world.tick + gestationTicks,
    parentAId: parentA.id,
    atTick: world.tick,
    mutationCount,
  };

  parentB.pregnant = true;
  parentB.pregnantAtTick = world.tick;
  parentA.partnerChannelFusedAtTick = null;
  parentB.partnerChannelFusedAtTick = null;
  parentB.fertilizationEligibleAtTick = null;
  const pairIn = parentB.bodyStructures?.['STR-PAIR-IN'];
  if (pairIn?.open) {
    pairIn.open = false;
    pairIn.pregnancyClosed = true;
  }

  parentA.meiPacket = null;
  parentB.dockedHalf = null;
  parentA.pairFusCount = (parentA.pairFusCount ?? 0) + 1;
  parentB.pairFusCount = (parentB.pairFusCount ?? 0) + 1;

  recorder.evolution(
    world.tick,
    parentB.id,
    `[FUS-IN] ${parentA.id} → syncyte mut ${mutationCount}`,
    {
      kind: 'FUS-IN',
      parentA: parentA.id,
      parentB: parentB.id,
      mutationCount,
      gestationTicks,
    }
  );
  noteSemDomainFromKind(parentA, 'FUS-IN', world.tick);
  noteSemDomainFromKind(parentB, 'FUS-IN', world.tick);
  if (multicellV2Enabled(profile)) {
    initGestationalUmbilical(parentB, profile, world.tick);
    initEmbryoInSyncyte(parentB.syncyte, profile, seed + 2);
  }
  return parentB.syncyte;
}

function tickEmbFlux(world, recorder, carrier, syncyte) {
  const profile = world.envProfile ?? {};
  if (umbilicalActive(carrier, profile)) {
    return tickUmbilicalFlux(world, recorder, carrier, syncyte);
  }
  const frac = profile.embFluxFrac ?? 0.018;
  const transfers = [];
  for (let i = 0; i < carrier.registers.length; i++) {
    const grant = Math.min(carrier.registers[i], frac);
    if (grant <= 0.0001) continue;
    carrier.registers[i] = Math.max(0, carrier.registers[i] - grant);
    syncyte.registers[i] = Math.max(0, Math.min(1, syncyte.registers[i] + grant));
    transfers.push({ idx: i, amount: grant });
  }
  const substrate = world.substrate?.channels ?? [];
  for (let i = 0; i < carrier.registers.length; i++) {
    const floor = (substrate[i] ?? 0.4) * 0.42;
    if (carrier.registers[i] < floor) carrier.registers[i] = floor;
  }
  if (transfers.length) {
    recorder.evolution(world.tick, carrier.id, `[EMB] flux ${transfers.length}ch`, {
      kind: 'EMB',
      transfers: transfers.length,
      gestLeft: syncyte.gestationUntilTick - world.tick,
    });
    noteSemDomainFromKind(carrier, 'EMB', world.tick);
  }
  return transfers;
}

function expelSyncyte(world, recorder, carrier) {
  const profile = world.envProfile ?? {};
  const syncyte = carrier.syncyte;
  if (!syncyte?.dnaSeq) return null;

  const maxPop = profile.fusionMaxPop ?? profile.fissionMaxPop ?? 36;
  if (world.beings.filter((b) => b.alive).length >= maxPop) return null;

  const born = birthIntoWorld(world, recorder, {
    code: carrier.code,
    dnaSequence: syncyte.dnaSeq,
  });
  const child = born.being;
  const parentA = world.beings.find((b) => b.id === syncyte.parentAId);
  child.generation = Math.max(carrier.generation ?? 0, 1) + 1;
  child.registers = [...syncyte.registers];
  applyEmbryoLogicToChild(child, syncyte, world.tick);
  child.pairParentA = syncyte.parentAId;
  child.pairParentB = carrier.id;
  child.bornAtTick = world.tick;
  child.recombined = true;
  child.devStage = LIFE_STAGE_JUV;
  child.lifeStage = LIFE_STAGE_JUV;

  const surnameMorph = carrier.bondCourtshipInitiatorMorph ?? carrier.surnameLineMorph ?? 'A';
  const surnameParent = surnameMorph === 'A' ? parentA : carrier;
  assignChildName(child, surnameParent ?? carrier, world);

  applyEhuLineageEcho(world, recorder, child, [carrier], profile);
  applyMemLineageEcho(world, recorder, child, [carrier], profile, { via: 'PAIR-EXP' });
  applySemLineageEcho(world, recorder, child, [carrier], profile, { via: 'PAIR-EXP' });

  const nurture = applyNurtureAtBirth(world, carrier, child);
  issueHealthReport(child, world.tick, { adult: false, stage: '婴', world });
  closeUmbilicalOnExpel(carrier);
  carrier.syncyte = null;
  carrier.pregnant = false;
  carrier.pregnantAtTick = null;
  const cooldown = profile.postpartumCooldownTicks ?? 96;
  carrier.postpartumUntilTick = world.tick + cooldown;
  carrier.partnerChannelFusedAtTick = null;
  carrier.fertilizationEligibleAtTick = null;
  if (parentA) parentA.partnerChannelFusedAtTick = null;
  carrier.expelCount = (carrier.expelCount ?? 0) + 1;
  carrier.devStage = LIFE_STAGE_ADT;
  restoreAdultReproPackages(carrier, world, profile);

  recorder.evolution(world.tick, carrier.id, `[EXP] → ${child.id} gen ${child.generation}`, {
    kind: 'EXP',
    childId: child.id,
    generation: child.generation,
    nurture: nurture.mode,
  });
  noteSemDomainFromKind(carrier, 'EXP', world.tick);
  return { child, nurture };
}

/** 宫内通量 + 到期外排 */
export function processPairGestation(world, recorder) {
  if (!pairFusInBodyEnabled(world.envProfile)) return [];
  const events = [];
  for (const being of world.beings) {
    if (!being.alive || !being.syncyte) continue;
    tickEmbFlux(world, recorder, being, being.syncyte);
    tickEmbryoDevelopment(world, recorder, being, being.syncyte, world.envProfile ?? {});
    if (world.tick >= being.syncyte.gestationUntilTick) {
      const exp = expelSyncyte(world, recorder, being);
      if (exp) events.push({ type: 'EXP', carrierId: being.id, childId: exp.child.id });
    }
  }
  return events;
}

/** 无握手：形态 A 半态 + 形态 B 驻留半态 → B 体内合胞（PAIR-0 体内直连） */
export function processPairFusInBody(world, recorder) {
  const profile = world.envProfile;
  if (!pairFusInBodyEnabled(profile) || pairHalfReleaseEnabled(profile)) return [];

  const morphA = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'A' && b.meiPacket && !b.syncyte
  );
  const morphB = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'B' && b.dockedHalf && !b.syncyte
  );
  if (!morphA.length || !morphB.length) return [];

  const events = [];
  const usedB = new Set();

  for (const a of morphA) {
    const candidates = morphB.filter((b) => !usedB.has(b.id) && pairGateOpen(b, world));
    if (!candidates.length) continue;
    const b = candidates[0];
    const structFit = assessPairStructureFit(a, b, profile, a.meiPacket);
    if (
      a.bodyStructures?.['STR-PAIR-OUT']?.open &&
      b.bodyStructures?.['STR-PAIR-IN']?.open
    ) {
      recordPairStructureEvent(world, recorder, a, b, structFit, 'FUS-IN');
      if (!structFit.fit) continue;
    }
    createSyncyteOnB(world, recorder, a, b, a.meiPacket.seq, b.dockedHalf.seq);
    usedB.add(b.id);
    events.push({ type: 'FUS-IN', aId: a.id, bId: b.id });
  }
  return events;
}

/** 伴侣体内通道结合（不立即受孕） */
export function processPartnerChannelFus(world, recorder) {
  const profile = world.envProfile ?? {};
  if (!pairPartnerChannelFus(profile)) return [];
  const events = [];
  const males = world.beings.filter(
    (b) => b.alive && b.pairMorph === 'A' && b.meiPacket && b.partnerId
  );
  for (const a of males) {
    const b = world.beings.find((x) => x.id === a.partnerId);
    if (!b?.alive || b.pairMorph !== 'B' || isPregnant(b) || !b.dockedHalf) continue;
    if (a.partnerChannelFusedAtTick != null || b.partnerChannelFusedAtTick != null) continue;
    if (b.postpartumUntilTick != null && world.tick < b.postpartumUntilTick) continue;
    if (world.tick < (b.partnerFusEligibleAtTick ?? 0)) continue;
    if (world.tick < (a.partnerFusEligibleAtTick ?? 0)) continue;
    if (a.pairGrantFrom !== b.id) a.pairGrantFrom = b.id;
    alignPartnerMatingChannels(a, b);
    const structFit = assessPairStructureFit(a, b, profile, a.meiPacket);
    if (
      a.bodyStructures?.[STR_PAIR_OUT]?.open &&
      b.bodyStructures?.[STR_PAIR_IN]?.open
    ) {
      alignPartnerMatingChannels(a, b);
      const refit = assessPairStructureFit(a, b, profile, a.meiPacket);
      recordPairStructureEvent(world, recorder, a, b, refit, 'PARTNER-CH');
      if (!refit.fit) continue;
    }
    const tick = world.tick;
    a.partnerChannelFusedAtTick = tick;
    b.partnerChannelFusedAtTick = tick;
    const fertDelay = profile.fertilizationDelayTicks ?? 40;
    b.fertilizationEligibleAtTick = tick + fertDelay;
    recorder.evolution(tick, a.id, `[PARTNER-CH] channel ${b.id} fert+${fertDelay}`, {
      kind: 'PARTNER-CH',
      aId: a.id,
      bId: b.id,
      fertilizationEligibleAtTick: b.fertilizationEligibleAtTick,
    });
    noteSemDomainFromKind(a, 'PARTNER-CH', tick);
    noteSemDomainFromKind(b, 'PARTNER-CH', tick);
    events.push({ type: 'PARTNER-CH', aId: a.id, bId: b.id });
  }
  return events;
}

/** 通道结合后延迟受孕（单胎） */
export function processPartnerFertilization(world, recorder) {
  const profile = world.envProfile ?? {};
  if (!pairPartnerChannelFus(profile)) return [];
  const events = [];
  const females = world.beings.filter(
    (b) =>
      b.alive &&
      b.pairMorph === 'B' &&
      b.partnerChannelFusedAtTick != null &&
      b.fertilizationEligibleAtTick != null &&
      world.tick >= b.fertilizationEligibleAtTick
  );
  for (const b of females) {
    if (isPregnant(b)) continue;
    if (b.postpartumUntilTick != null && world.tick < b.postpartumUntilTick) continue;
    const a = world.beings.find((x) => x.id === b.partnerId);
    if (!a?.alive || a.pairMorph !== 'A' || !a.meiPacket || !b.dockedHalf) continue;
    if (a.partnerChannelFusedAtTick == null) continue;
    alignPartnerMatingChannels(a, b);
    const structFit = assessPairStructureFit(a, b, profile, a.meiPacket);
    if (
      a.bodyStructures?.[STR_PAIR_OUT]?.open &&
      b.bodyStructures?.[STR_PAIR_IN]?.open
    ) {
      const refit = assessPairStructureFit(a, b, profile, a.meiPacket);
      recordPairStructureEvent(world, recorder, a, b, refit, 'PARTNER-FUS');
      if (!refit.fit) continue;
    }
    const syncyte = createSyncyteOnB(world, recorder, a, b, a.meiPacket.seq, b.dockedHalf.seq);
    if (!syncyte) continue;
    events.push({ type: 'PARTNER-FUS', aId: a.id, bId: b.id });
  }
  return events;
}

/** tick 末尾：衰减 → 握手 → 伴侣通道 → 排入场 → 宫内发育 → 合胞 */
export function processPairReproduction(world, recorder) {
  if (!pairReproEnabled(world.envProfile)) {
    return { gestation: [], fusIn: [], fieldRelease: [], fieldFus: [], handshake: [], partnerFus: [], partnerFert: [] };
  }
  decayFieldHalves(world);
  const handshake = processPairHandshake(world, recorder);
  const partnerFus = processPartnerChannelFus(world, recorder);
  const partnerFert = processPartnerFertilization(world, recorder);
  const fieldRelease = releaseFieldHalves(world, recorder);
  const gestation = processPairGestation(world, recorder);
  const fieldFus = processPairFusFromField(world, recorder);
  const fusIn = processPairFusInBody(world, recorder);
  return { gestation, fusIn, fieldRelease, fieldFus, handshake, partnerFus, partnerFert };
}
