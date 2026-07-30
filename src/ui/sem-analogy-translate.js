/**
 * 信号载荷类比翻译 — 仅从现有机制推导，非预制地球词典
 * UI 层专用；不写入世界规则 / codex-data
 */

import { payloadKey } from '../world/sem.js';
import {
  SEM_DOMAIN_CORE,
  FOUR_DOMAINS,
  activeFourDomains,
  coreRDomainActive,
  resolveSemDomain,
} from '../world/sem-domain.js';

const REPRO_KINDS = new Set([
  'MEI',
  'DCK',
  'PRQ',
  'PGR',
  'FUS',
  'FUS-IN',
  'FLD-CH',
  'FLD-CH-IN',
  'EMB',
  'EXP',
  'HRM',
]);
const COMMAND_KINDS = new Set(['PRQ', 'PGR', 'FLD-CH', 'FLD-CH-IN', 'FLD-IN', 'FLD']);

const DOMAIN_ANALOGY = {
  [SEM_DOMAIN_CORE]: '繁殖核',
  YI: '衣',
  SHI: '食',
  ZHU: '住',
  XING: '行',
};

const TIER_REPRO = 1;
const TIER_DOMAIN = 2;
const TIER_COMMAND = 3;

function tagFromContent(content) {
  const m = String(content).match(/\[([A-Z][A-Z0-9-]*)\]/);
  return m ? m[1] : null;
}

function extractTxPart(content) {
  const idx = String(content).indexOf('[TX]');
  return idx >= 0 ? String(content).slice(idx) : String(content);
}

/** 从 `[TX] 0xAE 0x64 0x09` 或 RX 行内嵌 TX 提取 6 位 hex 键 */
export function payloadHexFromSignal(content) {
  const txPart = extractTxPart(content);
  const bytes = [...txPart.matchAll(/0x([0-9a-fA-F]{2})/gi)];
  if (bytes.length >= 3) {
    return bytes
      .slice(0, 3)
      .map((m) => m[1].toLowerCase())
      .join('');
  }
  return payloadKey(txPart) ?? payloadKey(content) ?? null;
}

export function formatPayloadDisplay(hex) {
  if (!hex || hex === '—') return '—';
  if (hex.length === 6) {
    return `${hex.slice(0, 2)}·${hex.slice(2, 4)}·${hex.slice(4, 6)}`.toUpperCase();
  }
  return hex.toUpperCase();
}

function beingTail(id) {
  return id ? id.slice(-8) : '—';
}

function rxFromId(content, meta) {
  if (meta?.fromId) return meta.fromId;
  const m = String(content).match(/\[RX\]\s+([^\s]+)/);
  return m ? m[1] : null;
}

function nearbyEvolutionKinds(recorder, beingId, tick, window) {
  const kinds = new Set();
  if (!recorder?.entries) return kinds;
  for (const e of recorder.entries) {
    if (e.beingId !== beingId || e.channel !== 'evolution') continue;
    if (Math.abs(e.tick - tick) > window) continue;
    const k = e.meta?.kind ?? tagFromContent(e.content);
    if (k) kinds.add(k);
    const tags = String(e.content).matchAll(/\[([A-Z][A-Z0-9-]*)\]/g);
    for (const m of tags) kinds.add(m[1]);
  }
  return kinds;
}

function nearbyCrossSlotRx(recorder, beingId, tick, window) {
  if (!recorder?.entries) return false;
  for (const e of recorder.entries) {
    if (e.beingId !== beingId || e.channel !== 'social') continue;
    if (Math.abs(e.tick - tick) > window) continue;
    if (e.meta?.kind === 'RX' && e.meta?.recvSlot !== e.meta?.emitSlot) return true;
    if (String(e.content).includes('RX') && e.meta?.recvSlot && e.meta?.emitSlot) {
      if (e.meta.recvSlot !== e.meta.emitSlot) return true;
    }
  }
  return false;
}

