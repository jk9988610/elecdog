// WL2 谱系约定持久 — 亲代 semTrace → [SEM-LIN] → 子代可核对残留

export function semLineageEnabled(profile) {
  return profile?.semEnabled === true && profile?.semLineageEnabled === true;
}

export function initSemLineage(being) {
  being.semTrace = being.semTrace ?? [];
  being.semLinCount = being.semLinCount ?? 0;
  being.semTraceVia = null;
  being.semTraceWeight = being.semTraceWeight ?? 0;
  if (!being.semLocalPairs) being.semLocalPairs = new Map();
}

function traceFromLocalPairs(being, topN, minCount = 1) {
  if (!being.semLocalPairs?.size) return [];
  return [...being.semLocalPairs.entries()]
    .filter(([, count]) => count >= minCount)
    .map(([pk, count]) => {
      const [rx, tx] = pk.split('→');
      return { rx, tx, w: +Math.min(1, count / 16).toFixed(4) };
    })
    .sort((a, b) => b.w - a.w)
    .slice(0, topN);
}

function mergeTraceEntries(traces, blend = 0.55) {
  const map = new Map();
  for (const trace of traces) {
    for (const entry of trace ?? []) {
      if (!entry?.rx || !entry?.tx) continue;
      const pk = `${entry.rx}→${entry.tx}`;
      map.set(pk, (map.get(pk) ?? 0) + (entry.w ?? 0) * blend);
    }
  }
  return [...map.entries()]
    .map(([pk, w]) => {
      const [rx, tx] = pk.split('→');
      return { rx, tx, w: +w.toFixed(4) };
    })
    .sort((a, b) => b.w - a.w);
}

/** 谱系/分裂/融合时继承亲代约定迹 */
export function applySemLineageEcho(
  world,
  recorder,
  child,
  parents,
  profile,
  { via = 'LINEAGE' } = {}
) {
  if (!semLineageEnabled(profile)) return null;
  const list = parents.filter(Boolean);
  if (!list.length) return null;

  const blend = profile?.semLineageBlend ?? 0.55;
  const topN = profile?.semTraceTopN ?? 4;
  for (const p of list) {
    refreshSemTrace(p, world, profile);
  }
  let merged = mergeTraceEntries(
    list.map((p) => p.semTrace ?? []),
    blend
  ).slice(0, topN);
  if (!merged.length) {
    merged = mergeTraceEntries(
      list.map((p) => traceFromLocalPairs(p, topN, profile?.semTraceMinCount ?? 2)),
      blend
    ).slice(0, topN);
  }

  if (!merged.length) return null;

  child.semTrace = merged;
  child.semTraceVia = via;
  child.semLinCount = (child.semLinCount ?? 0) + 1;
  child.semTraceWeight = +merged.reduce((s, e) => s + (e.w ?? 0), 0).toFixed(4);

  const payload = {
    kind: 'SEM-LIN',
    via,
    trace: merged,
    weight: child.semTraceWeight,
    parentIds: list.map((p) => p.id),
  };
  recorder.evolution(world.tick, child.id, `[SEM-LIN] ${via} n${merged.length}`, payload);
  return payload;
}

/** 将世界共现统计折叠为个体 semTrace（可继承摘要） */
export function refreshSemTrace(being, world, profile) {
  if (profile?.semEnabled !== true) return being.semTrace ?? [];
  const topN = profile?.semTraceTopN ?? 4;
  const minCount = profile?.semTraceMinCount ?? 4;
  const saturation = profile?.semFeedbackSaturation ?? 32;
  const map = new Map();

  for (const entry of being.semTrace ?? []) {
    if (!entry?.rx || !entry?.tx) continue;
    map.set(`${entry.rx}→${entry.tx}`, entry.w ?? 0);
  }
  for (const [pk, count] of being.semLocalPairs ?? []) {
    if (count < minCount) continue;
    const w = Math.min(1, count / saturation);
    map.set(pk, Math.max(map.get(pk) ?? 0, w));
  }
  for (const [rxKey, hit] of world.semTopTxByRx ?? []) {
    if (!hit?.txKey || hit.count < minCount) continue;
    const pk = `${rxKey}→${hit.txKey}`;
    const w = Math.min(1, hit.count / saturation);
    map.set(pk, Math.max(map.get(pk) ?? 0, w));
  }

  being.semTrace = [...map.entries()]
    .map(([pk, w]) => {
      const [rx, tx] = pk.split('→');
      return { rx, tx, w: +w.toFixed(4) };
    })
    .sort((a, b) => b.w - a.w)
    .slice(0, topN);
  being.semTraceWeight = +being.semTrace.reduce((s, e) => s + (e.w ?? 0), 0).toFixed(4);
  return being.semTrace;
}

export function semLineageSnapshot(being) {
  return {
    traceLen: being.semTrace?.length ?? 0,
    traceWeight: +(being.semTraceWeight ?? 0).toFixed(4),
    via: being.semTraceVia,
    linCount: being.semLinCount ?? 0,
  };
}

export function traceActHint(being, profile, { rxKeys = [], tick = 0, window = 1 } = {}) {
  if (!semLineageEnabled(profile) || !(being.semTrace?.length)) {
    return { strength: 0, txKey: null };
  }
  const recent = new Set(
    (being.semRxBuffer ?? [])
      .filter((e) => tick - e.tick >= 1 && tick - e.tick <= window)
      .map((e) => e.key)
  );
  let best = 0;
  let txKey = null;
  for (const { rx, tx, w } of being.semTrace) {
    if (recent.size && !recent.has(rx) && w < 0.25) continue;
    if (w > best) {
      best = w;
      txKey = tx;
    }
  }
  return { strength: best, txKey };
}
