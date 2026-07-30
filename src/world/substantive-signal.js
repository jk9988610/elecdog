// 实质性定向言语 — 思考后开口；禁止无意义对外广播（观察者繁殖栈）

import { hashString, mulberry32 } from '../core/hash.js';
import {
  deriveInternalTxCoupling,
  applyInternalTxCoupling,
} from './internal-tx-coupling.js';
import { pairReproEnabled } from './pair-repro.js';
import {
  SEM_DOMAIN_YI,
  SEM_DOMAIN_SHI,
  SEM_DOMAIN_ZHU,
  SEM_DOMAIN_XING,
  resolveSemDomain,
} from './sem-domain.js';
import { slotIndex, SLOT_COUNT } from './social.js';
import { preferAct, externalThreshold } from './viability.js';

const DOMAIN_TO_QUERY = {
  [SEM_DOMAIN_YI]: 'Q-YI',
  [SEM_DOMAIN_SHI]: 'Q-SHI',
  [SEM_DOMAIN_ZHU]: 'Q-ZHU',
  [SEM_DOMAIN_XING]: 'Q-XING',
};

export function substantiveSignalOnly(profile) {
  return profile?.substantiveSignalOnly === true;
}

export function directedTxOnly(profile) {
  return profile?.directedTxOnly === true || substantiveSignalOnly(profile);
}

export function pairSpeechDriven(profile) {
  return profile?.pairSpeechDriven === true;
}

export function multicellIntraTxEnabled(profile) {
  return profile?.multicellIntraTx === true || substantiveSignalOnly(profile);
}

export function assignPairMorph(id) {
  return mulberry32(hashString(`${id}:pairMorph`))() < 0.5 ? 'A' : 'B';
}

export function initSubstantiveSignal(being) {
  being.speechTxCount = 0;
  being.speechQueryCount = 0;
  being.speechReproCount = 0;
  being.lastSpeechIntent = null;
  being.lastSpeechTarget = null;
}

