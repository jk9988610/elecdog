/**
 * 信号语义摘要 — 代观察者聚合 TX/RX，输出中文叙事（观察者释义表驱动）
 * 不写入世界规则；不对 hex 做一对一地球语词典。
 */

import {
  payloadHexFromSignal,
  formatPayloadDisplay,
  translateSignal,
  pickSignalStreamEntries,
} from './sem-analogy-translate.js';
import {
  DOMAIN_CN,
  domainListCn,
  reproKindsCn,
  pairConventionCn,
  tierCn,
} from './observer-lexicon.js';

const REPRO_TAG_RE = /\[(MEI|DCK|PRQ|PGR|FUS-IN|FLD-CH|FLD-CH-IN|EMB|EXP|HRM|FUS)\]/g;

function beingTail(id) {
  return id ? id.slice(-8) : '—';
}

function rxFromId(content, meta) {
  if (meta?.fromId) return meta.fromId;
  const m = String(content).match(/\[RX\]\s+([^\s]+)/);
  return m ? m[1] : null;
}

function collectReproKinds(recorder, tickMin, tickMax) {
  const kinds = new Set();
  for (const e of recorder?.entries ?? []) {
    if (e.channel !== 'evolution') continue;
    if (e.tick < tickMin || e.tick > tickMax) continue;
    const tags = String(e.content).matchAll(REPRO_TAG_RE);
    for (const m of tags) kinds.add(m[1]);
  }
  return [...kinds];
}

function topSemPairs(world, beings, limit = 3) {
  const pairs = [];
  if (world?.semTopTxByRx?.size) {
    for (const [rx, hit] of world.semTopTxByRx.entries()) {
      if (hit?.txKey) pairs.push({ rx, tx: hit.txKey, count: hit.count ?? 0, source: 'world' });
    }
  }
  for (const b of beings ?? []) {
    if (!b.semLocalPairs?.size) continue;
    for (const [pk, count] of b.semLocalPairs.entries()) {
      const [rx, tx] = pk.split('→');
      pairs.push({
        rx,
        tx,
        count,
        domain: b.semPairDomains?.get(pk) ?? null,
        source: beingTail(b.id),
      });
    }
  }
  return pairs
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function groupRxBursts(entries) {
  const map = new Map();
  for (const e of entries) {
    if (e.channel !== 'signal') continue;
    const hex = payloadHexFromSignal(e.content);
    const from = rxFromId(e.content, e.meta);
    const key = `${e.tick}|${hex ?? ''}|${from ?? ''}`;
    const g = map.get(key) ?? {
      tick: e.tick,
      hex,
      payload: formatPayloadDisplay(hex),
      fromId: from,
      receivers: [],
    };
    g.receivers.push(e.beingId);
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.tick - b.tick || b.receivers.length - a.receivers.length);
}

function groupTxEmits(entries) {
  const map = new Map();
  for (const e of entries) {
    if (e.channel !== 'external' || !e.content?.startsWith('[TX]')) continue;
    const hex = payloadHexFromSignal(e.content);
    const key = `${e.tick}|${hex ?? ''}|${e.beingId}`;
    const g = map.get(key) ?? {
      tick: e.tick,
      hex,
      payload: formatPayloadDisplay(hex),
      beingId: e.beingId,
      content: e.content,
    };
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.tick - b.tick);
}

function dominantDomains(beings, world, profile, tick) {
  const counts = { YI: 0, SHI: 0, ZHU: 0, XING: 0, 'CORE-R': 0 };
  for (const b of beings ?? []) {
    if (!b.alive) continue;
    const t = translateSignal(
      { direction: 'TX', content: '[TX] 0x00 0x00 0x00', tick, beingId: b.id },
      { being: b, world, profile, nativeMode: false }
    );
    const basis = t.basis?.find((x) => x.startsWith('sem-domain:'));
    if (!basis) continue;
    const ds = basis.replace('sem-domain:', '').split(',');
    for (const d of ds) {
      if (counts[d] != null) counts[d] += 1;
    }
  }
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => d);
}

/**
 * @param {object} recorder
 * @param {object} world
 * @param {{ beingId?: string|null, windowTicks?: number, maxLines?: number }} opts
 */
