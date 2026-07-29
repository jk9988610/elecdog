// W5c 信号载荷共现记录 [SEM] — 统计事实，非语言/对话语义

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
}

export function initSemWorld(world) {
  if (!world.semPairCounts) {
    world.semPairCounts = new Map();
  }
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

function shouldLogPair(count, minCount) {
  return count === minCount || (count > minCount && count % 8 === 0);
}

function logSemPair(world, recorder, being, rxKey, txKey, count, profile, fieldStat) {
  being.semLogCount = (being.semLogCount ?? 0) + 1;
  const payload = {
    kind: 'SEM',
    rxKey,
    txKey,
    count,
    window: profile?.semWindow ?? 1,
  };
  const content = `[SEM] pair ${rxKey}→${txKey} count ${count}`;
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
    being.semPairTally = (being.semPairTally ?? 0) + 1;

    if (shouldLogPair(next, minCount)) {
      logSemPair(world, recorder, being, rxKey, txKey, next, profile, fieldStat);
    }
  }
}

export function semSnapshot(being) {
  return {
    logCount: being.semLogCount ?? 0,
    pairTally: being.semPairTally ?? 0,
    bufferSize: being.semRxBuffer?.length ?? 0,
  };
}
