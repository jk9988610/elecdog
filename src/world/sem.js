// W5c 信号载荷共现记录 [SEM] — 统计事实，非语言/对话语义

import { semLineageEnabled, refreshSemTrace, traceActHint } from './sem-lineage.js';
import { resolveSemDomain, semDomainTagEnabled, noteFourDomainCouple } from './sem-domain.js';

export function semEnabled(profile) {
  return profile?.semEnabled === true;
}

export function semFeedbackEnabled(profile) {
  return semEnabled(profile) && profile?.semFeedbackEnabled === true;
}

export function initSemState(being) {
  being.semRxBuffer = [];
  being.semLogCount = 0;
  being.semPairTally = 0;
  being.semFbHits = 0;
  being.semLocalPairs = new Map();
  being.semDomainPairTally = {};
  being.semFourDomainCoupleTally = {};
  being.semCoreRFourCouplePairs = 0;
}

export function initSemWorld(world) {
  if (!world.semPairCounts) {
    world.semPairCounts = new Map();
  }
  if (!world.semTopTxByRx) {
    world.semTopTxByRx = new Map();
  }
}

function updateTopTxForRx(world, rxKey, txKey, count) {
  const prev = world.semTopTxByRx.get(rxKey);
  if (!prev || count >= prev.count) {
    world.semTopTxByRx.set(rxKey, { txKey, count });
  }
}

function topTxForRx(world, rxKey) {
  const hit = world.semTopTxByRx?.get(rxKey);
  return hit ? { txKey: hit.txKey, count: hit.count } : { txKey: null, count: 0 };
}

/** 从 `[TX] abc` 或信号载荷提取规范化 hex 键（非地球词） */
export function payloadKey(content) {
  if (!content) return null;
  const line = String(content).trim();
  const m = line.match(/\[TX\]\s*([0-9a-fA-F]{3,})/i);
  if (m) return m[1].slice(0, 6).toLowerCase();
  const hex = line.replace(/[^0-9a-fA-F]/g, '');
  return hex.length >= 3 ? hex.slice(0, 6).toLowerCase() : null;
}

function pairKey(rxKey, txKey) {
  return `${rxKey}→${txKey}`;
}

function pruneBuffer(buffer, tick, window) {
  return buffer.filter((e) => tick - e.tick <= window);
}

/** RX 到达时缓存载荷，供次 tick TX 配对 */
export function recordSemRx(being, heard, receiveTick) {
  if (!being.alive || !heard?.length) return;
  for (const sig of heard) {
    const key = payloadKey(sig.content);
    if (key) {
      being.semRxBuffer.push({ key, tick: receiveTick });
    }
  }
}

function shouldLogPair(count, minCount, fieldStat = false, domainTag = false) {
  if (count < minCount) return false;
  if (count === minCount) return true;
  if (fieldStat) {
    if (domainTag) return count % 8 === 0;
    return count % 48 === 0;
  }
  return count % 8 === 0;
}

function logSemPair(world, recorder, being, rxKey, txKey, count, profile, fieldStat) {
  being.semLogCount = (being.semLogCount ?? 0) + 1;
  const domain = resolveSemDomain(being, world, profile);
  const fourActive = noteFourDomainCouple(being, world, profile);
  const payload = {
    kind: 'SEM',
    rxKey,
    txKey,
    count,
    window: profile?.semWindow ?? 1,
    ...(domain ? { domain } : {}),
    ...(fourActive?.length ? { fourDomain: fourActive } : {}),
  };
  const domainTag = domain ? ` domain ${domain}` : '';
  const content = `[SEM] pair ${rxKey}→${txKey}${domainTag} count ${count}`;
  if (fieldStat) {
    recorder.evolution(world.tick, being.id, content, payload);
  } else {
    recorder.evolution(world.tick, being.id, content, payload);
  }
}

