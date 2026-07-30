/** 信号类比流面板 — [TX]/[RX] 载荷类比译文（非辞典定义） */

import { buildSignalTranslations } from './sem-analogy-translate.js';
import { isAnalogyMode, label, semSignalViewModeHint } from './analogy.js';

const STREAM_LIMIT = 40;

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
          <label class="sem-signal-filter">
            ${escapeHtml(label('semSignalBeing'))}
            <select id="sem-signal-being"></select>
          </label>
          <button id="btn-sem-signal-close" type="button" class="btn-ghost">${escapeHtml(label('semSignalClose'))}</button>
        </div>
      </div>
      <p class="sem-signal-note">${escapeHtml(label('semSignalNote'))}</p>
      <ul id="sem-signal-list" class="sem-signal-list"></ul>
    </section>
  `;
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
  const select = root.querySelector('#sem-signal-being');
  const hintEl = root.querySelector('#sem-signal-hint');
  const btnClose = root.querySelector('#btn-sem-signal-close');
  if (!panel || !list) return null;

  let beingFilter = 'all';

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

  btnClose?.addEventListener('click', () => onClose?.());

  return {
    open() {
      paintBeingOptions();
      panel.classList.remove('hidden');
      paint();
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
