/** 信号类比流面板 — 摘要模式（默认）+ 明细模式 */

import { buildSignalTranslations } from './sem-analogy-translate.js';
import { buildSignalDigest } from './sem-signal-digest.js';
import { isAnalogyMode, label, semSignalViewModeHint } from './analogy.js';

const STREAM_LIMIT = 40;
const DIGEST_WINDOW = 24;

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

function tierClass(tier) {
  if (tier === 1) return 'sig-tier-repro';
  if (tier === 2) return 'sig-tier-domain';
  if (tier === 3) return 'sig-tier-cmd';
  return 'sig-tier-unparsed';
}

function confLabel(conf, native) {
  if (native) return conf;
  const map = { high: '高', medium: '中', low: '低' };
  return map[conf] ?? conf;
}

export function renderSemSignalStreamPanelHTML() {
  return `
    <section id="sem-signal-panel" class="sem-signal-panel hidden" aria-label="信号类比流">
      <div class="sem-signal-head">
        <div>
          <h2 class="sem-signal-title">${escapeHtml(label('semSignalStream'))}</h2>
          <p id="sem-signal-hint" class="sem-signal-hint">${escapeHtml(semSignalViewModeHint())}</p>
        </div>
        <div class="sem-signal-head-actions">
          <span class="sem-signal-view-toggle">
            <button type="button" id="btn-sig-view-digest" class="btn-ghost sig-view-btn active">${escapeHtml(label('semSignalDigest'))}</button>
            <button type="button" id="btn-sig-view-detail" class="btn-ghost sig-view-btn">${escapeHtml(label('semSignalDetail'))}</button>
          </span>
          <label class="sem-signal-filter">
            ${escapeHtml(label('semSignalBeing'))}
            <select id="sem-signal-being"></select>
          </label>
          <button id="btn-sem-signal-close" type="button" class="btn-ghost">${escapeHtml(label('semSignalClose'))}</button>
        </div>
      </div>
      <p class="sem-signal-note">${escapeHtml(label('semSignalNote'))}</p>
      <div id="sem-signal-digest" class="sem-signal-digest"></div>
      <ul id="sem-signal-list" class="sem-signal-list hidden"></ul>
    </section>
  `;
}

function renderDigestBlock(digest) {
  if (!digest?.lines?.length) {
    return `<p class="sem-signal-empty muted">${escapeHtml(label('semSignalEmpty'))}</p>`;
  }
  return digest.lines
    .map((line) => {
      const cls = line.startsWith('【')
        ? 'digest-head'
        : line.startsWith('—')
          ? 'digest-foot'
          : line.startsWith('▸')
            ? 'digest-section'
            : 'digest-line';
      return `<p class="digest-row ${cls}">${escapeHtml(line)}</p>`;
    })
    .join('');
}

function renderSignalLine(row) {
  const { entry, direction, translation: t } = row;
  const ch = direction === 'TX' ? 'sig-dir-tx' : 'sig-dir-rx';
  const tierCls = tierClass(t.tier);
  const unparsedCls = t.unparsed ? 'sig-unparsed' : '';
  const basis = (t.basis ?? []).map((b) => `<span class="sig-basis-tag">${escapeHtml(b)}</span>`).join('');
  const raw = entry.content;

  return `<li class="sem-signal-item ${ch} ${tierCls} ${unparsedCls}">
    <span class="sig-tick">t${entry.tick}</span>
    <span class="sig-who">${escapeHtml(beingTail(entry.beingId))}</span>
    <span class="sig-dir">${escapeHtml(direction)}</span>
    <span class="sig-analogy">${escapeHtml(t.analogyLabel)}</span>
    ${t.contextLabel ? `<span class="sig-context">${escapeHtml(t.contextLabel)}</span>` : ''}
    <span class="sig-conf" title="置信">${escapeHtml(confLabel(t.confidence, !isAnalogyMode()))}</span>
    <code class="sig-raw" title="原始载荷">${escapeHtml(raw)}</code>
    <span class="sig-hex">hex ${escapeHtml(t.rawHex)}</span>
    ${basis ? `<span class="sig-basis">${basis}</span>` : ''}
  </li>`;
}

export function initSemSignalStreamPanel(root, { getRecorder, getWorld, onClose } = {}) {
  const panel = root.querySelector('#sem-signal-panel');
  const list = root.querySelector('#sem-signal-list');
  const digestEl = root.querySelector('#sem-signal-digest');
  const select = root.querySelector('#sem-signal-being');
  const hintEl = root.querySelector('#sem-signal-hint');
  const btnClose = root.querySelector('#btn-sem-signal-close');
  const btnDigest = root.querySelector('#btn-sig-view-digest');
  const btnDetail = root.querySelector('#btn-sig-view-detail');
  if (!panel || !list) return null;

  let beingFilter = 'all';
  let viewMode = 'digest';

  function setView(mode) {
    viewMode = mode;
    btnDigest?.classList.toggle('active', mode === 'digest');
    btnDetail?.classList.toggle('active', mode === 'detail');
    list?.classList.toggle('hidden', mode !== 'detail');
    digestEl?.classList.toggle('hidden', mode !== 'digest');
    paint();
  }

  function paintBeingOptions() {
    const world = getWorld?.();
    if (!select) return;
    const alive = world?.beings?.filter((b) => b.alive) ?? [];
    select.innerHTML =
      `<option value="all">${escapeHtml(label('semSignalAll'))}</option>` +
      alive
        .map(
          (b) =>
            `<option value="${escapeHtml(b.id)}">${escapeHtml(b.code)} · ${escapeHtml(beingTail(b.id))}</option>`
        )
        .join('');
    if (beingFilter !== 'all' && !alive.some((b) => b.id === beingFilter)) {
      beingFilter = 'all';
    }
    select.value = beingFilter;
  }

  function paint() {
    const recorder = getRecorder?.();
    const world = getWorld?.();
    if (!recorder || !world) return;

    if (hintEl) hintEl.textContent = semSignalViewModeHint();

    const bid = beingFilter === 'all' ? null : beingFilter;

    if (viewMode === 'digest' && digestEl) {
      const digest = buildSignalDigest(recorder, world, {
        beingId: bid,
        windowTicks: DIGEST_WINDOW,
      });
      digestEl.innerHTML = renderDigestBlock(digest);
      return;
    }

    const rows = buildSignalTranslations(recorder, world, {
      beingId: bid,
      limit: STREAM_LIMIT,
      nativeMode: !isAnalogyMode(),
    });

    if (!rows.length) {
      list.innerHTML = `<li class="sem-signal-empty muted">${escapeHtml(label('semSignalEmpty'))}</li>`;
      return;
    }
    list.innerHTML = rows.map(renderSignalLine).join('');
    list.scrollTop = list.scrollHeight;
  }

  select?.addEventListener('change', () => {
    beingFilter = select.value;
    paint();
  });

  btnDigest?.addEventListener('click', () => setView('digest'));
  btnDetail?.addEventListener('click', () => setView('detail'));
  btnClose?.addEventListener('click', () => onClose?.());

  return {
    open() {
      paintBeingOptions();
      panel.classList.remove('hidden');
      setView('digest');
    },
    close() {
      panel.classList.add('hidden');
    },
    toggle() {
      if (panel.classList.contains('hidden')) this.open();
      else this.close();
    },
    isOpen() {
      return !panel.classList.contains('hidden');
    },
    refresh() {
      if (!this.isOpen()) return;
      paintBeingOptions();
      paint();
    },
  };
}