function findSemPairMatch(being, hex, direction) {
  if (!being?.semLocalPairs?.size || !hex) return null;
  let best = null;
  for (const [pk, count] of being.semLocalPairs.entries()) {
    const [rx, tx] = pk.split('→');
    const hit = direction === 'TX' ? tx === hex : rx === hex;
    if (!hit) continue;
    const domain = being.semPairDomains?.get(pk) ?? null;
    if (!best || count > best.count) {
      best = { rx, tx, count, domain, pairKey: pk };
    }
  }
  return best;
}

function findSemLogDomain(recorder, beingId, tick, window) {
  if (!recorder?.entries) return null;
  for (const e of recorder.entries) {
    if (e.beingId !== beingId || e.channel !== 'evolution') continue;
    if (e.meta?.kind !== 'SEM') continue;
    if (Math.abs(e.tick - tick) > window) continue;
    if (e.meta?.domain) return e.meta.domain;
  }
  return null;
}

function formatDomainContext(domains, nativeMode) {
  if (!domains.length) return null;
  if (nativeMode) return `ctx ${domains.join('/')}`;
  const names = domains.map((d) => DOMAIN_ANALOGY[d] ?? d);
  return `语境 ${names.join('·')}（窗口内活跃，非载荷词义）`;
}

/**
 * @param {{ direction: 'TX'|'RX', content: string, tick: number, beingId?: string, meta?: object }} signal
 * @param {{ being?: object, world?: object, recorder?: object, profile?: object, nativeMode?: boolean }} ctx
 */