/** 本 tick 发出 TX 时，与缓冲区内 RX 载荷形成共现对 */
export function recordSemTx(world, recorder, being, profile, txLine, { fieldStat = false } = {}) {
  if (!semEnabled(profile)) return;
  initSemWorld(world);

  const txKey = payloadKey(txLine);
  if (!txKey) return;

  const window = profile?.semWindow ?? 1;
  const minCount = profile?.semMinCount ?? 3;
  const tick = world.tick;
  being.semRxBuffer = pruneBuffer(being.semRxBuffer ?? [], tick, window);

  for (const { key: rxKey, tick: rxTick } of being.semRxBuffer) {
    const gap = tick - rxTick;
    if (gap < 1 || gap > window) continue;

    const pk = pairKey(rxKey, txKey);
    const prev = world.semPairCounts.get(pk) ?? 0;
    const next = prev + 1;
    world.semPairCounts.set(pk, next);
    updateTopTxForRx(world, rxKey, txKey, next);
    if (!being.semLocalPairs) being.semLocalPairs = new Map();
    being.semLocalPairs.set(pk, (being.semLocalPairs.get(pk) ?? 0) + 1);
    being.semPairTally = (being.semPairTally ?? 0) + 1;

    if (semDomainTagEnabled(profile)) {
      const domain = resolveSemDomain(being, world, profile);
      if (domain) {
        if (!being.semDomainPairTally) being.semDomainPairTally = {};
        being.semDomainPairTally[domain] = (being.semDomainPairTally[domain] ?? 0) + 1;
        if (!being.semPairDomains) being.semPairDomains = new Map();
        being.semPairDomains.set(pk, domain);
      }
    }

    noteFourDomainCouple(being, world, profile);

    if (shouldLogPair(next, minCount, fieldStat, semDomainTagEnabled(profile))) {
      logSemPair(world, recorder, being, rxKey, txKey, next, profile, fieldStat);
    }
  }

  if (semLineageEnabled(profile) && world.tick % 48 === 0) {
    refreshSemTrace(being, world, profile);
  }
}

export function semSnapshot(being) {
  return {
    logCount: being.semLogCount ?? 0,
    pairTally: being.semPairTally ?? 0,
    bufferSize: being.semRxBuffer?.length ?? 0,
    fbHits: being.semFbHits ?? 0,
  };
}

/** 高共现对 → 微弱 TX 偏置（WL1；非词典查询） */
export function semActBias(being, world, profile) {
  if (!semFeedbackEnabled(profile)) {
    return { actBoost: 0, thresholdDelta: 0, txBoost: 0, semLoad: 0 };
  }
  initSemWorld(world);

  const minPairs = profile?.semFeedbackMinPairs ?? 2;
  const strength = profile?.semFeedbackStrength ?? 0.05;
  const saturation = profile?.semFeedbackSaturation ?? 32;
  const tick = world.tick;
  const window = profile?.semWindow ?? 1;
  const buffer = pruneBuffer(being.semRxBuffer ?? [], tick, window);

  let pairStrength = 0;
  let txPayloadHint = null;
  for (const { key: rxKey, tick: rxTick } of buffer) {
    if (tick - rxTick < 1) continue;
    const { txKey, count } = topTxForRx(world, rxKey);
    if (!txKey || count < minPairs) continue;
    const w = Math.min(1, count / saturation);
    if (w > pairStrength) {
      pairStrength = w;
      txPayloadHint = txKey;
    }
  }

  if (semLineageEnabled(profile)) {
    const hint = traceActHint(being, profile, { tick, window });
    if (hint.txKey && hint.strength > pairStrength) {
      pairStrength = hint.strength;
      txPayloadHint = hint.txKey;
    }
  }

  if (pairStrength <= 0) {
    return { actBoost: 0, thresholdDelta: 0, txBoost: 0, semLoad: 0 };
  }

  const load = +pairStrength.toFixed(4);
  return {
    actBoost: -(load * strength),
    thresholdDelta: -(load * strength * 0.25),
    txBoost: +(load * strength),
    txPayloadHint,
    semLoad: load,
  };
}

/** 将 hint 字节混入 TX 载荷（微弱，非硬编码回复） */
export function applySemPayloadHint(op, payload, chk, hint, semLoad, rng) {
  if (!hint || semLoad <= 0 || rng() >= semLoad * 0.55) {
    return { op, payload, chk, applied: false };
  }
  const bytes = hint.match(/.{2}/g) ?? [];
  if (bytes.length < 2) return { op, payload, chk, applied: false };
  return {
    op: bytes[0] ?? op,
    payload: bytes[1] ?? payload,
    chk: bytes[2] ?? (rng() < 0.5 ? chk : bytes[1] ?? chk),
    applied: true,
  };
}
