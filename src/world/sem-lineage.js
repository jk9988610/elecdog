// WL2 谱系约定持久 — 亲代 semTrace → [SEM-LIN] → 子代可核对残留
// WL-R2 — 繁殖域跨代载荷迹（CORE-R 优先继承）

import { SEM_DOMAIN_CORE } from './sem-domain.js';

export function semLineageEnabled(profile) {
  return profile?.semEnabled === true && profile?.semLineageEnabled === true;
}

/** WL-R2：繁殖邻域域标记 + 谱系回响联动 */
export function semReproLineageEnabled(profile) {
  return semLineageEnabled(profile) && profile?.semReproLineage === true && profile?.semDomainTag === true;
}

export function initSemLineage(being) {
  being.semTrace = being.semTrace ?? [];
  being.semLinCount = being.semLinCount ?? 0;
  being.semTraceVia = null;
  being.semTraceWeight = being.semTraceWeight ?? 0;
  being.reproTraceWeight = being.reproTraceWeight ?? 0;
  if (!being.semLocalPairs) being.semLocalPairs = new Map();
}

function traceFromLocalPairs(being, topN, minCount = 1, { reproOnly = false } = {}) {
  if (!being.semLocalPairs?.size) return [];
  const entries = [];
  for (const [pk, count] of being.semLocalPairs.entries()) {
    if (count < minCount) continue;
    const domain = being.semPairDomains?.get(pk) ?? null;
    if (reproOnly && domain !== SEM_DOMAIN_CORE) continue;
    const [rx, tx] = pk.split('→');
    entries.push({
      rx,
      tx,
      w: +Math.min(1, count / 16).toFixed(4),
      ...(domain ? { domain } : {}),
    });
  }
  return entries.sort((a, b) => b.w - a.w).slice(0, topN);
}

function mergeTraceEntries(traces, blend = 0.55) {
  const map = new Map();
  for (const trace of traces) {
    for (const entry of trace ?? []) {
      if (!entry?.rx || !entry?.tx) continue;
      const pk = `${entry.rx}→${entry.tx}`;
      const prev = map.get(pk);
      const w = (prev?.w ?? 0) + (entry.w ?? 0) * blend;
      const domain = entry.domain ?? prev?.domain ?? null;
      map.set(pk, { rx: entry.rx, tx: entry.tx, w: +w.toFixed(4), domain });
    }
  }
  return [...map.values()].sort((a, b) => b.w - a.w);
}

export function reproTraceWeight(trace = []) {
  return +trace
    .filter((e) => e.domain === SEM_DOMAIN_CORE)
    .reduce((s, e) => s + (e.w ?? 0), 0)
    .toFixed(4);
}

const REPRO_VIAS = new Set(['PAIR-EXP', 'FISS', 'FUS', 'LINEAGE']);

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
  const reproOnly = semReproLineageEnabled(profile) && REPRO_VIAS.has(via);

  for (const p of list) {
    refreshSemTrace(p, world, profile);
  }

  let merged = mergeTraceEntries(
    list.map((p) => p.semTrace ?? []),
    blend
  ).slice(0, topN);

  if (!merged.length) {
    merged = mergeTraceEntries(
      list.map((p) => traceFromLocalPairs(p, topN, profile?.semTraceMinCount ?? 2, { reproOnly: false })),
      blend
    ).slice(0, topN);
  }
  if (!merged.length) {
    merged = mergeTraceEntries(
      list.map((p) => traceFromLocalPairs(p, topN, 1, { reproOnly: false })),
      blend
    ).slice(0, topN);
  }

  if (reproOnly) {
    const reproMerged = mergeTraceEntries(
      list.map((p) => traceFromLocalPairs(p, topN, 1, { reproOnly: true })),
      blend
    ).slice(0, topN);
    if (reproMerged.length) {
      merged = reproMerged;
    } else {
      merged = merged
        .filter((e) => e.domain === SEM_DOMAIN_CORE)
        .slice(0, topN);
      if (!merged.length) {
        merged = mergeTraceEntries(
          list.map((p) => traceFromLocalPairs(p, topN, 1, { reproOnly: false })),
          blend
        )
          .sort((a, b) => (b.domain === SEM_DOMAIN_CORE) - (a.domain === SEM_DOMAIN_CORE) || b.w - a.w)
          .slice(0, topN);
      }
    }
  }

  if (!merged.length) return null;

  child.semTrace = merged;
  child.semTraceVia = via;
  child.semLinCount = (child.semLinCount ?? 0) + 1;
  child.semTraceWeight = +merged.reduce((s, e) => s + (e.w ?? 0), 0).toFixed(4);
  child.reproTraceWeight = reproTraceWeight(merged);

  const payload = {
    kind: 'SEM-LIN',
    via,
    trace: merged,
    weight: child.semTraceWeight,
    parentIds: list.map((p) => p.id),
    ...(reproOnly ? { reproTrace: true, coreRWeight: child.reproTraceWeight } : {}),
  };
  const reproTag = reproOnly ? ` repro coreR${child.reproTraceWeight}` : '';
  recorder.evolution(world.tick, child.id, `[SEM-LIN] ${via} n${merged.length}${reproTag}`, payload);
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
    map.set(`${entry.rx}→${entry.tx}`, { ...entry });
  }
  for (const [pk, count] of being.semLocalPairs ?? []) {
    if (count < minCount) continue;
    const [rx, tx] = pk.split('→');
    const w = Math.min(1, count / saturation);
    const domain = being.semPairDomains?.get(pk) ?? map.get(pk)?.domain ?? null;
    const prev = map.get(pk);
    map.set(pk, {
      rx,
      tx,
      w: +Math.max(prev?.w ?? 0, w).toFixed(4),
      ...(domain ? { domain } : {}),
    });
  }
  for (const [rxKey, hit] of world.semTopTxByRx ?? []) {
    if (!hit?.txKey || hit.count < minCount) continue;
    const pk = `${rxKey}→${hit.txKey}`;
    const w = Math.min(1, hit.count / saturation);
    const prev = map.get(pk);
    map.set(pk, {
      rx: rxKey,
      tx: hit.txKey,
      w: +Math.max(prev?.w ?? 0, w).toFixed(4),
      domain: prev?.domain ?? being.semPairDomains?.get(pk) ?? null,
    });
  }

  being.semTrace = [...map.values()]
    .filter((e) => e.rx && e.tx)
    .sort((a, b) => b.w - a.w)
    .slice(0, topN);
  being.semTraceWeight = +being.semTrace.reduce((s, e) => s + (e.w ?? 0), 0).toFixed(4);
  being.reproTraceWeight = reproTraceWeight(being.semTrace);
  return being.semTrace;
}

export function semLineageSnapshot(being) {
  return {
    traceLen: being.semTrace?.length ?? 0,
    traceWeight: +(being.semTraceWeight ?? 0).toFixed(4),
    reproTraceWeight: +(being.reproTraceWeight ?? 0).toFixed(4),
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
  const preferRepro = semReproLineageEnabled(profile);
  for (const { rx, tx, w, domain } of being.semTrace) {
    if (preferRepro && domain && domain !== SEM_DOMAIN_CORE && w < 0.35) continue;
    if (recent.size && !recent.has(rx) && w < 0.25) continue;
    if (w > best) {
      best = w;
      txKey = tx;
    }
  }
  return { strength: best, txKey };
}
