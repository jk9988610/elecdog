/** 思考外化面板 — [THO] internal→TX 耦合观察 */

import { formatPayloadDisplay } from './sem-analogy-translate.js';
import { label } from './analogy.js';

const LIMIT = 40;

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

function bytesFromLine(line) {
  const parts = [...String(line).matchAll(/0x([0-9a-fA-F]{2})/gi)];
  if (parts.length < 3) return '—';
  return parts
    .slice(0, 3)
    .map((m) => m[1])
    .join('');
}

export function pickThoughtSpeechEntries(recorder, { beingId = null, limit = LIMIT } = {}) {
  const entries = (recorder?.entries ?? []).filter((e) => {
    if (beingId && e.beingId !== beingId) return false;
    return e.channel === 'evolution' && e.meta?.kind === 'THO';
  });
  return entries.slice(-limit);
}

function findTxLine(recorder, tick, beingId) {
  for (const e of recorder?.entries ?? []) {
    if (e.tick !== tick || e.beingId !== beingId || e.channel !== 'external') continue;
    if (e.content?.startsWith('[TX]')) return e.content;
  }
  return null;
}

export function buildThoughtSpeechRows(recorder, { beingId = null, limit = LIMIT } = {}) {
  const entries = pickThoughtSpeechEntries(recorder, { beingId, limit });
  return entries.map((e) => {
    const src = e.meta?.sourceInternal ?? '';
    const txLine = e.meta?.txLine ?? findTxLine(recorder, e.tick, e.beingId);
    const srcHex = bytesFromLine(src);
    const txHex = bytesFromLine(txLine);
    const match = srcHex !== '—' && txHex !== '—' && srcHex.toLowerCase() === txHex.toLowerCase();
    const load = e.meta?.load ?? 0;
    const narrative = match
      ? `思考外化：内在流 ${formatPayloadDisplay(srcHex)} 直接开口为同型 TX（耦合 ${load}）`
      : `思考外化：内在 ${formatPayloadDisplay(srcHex)} → 开口 ${formatPayloadDisplay(txHex)}（耦合 ${load}）`;
    return { entry: e, narrative, match, load, src, txLine };
  });
}

export function renderThoughtSpeechPanelHTML() {
  return `
    <section id="thought-speech-panel" class="thought-speech-panel hidden" aria-label="思考外化">
      <div class="thought-speech-head">
        <div>
          <h2 class="thought-speech-title">${escapeHtml(label('thoughtSpeech'))}</h2>
          <p id="thought-speech-hint" class="thought-speech-hint">${escapeHtml(label('thoughtSpeechHint'))}</p>
        </div>
        <div class="thought-speech-head-actions">
          <label class="thought-speech-filter">
            ${escapeHtml(label('semSignalBeing'))}
            <select id="thought-speech-being"></select>
          </label>
          <button id="btn-thought-speech-close" type="button" class="btn-ghost">${escapeHtml(label('semSignalClose'))}</button>
        </div>
      </div>
      <p class="thought-speech-note">${escapeHtml(label('thoughtSpeechNote'))}</p>
      <ul id="thought-speech-list" class="thought-speech-list"></ul>
    </section>
  `;
}

function renderRow(row) {
  const e = row.entry;
  const matchCls = row.match ? 'tho-match' : 'tho-partial';
  return `<li class="thought-speech-item ${matchCls}">
    <span class="tho-tick">t${e.tick}</span>
    <span class="tho-who">${escapeHtml(beingTail(e.beingId))}</span>
    <span class="tho-narrative">${escapeHtml(row.narrative)}</span>
    <code class="tho-src">${escapeHtml(row.src)}</code>
    <code class="tho-tx">${escapeHtml(row.txLine ?? '—')}</code>
  </li>`;
}

export function initThoughtSpeechPanel(root, { getRecorder, getWorld, onClose } = {}) {
  const panel = root.querySelector('#thought-speech-panel');
  const list = root.querySelector('#thought-speech-list');
  const select = root.querySelector('#thought-speech-being');
  const btnClose = root.querySelector('#btn-thought-speech-close');
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
    if (!recorder) return;

    const enabled = world?.envProfile?.internalTxCoupling === true;
    if (!enabled) {
      list.innerHTML = `<li class="thought-speech-empty muted">${escapeHtml(label('thoughtSpeechOff'))}</li>`;
      return;
    }

    const bid = beingFilter === 'all' ? null : beingFilter;
    const rows = buildThoughtSpeechRows(recorder, { beingId: bid });

    if (!rows.length) {
      list.innerHTML = `<li class="thought-speech-empty muted">${escapeHtml(label('thoughtSpeechEmpty'))}</li>`;
      return;
    }
    list.innerHTML = rows.map(renderRow).join('');
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
