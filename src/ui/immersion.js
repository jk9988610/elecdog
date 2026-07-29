/** 意识沉浸一屏 — 意识摘要 + 内在流近窗 + 辞典要点（T7） */

import { CODEX_ENTRIES, CODEX_META } from './codex-data.js';
import { pickMindStreamEntries, mindStreamRhythm } from './mind-stream.js';

const STREAM_INLINE_LIMIT = 10;

/** 沉浸视图优先展示的辞典条目（意识完整栈相关） */
export const IMMERSION_CODEX_IDS = [
  'consciousness-pulse',
  'internal-rhythm',
  'ehu-self-continuity',
  'ehu-lineage-echo',
  'ehu-renewal-trace',
  'consciousness-full-stack',
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function beingTail(id) {
  return id ? id.slice(-8) : '—';
}

function truncate(s, max = 72) {
  const t = String(s ?? '');
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function pickCodexDigest() {
  const map = new Map(CODEX_ENTRIES.map((e) => [e.id, e]));
  return IMMERSION_CODEX_IDS.map((id) => map.get(id)).filter(Boolean);
}

function renderStreamInline(recorder) {
  if (!recorder?.entries?.length) {
    return '<p class="immersion-empty muted">等待内在流…</p>';
  }
  const entries = pickMindStreamEntries(recorder, { limit: STREAM_INLINE_LIMIT });
  const rhythm = mindStreamRhythm(entries);
  const rhythmLine =
    rhythm.perTick != null
      ? `近 ${rhythm.ticks} tick · ${rhythm.lines} 条 · ${rhythm.perTick} 条/tick`
      : '对内节律 —';

  if (!entries.length) {
    return `<p class="immersion-rhythm">${escapeHtml(rhythmLine)}</p><p class="immersion-empty muted">暂无记录</p>`;
  }

  const lines = entries
    .map(
      (e) =>
        `<li class="immersion-stream-line"><span class="immersion-tick">t${e.tick}</span><code>${escapeHtml(truncate(e.content, 56))}</code></li>`
    )
    .join('');

  return `
    <p class="immersion-rhythm">${escapeHtml(rhythmLine)}</p>
    <ul class="immersion-stream-list">${lines}</ul>
  `;
}

function renderCodexDigest() {
  const entries = pickCodexDigest();
  return entries
    .map(
      (e) => `
      <li class="immersion-codex-item">
        <span class="immersion-codex-title">${escapeHtml(e.title)}</span>
        <p class="immersion-codex-def">${escapeHtml(truncate(e.definition, 80))}</p>
      </li>`
    )
    .join('');
}

function renderConsciousnessCompact(c, { label }) {
  if (!c?.active) {
    return `
      <p class="immersion-empty muted">当前环境未启用电子人层。请切换至「意识完整栈」。</p>
    `;
  }

  const stageMini = ['H0', 'H1', 'H2', 'H3']
    .map((s) => `<span class="immersion-stage">${s}<strong>${c.stages[s] ?? 0}</strong></span>`)
    .join('');

  const badges = [
    c.narrativeReady ? '<span class="consciousness-badge active">叙事</span>' : '',
    c.crossValidateReady ? '<span class="consciousness-badge active">多体</span>' : '',
  ]
    .filter(Boolean)
    .join('');

  return `
    <div class="immersion-badges">${badges}</div>
    <div class="immersion-stages">${stageMini}</div>
    <div class="immersion-stats">
      <div class="stat-row"><span>H3</span><strong>${(c.h3Share * 100).toFixed(0)}%</strong></div>
      <div class="stat-row"><span>${label('ehu')}</span><strong>${c.ehuEvents}</strong></div>
      <div class="stat-row"><span>${label('ehuLin')}</span><strong>${c.ehuLin}</strong></div>
      <div class="stat-row"><span>${label('ehuRen')}</span><strong>${c.ehuRen}</strong></div>
      <div class="stat-row"><span>${label('psn')}</span><strong>${c.meanPersona}/体</strong></div>
      ${c.multiBody ? `<div class="stat-row"><span>跨位RX</span><strong>${c.crossRxSum}</strong></div>` : ''}
    </div>
  `;
}

export function renderImmersionPanel(consciousness, recorder, { label }) {
  const ehuCount = CODEX_ENTRIES.filter((e) => e.tag === 'EHU').length;
  const closureTag = consciousness?.wisdomEvolution
    ? '<span class="consciousness-badge active">智慧演化</span>'
    : consciousness?.lineClosed
      ? '<span class="consciousness-badge active">意识线结案</span>'
      : '';

  return `
    <section class="panel immersion-panel" id="immersion-panel" aria-label="意识沉浸">
      <div class="immersion-head">
        <div>
          <h2>意识沉浸</h2>
          <p class="panel-hint">意识 · 内在流 · 辞典同屏 — 工具栏可展开完整辞典 / 内在流</p>
        </div>
        <div class="immersion-head-badges">${closureTag}</div>
        <span class="immersion-meta">${CODEX_META.count} 条辞典 · EHU ${ehuCount} 条</span>
      </div>
      <div class="immersion-grid">
        <div class="immersion-col immersion-col-consciousness">
          <h3 class="immersion-col-title">意识观察</h3>
          ${renderConsciousnessCompact(consciousness, { label })}
        </div>
        <div class="immersion-col immersion-col-stream">
          <h3 class="immersion-col-title">内在流近窗</h3>
          ${renderStreamInline(recorder)}
        </div>
        <div class="immersion-col immersion-col-codex">
          <h3 class="immersion-col-title">辞典要点</h3>
          <ul class="immersion-codex-list">${renderCodexDigest()}</ul>
        </div>
      </div>
    </section>
  `;
}