export function translateSignal(signal, ctx = {}) {
  const { being, world, recorder, profile, nativeMode = false } = ctx;
  const direction = signal.direction;
  const content = signal.content ?? '';
  const tick = signal.tick ?? world?.tick ?? 0;
  const window = profile?.semReproWindow ?? profile?.semDomainWindow ?? 24;

  const hex = payloadHexFromSignal(content);
  const payloadDisp = formatPayloadDisplay(hex);
  const basis = [];
  const contextParts = [];
  let tier = 0;

  const evoKinds = nearbyEvolutionKinds(recorder, signal.beingId ?? being?.id, tick, window);
  const reproHits = [...evoKinds].filter((k) => REPRO_KINDS.has(k));
  const cmdHits = [...evoKinds].filter((k) => COMMAND_KINDS.has(k));

  const coreActive = being && world && profile ? coreRDomainActive(being, world, profile) : false;
  const fourActive =
    being && world && profile ? activeFourDomains(being, world, profile) : [];
  const resolvedDomain =
    being && world && profile ? resolveSemDomain(being, world, profile) : null;
  const semLogDomain = findSemLogDomain(
    recorder,
    signal.beingId ?? being?.id,
    tick,
    window
  );

  const pairMatch = being ? findSemPairMatch(being, hex, direction) : null;
  if (pairMatch) {
    basis.push(
      `SEM共现 ${pairMatch.pairKey} ×${pairMatch.count}${pairMatch.domain ? ` · ${pairMatch.domain}` : ''}`
    );
  }

  const crossSlot = nearbyCrossSlotRx(recorder, signal.beingId ?? being?.id, tick, window);

  const reproEvo = reproHits.filter((k) =>
    ['MEI', 'DCK', 'PRQ', 'PGR', 'FUS', 'FUS-IN', 'EMB', 'EXP'].includes(k)
  );

  const activeDomains =
    fourActive.length > 0
      ? fourActive
      : resolvedDomain && FOUR_DOMAINS.includes(resolvedDomain)
        ? [resolvedDomain]
        : [];

  // Tier classification
  if (coreActive || reproEvo.length > 0) {
    tier = TIER_REPRO;
    const parts = reproEvo.length ? reproEvo.join('/') : 'CORE-R窗';
    contextParts.push(
      nativeMode ? `CORE-R ${parts}` : `繁殖邻域 ${parts}`
    );
    if (coreActive) basis.push('sem-domain:CORE-R-active');
    if (reproEvo.length) basis.push(`evolution:${reproEvo.join(',')}`);
  } else if (pairMatch?.domain === SEM_DOMAIN_CORE) {
    tier = TIER_REPRO;
    contextParts.push(
      nativeMode ? `SEM-CORE ${pairMatch.pairKey}` : `繁殖约定迹 ${pairMatch.pairKey}`
    );
  } else if (activeDomains.length > 0) {
    tier = TIER_DOMAIN;
    const domainCtx = formatDomainContext(activeDomains, nativeMode);
    if (domainCtx) contextParts.push(domainCtx);
    basis.push(`sem-domain:${activeDomains.join(',')}`);
    if (semLogDomain && FOUR_DOMAINS.includes(semLogDomain)) {
      basis.push(`SEM-log:${semLogDomain}`);
    }
  } else if (pairMatch?.domain && FOUR_DOMAINS.includes(pairMatch.domain)) {
    tier = TIER_DOMAIN;
    const d = pairMatch.domain;
    contextParts.push(
      nativeMode
        ? `${d} SEM ${pairMatch.pairKey}`
        : `${DOMAIN_ANALOGY[d]}域约定迹 ${pairMatch.pairKey}`
    );
  }

  if (cmdHits.length > 0 || crossSlot) {
    if (tier === 0) tier = TIER_COMMAND;
    const cmdParts = [];
    if (cmdHits.length) cmdParts.push(cmdHits.join('/'));
    if (crossSlot) cmdParts.push(nativeMode ? '跨位RX' : '跨社会位');
    contextParts.push(
      nativeMode ? `CMD ${cmdParts.join(' ')}` : `许可/场交换 ${cmdParts.join(' · ')}`
    );
    if (cmdHits.length) basis.push(`evolution:${cmdHits.join(',')}`);
    if (crossSlot) basis.push('social:cross-slot-RX');
  }

  if (pairMatch && direction === 'TX') {
    contextParts.push(
      nativeMode
        ? `pair ${pairMatch.pairKey}`
        : `共现回应 ${pairMatch.pairKey}`
    );
  }

  const fromId = direction === 'RX' ? rxFromId(content, signal.meta) : null;

  let analogyLabel;
  if (direction === 'RX') {
    analogyLabel = nativeMode
      ? `RX ${payloadDisp} <- ${beingTail(fromId)}`
      : `收信 ${payloadDisp} ← ${beingTail(fromId)}`;
  } else {
    analogyLabel = nativeMode ? `TX ${payloadDisp}` : `发信 ${payloadDisp}`;
  }

  const contextLabel = contextParts.length ? contextParts.join(' │ ') : null;

  if (!hex) {
    return {
      unparsed: true,
      analogyLabel: nativeMode ? 'UNPARSED' : '未解析载荷',
      contextLabel,
      tier: 0,
      confidence: 'low',
      basis: ['no-hex-payload', ...basis],
      rawHex: '—',
      payloadDisplay: '—',
      direction,
      tick,
    };
  }

  const confidence =
    basis.length >= 2 ? 'high' : basis.length === 1 ? 'medium' : 'low';

  return {
    unparsed: false,
    analogyLabel,
    contextLabel,
    tier,
    confidence,
    basis,
    rawHex: hex,
    payloadDisplay: payloadDisp,
    direction,
    tick,
  };
}

export function pickSignalStreamEntries(recorder, { beingId = null, limit = 40 } = {}) {
  const entries = (recorder?.entries ?? []).filter((e) => {
    if (beingId && e.beingId !== beingId) return false;
    if (e.channel === 'external' && e.content?.startsWith('[TX]')) return true;
    if (e.channel === 'signal' && e.content?.startsWith('[RX]')) return true;
    return false;
  });
  return entries.slice(-limit);
}

export function buildSignalTranslations(recorder, world, { beingId = null, limit = 40, nativeMode = false } = {}) {
  const profile = world?.envProfile ?? {};
  const beings = world?.beings ?? [];
  const entries = pickSignalStreamEntries(recorder, { beingId, limit });

  return entries.map((e) => {
    const direction = e.channel === 'external' ? 'TX' : 'RX';
    const being = beings.find((b) => b.id === e.beingId);
    const translation = translateSignal(
      {
        direction,
        content: e.content,
        tick: e.tick,
        beingId: e.beingId,
        meta: e.meta,
      },
      { being, world, recorder, profile, nativeMode }
    );
    return {
      entry: e,
      direction,
      translation,
    };
  });
}
