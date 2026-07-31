/** 繁殖进化流 — [MEI]/[DCK] 减数交叉观察（族谱模式 + 内在流扩展） */

const STREAM_LIMIT = 80;

const REPRO_KINDS = new Set(['MEI', 'DCK']);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function beingTail(id) {
  return id ? id.slice(-8) : '—';
}

export function isReproEvolutionEntry(entry) {
  if (!entry || entry.channel !== 'evolution') return false;
  const kind = entry.meta?.kind;
  if (kind && REPRO_KINDS.has(kind)) return true;
  return /\[(MEI|DCK)\]/.test(entry.content ?? '');
}

export function isReproCrossHighlight(entry) {
  if (!entry) return false;
  if ((entry.meta?.crossoverCount ?? 0) > 0) return true;
  return /\bcross\b/.test(entry.content ?? '');
}

export function pickReproEvolutionEntries(
  recorder,
  { beingId = null, limit = STREAM_LIMIT, crossOnly = false } = {}
) {
  if (!recorder?.entries) return [];
  let entries = recorder.entries.filter((e) => {
    if (!isReproEvolutionEntry(e)) return false;
    if (beingId && e.beingId !== beingId) return false;
    return true;
  });
  if (crossOnly) {
    entries = entries.filter((e) => isReproCrossHighlight(e));
  }
  return entries.slice(-limit);
}

function renderReproStreamLine(entry) {
  const cross = isReproCrossHighlight(entry);
  const kind = entry.meta?.kind ?? (/\[MEI\]/.test(entry.content) ? 'MEI' : 'DCK');
  const crossClass = cross ? ' repro-stream-cross' : '';
  const kindClass = kind === 'MEI' ? ' repro-stream-mei' : ' repro-stream-dck';
  const who = entry.beingId
    ? `<span class="repro-stream-who">${escapeHtml(beingTail(entry.beingId))}</span>`
    : '';
  const crossBadge = cross
    ? `<span class="repro-stream-cross-badge">互换${entry.meta?.crossoverCount ?? '·'}</span>`
    : '';
  return `<li class="repro-stream-item${crossClass}${kindClass}">
    <span class="repro-stream-tick">t${entry.tick}</span>
    ${who}
    <span class="repro-stream-kind">${escapeHtml(kind)}</span>
    ${crossBadge}
    <code class="repro-stream-content">${escapeHtml(entry.content)}</code>
  </li>`;
}

export function renderReproEvolutionStreamHTML() {
  return `
    <section id="genealogy-repro-stream" class="genealogy-repro-stream" aria-label="繁殖进化流">
      <div class="genealogy-repro-stream-head">
        <h3 class="genealogy-repro-stream-title">繁殖进化流</h3>
        <label class="genealogy-repro-stream-filter">
          <input type="checkbox" id="genealogy-repro-cross-only" />
          仅交叉
        </label>
      </div>
      <p class="muted genealogy-repro-stream-note">[MEI] 减数排出 · [DCK] 半态驻留；含 <code>cross</code> 或互换计数的行为高亮。</p>
      <ul id="genealogy-repro-stream-list" class="genealogy-repro-stream-list"></ul>
    </section>`;
}

export function initReproEvolutionStream(root, { getRecorder } = {}) {
  const list = root.querySelector('#genealogy-repro-stream-list');
  const crossOnlyInput = root.querySelector('#genealogy-repro-cross-only');
  if (!list) return null;

  let crossOnly = false;

  function paint() {
    const recorder = getRecorder?.();
    if (!recorder) return;
    const entries = pickReproEvolutionEntries(recorder, { crossOnly });
    if (!entries.length) {
      list.innerHTML = '<li class="repro-stream-empty muted">暂无 [MEI]/[DCK] 记录</li>';
      return;
    }
    list.innerHTML = entries.map(renderReproStreamLine).join('');
    list.scrollTop = list.scrollHeight;
  }

  crossOnlyInput?.addEventListener('change', () => {
    crossOnly = crossOnlyInput.checked;
    paint();
  });

  return { paint, refresh: paint };
}