export function buildSignalDigest(recorder, world, opts = {}) {
  const { beingId = null, windowTicks = 24, maxLines = 14 } = opts;
  const profile = world?.envProfile ?? {};
  const tick = world?.tick ?? 0;
  const tickMin = Math.max(0, tick - windowTicks);
  const beings = world?.beings ?? [];
  const alive = beings.filter((b) => b.alive);

  const allSignals = pickSignalStreamEntries(recorder, { beingId, limit: 500 });
  const windowSignals = allSignals.filter((e) => e.tick >= tickMin);

  const rxBursts = groupRxBursts(windowSignals);
  const txEmits = groupTxEmits(windowSignals);
  const reproKinds = collectReproKinds(recorder, tickMin, tick);
  const topPairs = topSemPairs(world, beingId ? alive.filter((b) => b.id === beingId) : alive, 3);
  const domActive = dominantDomains(alive, world, profile, tick);

  const lines = [];

  const scope =
    beingId
      ? `个体 ${beingTail(beingId)}`
      : `群体 ${alive.length} 只存活个体`;
  lines.push(
    `【语义摘要】tick ${tickMin}–${tick} · ${scope} · 近 ${windowTicks} 拍`
  );

  if (reproKinds.length) {
    lines.push(`▸ 繁殖阶段：${reproKindsCn(reproKinds)}（CORE-R 信息交换活跃）`);
  } else {
    lines.push('▸ 繁殖阶段：本窗口无 PRQ/MEI/FUS 等握手事件（日常信号交换期）');
  }

  if (domActive.length) {
    lines.push(`▸ 群体语境：${domainListCn(domActive)}（机制域窗口内活跃，描述背景而非载荷词义）`);
  }

  const rxShow = rxBursts.slice(-4);
  if (rxShow.length) {
    lines.push('▸ 收信聚合（同载荷合并）：');
    for (const g of rxShow) {
      const n = g.receivers.length;
      const who =
        n === 1
          ? `1只（${beingTail(g.receivers[0])}）`
          : `${n}只同时`;
      lines.push(
        `  t${g.tick} ${who} 收到 ${beingTail(g.fromId)} 的信号 ${g.payload}`
      );
    }
  } else {
    lines.push('▸ 收信：本窗口无 RX');
  }

  const txShow = txEmits.slice(-4);
  if (txShow.length) {
    lines.push('▸ 发信：');
    for (const g of txShow) {
      const b = beings.find((x) => x.id === g.beingId);
      const tr = translateSignal(
        {
          direction: 'TX',
          content: g.content,
          tick: g.tick,
          beingId: g.beingId,
        },
        { being: b, world, recorder, profile, nativeMode: false }
      );
      const tier = tierCn(tr.tier);
      let extra = tr.contextLabel ? ` · ${tr.contextLabel}` : '';
      if (tr.basis?.some((x) => x.startsWith('SEM共现'))) {
        const sem = tr.basis.find((x) => x.startsWith('SEM共现'));
        extra += ` · ${sem}`;
      }
      lines.push(`  t${g.tick} ${beingTail(g.beingId)} 发出 ${g.payload}〔${tier}〕${extra}`);
    }
  } else {
    lines.push('▸ 发信：本窗口无 TX');
  }

  if (topPairs.length) {
    lines.push('▸ 统计约定（田野层「字典」— 收发型而非单词）：');
    for (const p of topPairs) {
      const rxDisp = formatPayloadDisplay(p.rx);
      const txDisp = formatPayloadDisplay(p.tx);
      const src = p.source === 'world' ? '全局' : `…${p.source}`;
      lines.push(`  ${pairConventionCn(rxDisp, txDisp, p.count, p.domain)} · ${src}`);
    }
  }

  lines.push(
    '— 观察者释义：载荷三字节本身无地球语词条；以上由机制域、繁殖阶段、共现统计合成可读叙事。'
  );

  return {
    tick,
    tickMin,
    windowTicks,
    beingId,
    lines: lines.slice(0, maxLines + 6),
    stats: {
      rxGroups: rxBursts.length,
      txCount: txEmits.length,
      reproKinds,
      domActive,
      topPairs,
    },
  };
}

export function formatDigestPlainText(digest) {
  return (digest?.lines ?? []).join('\n');
}
