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
  { beingId = null, limit = STREAM_LIMIT, crossOnly = false, kinds = null, tickMin = null } = {}
) {
  if (!recorder?.entries) return [];
  const kindSet =
    kinds == null
      ? null
      : new Set(
          kinds.filter((k) => REPRO_KINDS.has(k))
        );
  let entries = recorder.entries.filter((e) => {
    if (!isReproEvolutionEntry(e)) return false;
    if (beingId && e.beingId !== beingId) return false;
    if (tickMin != null && e.tick < tickMin) return false;
    if (kindSet) {
      const k =
        e.meta?.kind ??
        (/\[MEI\]/.test(e.content ?? '') ? 'MEI' : /\[DCK\]/.test(e.content ?? '') ? 'DCK' : null);
      if (!k || !kindSet.has(k)) return false;
    }
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
        <div class="genealogy-repro-stream-filters">
          <label class="genealogy-repro-stream-filter">
            <input type="checkbox" id="genealogy-repro-follow-select" checked />
            跟随选中
          </label>
          <label class="genealogy-repro-stream-filter">
            <input type="checkbox" id="genealogy-repro-kind-mei" checked />
            MEI
          </label>
          <label class="genealogy-repro-stream-filter">
            <input type="checkbox" id="genealogy-repro-kind-dck" checked />
            DCK
          </label>
          <label class="genealogy-repro-stream-filter">
            <input type="checkbox" id="genealogy-repro-cross-only" />
            仅交叉
          </label>
          <label class="genealogy-repro-stream-filter repro-tick-window-label">
            tick窗
            <select id="genealogy-repro-tick-window">
              <option value="0">全部</option>
              <option value="50">近50</option>
              <option value="100">近100</option>
              <option value="200">近200</option>
            </select>
          </label>
        </div>
      </div>
      <p class="muted genealogy-repro-stream-note">[MEI] 减数排出 · [DCK] 半态驻留；含 <code>cross</code> 或互换计数的行为高亮。选中族谱个体时默认只显示该体日志。</p>
      <ul id="genealogy-repro-stream-list" class="genealogy-repro-stream-list"></ul>
    </section>`;
}

export function initReproEvolutionStream(root, { getRecorder, getSelectedBeingId, getReferenceTick } = {}) {
  const list = root.querySelector('#genealogy-repro-stream-list');
  const crossOnlyInput = root.querySelector('#genealogy-repro-cross-only');
  const followSelectInput = root.querySelector('#genealogy-repro-follow-select');
  const meiKindInput = root.querySelector('#genealogy-repro-kind-mei');
  const dckKindInput = root.querySelector('#genealogy-repro-kind-dck');
  const tickWindowSelect = root.querySelector('#genealogy-repro-tick-window');
  if (!list) return null;

  let crossOnly = false;

  function resolveKindFilter() {
    const kinds = [];
    if (meiKindInput?.checked) kinds.push('MEI');
    if (dckKindInput?.checked) kinds.push('DCK');
    if (!kinds.length || kinds.length === REPRO_KINDS.size) return null;
    return kinds;
  }

  function resolveBeingFilter() {
    if (!followSelectInput?.checked) return null;
    return getSelectedBeingId?.() ?? null;
  }

  function resolveTickMin() {
    const windowTicks = Number(tickWindowSelect?.value ?? 0);
    if (!windowTicks) return null;
    const recorder = getRecorder?.();
    const refTick = getReferenceTick?.() ?? null;
    const maxEntryTick =
      recorder?.entries
        ?.filter((e) => isReproEvolutionEntry(e))
        .reduce((m, e) => Math.max(m, e.tick), 0) ?? 0;
    const anchor = Math.max(refTick ?? 0, maxEntryTick);
    return anchor - windowTicks;
  }

  function paint() {
    const recorder = getRecorder?.();
    if (!recorder) return;
    const kinds = resolveKindFilter();
    if (kinds && !kinds.length) {
      list.innerHTML = '<li class="repro-stream-empty muted">请勾选 MEI 或 DCK</li>';
      return;
    }
    const beingId = resolveBeingFilter();
    const tickMin = resolveTickMin();
    const entries = pickReproEvolutionEntries(recorder, { beingId, crossOnly, kinds, tickMin });
    if (!entries.length) {
      const hint = beingId
        ? `选中个体暂无匹配记录`
        : kinds
          ? `暂无 ${kinds.join('/')} 记录`
          : '暂无 [MEI]/[DCK] 记录';
      list.innerHTML = `<li class="repro-stream-empty muted">${escapeHtml(hint)}</li>`;
      return;
    }
    list.innerHTML = entries.map(renderReproStreamLine).join('');
    list.scrollTop = list.scrollHeight;
  }

  crossOnlyInput?.addEventListener('change', () => {
    crossOnly = crossOnlyInput.checked;
    paint();
  });

  followSelectInput?.addEventListener('change', () => paint());
  meiKindInput?.addEventListener('change', () => paint());
  dckKindInput?.addEventListener('change', () => paint());
  tickWindowSelect?.addEventListener('change', () => paint());

  return { paint, refresh: paint };
}