function toHexByte(n) {
  return Math.floor(Math.max(0, Math.min(255, n)))
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

function slotDistance(a, b) {
  const ia = slotIndex(a?.socialSlot ?? 'S0');
  const ib = slotIndex(b?.socialSlot ?? 'S0');
  const d = Math.abs(ia - ib);
  return Math.min(d, SLOT_COUNT - d);
}

/** 解析定向 TX：`[TX] @toId PRQ 0x..` 或 `[TX] @toId Q-YI REL 0x..` */
export function parseDirectedTx(line) {
  const raw = String(line);
  const m = raw.match(
    /^\[TX\]\s+@([^\s]+)\s+(PRQ|PGR|Q-YI|Q-SHI|Q-ZHU|Q-XING)(?:\s+(REL|INF))?\s+(0x[0-9A-Fa-f]{2})\s+(0x[0-9A-Fa-f]{2})\s+(0x[0-9A-Fa-f]{2})/i
  );
  if (!m) return null;
  return {
    toId: m[1],
    intent: m[2].toUpperCase(),
    queryMode: m[3]?.toUpperCase() ?? null,
    op: m[4].slice(2).toUpperCase(),
    payload: m[5].slice(2).toUpperCase(),
    chk: m[6].slice(2).toUpperCase(),
  };
}

export function formatDirectedTx(toId, intent, op, payload, chk, queryMode = null) {
  const mode = queryMode && intent.startsWith('Q-') ? ` ${queryMode}` : '';
  return `[TX] @${toId} ${intent}${mode} 0x${op} 0x${payload} 0x${chk}`;
}

/** 按定向规则过滤本 tick 可听信号 */
export function filterHeardSignals(delivered, beingId, profile) {
  return delivered.filter((s) => {
    if (s.fromId === beingId) return false;
    const directed = parseDirectedTx(s.content) ?? (s.toId ? { toId: s.toId } : null);
    if (directed?.toId) return directed.toId === beingId;
    if (directedTxOnly(profile)) return false;
    return true;
  });
}

/** 多细胞胞内不间断 TX（仅 internal，不上 signalBus） */
export function appendMulticellIntraTx(internal, being) {
  if (being.organismType !== 'multicell' || !being.subCells?.length) return internal;
  const n = being.subCells.length;
  const fromIdx = (being.intraTick ?? 0) % n;
  const toIdx = (fromIdx + 1) % n;
  const from = being.subCells[fromIdx];
  const to = being.subCells[toIdx];
  const r = being.registers[Math.floor(being.rng() * being.registers.length)];
  const line = `[INTRA-TX] ${from.id}→${to.id} 0x${toHexByte(r * 255)} 0x${toHexByte(being.rng() * 255)} 0x${toHexByte(being.rng() * 255)}`;
  return [...internal, line];
}

function pickMorphBTarget(world, a, heardSignals = []) {
  for (const sig of heardSignals) {
    const from = world.beings.find((b) => b.id === sig.fromId);
    if (from?.alive && from.pairMorph === 'B') return from;
  }
  const candidates = world.beings.filter((b) => b.alive && b.pairMorph === 'B' && b.id !== a.id);
  if (!candidates.length) return null;
  return candidates.sort((x, y) => slotDistance(x, a) - slotDistance(y, a))[0];
}

function pickMorphAGrant(world, b, heardSignals = []) {
  for (const sig of heardSignals) {
    const d = parseDirectedTx(sig.content);
    if (d?.intent === 'PRQ' && d.toId === b.id) {
      const a = world.beings.find((x) => x.id === sig.fromId);
      if (a?.alive && a.pairMorph === 'A' && a.meiPacket) return a;
    }
  }
  const reqs = world.pairRequests ?? [];
  if (!reqs.length) return null;
  const sorted = [...reqs].sort(
    (x, y) =>
      slotDistance({ socialSlot: x.socialSlot }, b) - slotDistance({ socialSlot: y.socialSlot }, b)
  );
  const req = sorted[0];
  const a = world.beings.find((x) => x.id === req.fromId);
  if (a?.alive && a.pairMorph === 'A' && a.meiPacket) return a;
  return null;
}

function pickQueryTarget(world, being, heardSignals = []) {
  if (heardSignals.length) {
    const sig = heardSignals[Math.floor(being.rng() * heardSignals.length)];
    const other = world.beings.find((b) => b.id === sig.fromId);
    if (other?.alive) return { target: other, fromHeard: true };
  }
  const candidates = world.beings.filter((b) => b.alive && b.id !== being.id);
  if (!candidates.length) return null;
  return {
    target: candidates.sort((x, y) => slotDistance(x, being) - slotDistance(y, being))[0],
    fromHeard: false,
  };
}

function resolveQueryIntent(being, world, profile) {
  const domain = resolveSemDomain(being, world, profile);
  if (domain && DOMAIN_TO_QUERY[domain]) return DOMAIN_TO_QUERY[domain];
  const idx = being.registers.reduce(
    (best, r, i) => (r > being.registers[best] ? i : best),
    0
  );
  const map = ['Q-YI', 'Q-SHI', 'Q-ZHU', 'Q-XING'];
  return map[idx % map.length];
}

function hasValidPairGrant(world, a) {
  if (!a.pairGrantFrom) return false;
  const grantor = world.beings.find((b) => b.id === a.pairGrantFrom);
  return Boolean(grantor?.alive && grantor.pairMorph === 'B');
}

function deriveReproIntent(being, world, heardSignals) {
  if (!pairReproEnabled(world.envProfile)) return null;
  if (being.pairMorph === 'A' && being.meiPacket && !hasValidPairGrant(world, being)) {
    const target = pickMorphBTarget(world, being, heardSignals);
    if (target) return { intent: 'PRQ', target };
  }
  if (being.pairMorph === 'B' && being.dockedHalf && !being.syncyte) {
    const grantA = pickMorphAGrant(world, being, heardSignals);
    if (grantA) return { intent: 'PGR', target: grantA };
  }
  return null;
}

function maybeActLine(being, stress, lowStreak, experienceBias) {
  const actBoost = experienceBias?.actBoost ?? 0;
  const thresholdDelta = experienceBias?.thresholdDelta ?? 0;
  const threshold = Math.max(0.22, Math.min(0.95, externalThreshold(stress, lowStreak) + thresholdDelta));
  if (!preferAct(stress, lowStreak) || being.rng() > threshold - 0.08) return null;
  const op = toHexByte(being.registers[Math.floor(being.rng() * being.registers.length)] * 255);
  const payload = toHexByte(being.rng() * 255);
  const chk = toHexByte(being.rng() * 255);
  return `[ACT] 0x${op} 0x${payload} 0x${chk}`;
}

/**
 * 思考后实质性开口 — 无随机对外 TX
 */
export function deriveSubstantiveExternal(
  being,
  world,
  profile,
  { stress = 0, lowStreak = 0, experienceBias = null, heardSignals = [], internal = [] } = {}
) {
  const minLoad = profile?.substanceMinSpeakLoad ?? 0.28;
  const coupling = deriveInternalTxCoupling(internal, being, profile, experienceBias);
  if (!coupling || coupling.load < minLoad) {
    const act = maybeActLine(being, stress, lowStreak, experienceBias);
    return act ? [act] : [];
  }

  const repro = deriveReproIntent(being, world, heardSignals);
  let intent;
  let target;
  let queryMode = null;

  if (repro) {
    intent = repro.intent;
    target = repro.target;
  } else {
    const picked = pickQueryTarget(world, being, heardSignals);
    if (!picked) {
      const act = maybeActLine(being, stress, lowStreak, experienceBias);
      return act ? [act] : [];
    }
    target = picked.target;
    intent = resolveQueryIntent(being, world, profile);
    const sameSlot = target.socialSlot === being.socialSlot;
    queryMode = picked.fromHeard && sameSlot ? 'REL' : 'INF';
  }

  let op = coupling.op;
  let payload = coupling.payload;
  let chk = coupling.chk;
  const applied = applyInternalTxCoupling(op, payload, chk, coupling, () => being.rng());
  if (applied.applied) {
    op = applied.op;
    payload = applied.payload;
    chk = applied.chk;
    being.internalTxHits = (being.internalTxHits ?? 0) + 1;
    being.internalTxLoad = coupling.load;
    being.lastInternalTxSource = coupling.sourceInternal;
    being.internalTxAppliedTick = true;
  }

  const line = formatDirectedTx(target.id, intent, op, payload, chk, queryMode);
  being.lastSpeechIntent = intent;
  being.lastSpeechTarget = target.id;
  being.speechTxCount = (being.speechTxCount ?? 0) + 1;
  if (intent === 'PRQ' || intent === 'PGR') {
    being.speechReproCount = (being.speechReproCount ?? 0) + 1;
  } else {
    being.speechQueryCount = (being.speechQueryCount ?? 0) + 1;
  }

  return [line];
}

export function substantiveSpeechSnapshot(being) {
  return {
    speechTx: being.speechTxCount ?? 0,
    speechQuery: being.speechQueryCount ?? 0,
    speechRepro: being.speechReproCount ?? 0,
    lastIntent: being.lastSpeechIntent ?? null,
    lastTarget: being.lastSpeechTarget ?? null,
  };
}
