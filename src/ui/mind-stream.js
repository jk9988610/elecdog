/** 内在流观察面板 — internal + [EHU] 进化迹 + [MEI]/[DCK] 繁殖迹 + 记忆/信号 */

import {
  isReproCrossHighlight,
  isReproEvolutionEntry,
  pickReproEvolutionEntries,
} from './repro-evolution-stream.js';

const STREAM_LIMIT = 120;

const CHANNEL_CLASS = {
  internal: 'mind-ch-internal',
  evolution: 'mind-ch-evolution',
  memory: 'mind-ch-memory',
  signal: 'mind-ch-signal',
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function beingTail(id) {
  return id ? id.slice(-8) : '—';
}

export function pickMindStreamEntries(recorder, { beingId = null, limit = STREAM_LIMIT, reproOnly = false } = {}) {
  if (reproOnly) {
    return pickReproEvolutionEntries(recorder, { beingId, limit });
  }
  const entries = recorder.entries.filter((e) => {
    if (beingId && e.beingId !== beingId) return false;
    if (e.channel === 'internal') return true;
    if (e.channel === 'memory') return true;
    if (e.channel === 'signal') return true;
    if (e.channel === 'evolution') {
      if (isReproEvolutionEntry(e)) return true;
      return /\[EHU/.test(e.content);
    }
    return false;
  });
  return entries.slice(-limit);
}

export function mindStreamRhythm(entries, windowTicks = 50) {
  const internal = entries.filter((e) => e.channel === 'internal');
  if (!internal.length) return { ticks: 0, lines: 0, perTick: null };
  const maxTick = internal[internal.length - 1].tick;
  const minTick = Math.max(0, maxTick - windowTicks);
  const recent = internal.filter((e) => e.tick >= minTick);
  const tickSet = new Set(recent.map((e) => e.tick));
  const ticks = tickSet.size;
  const lines = recent.length;
  return {
    ticks,
    lines,
    perTick: ticks ? +(lines / ticks).toFixed(2) : null,
  };
}

export function renderMindStreamPanelHTML() {
  return `
    <section id="mind-stream-panel" class="mind-stream-panel hidden" aria-label="内在流观察">
      <div class="mind-stream-head">
        <div>
          <h2 class="mind-stream-title">内在流观察</h2>
          <p id="mind-stream-rhythm" class="mind-stream-rhythm">对内节律 —</p>
        </div>
        <div class="mind-stream-head-actions">
          <label class="mind-stream-filter">
            个体
            <select id="mind-stream-being"></select>
          </label>
          <button id="btn-mind-stream-close" type="button" class="btn-ghost">关闭</button>
        </div>
      </div>
      <p class="mind-stream-note">显示 internal 思考流、[EHU] 进化迹与 [MEI]/[DCK] 减数交叉（含 cross 高亮）；非感受映射。</p>
      <ul id="mind-stream-list" class="mind-stream-list"></ul>
    </section>
  `;
}

function renderStreamLine(entry) {
  const ch = CHANNEL_CLASS[entry.channel] ?? 'mind-ch-other';
  const cross = entry.channel === 'evolution' && isReproCrossHighlight(entry);
  const crossClass = cross ? ' mind-stream-cross' : '';
  const who = entry.beingId ? `<span class="mind-who">${escapeHtml(beingTail(entry.beingId))}</span>` : '';
  return `<li class="mind-stream-item ${ch}${crossClass}">
    <span class="mind-tick">t${entry.tick}</span>
    ${who}
    <span class="mind-ch">${escapeHtml(entry.channel)}</span>
    <code class="mind-content">${escapeHtml(entry.content)}</code>
  </li>`;
}

export function initMindStreamPanel(root, { getRecorder, getWorld, onClose } = {}) {
  const panel = root.querySelector('#mind-stream-panel');
  const list = root.querySelector('#mind-stream-list');
  const select = root.querySelector('#mind-stream-being');
  const rhythmEl = root.querySelector('#mind-stream-rhythm');
  const btnClose = root.querySelector('#btn-mind-stream-close');
  if (!panel || !list) return null;

  let beingFilter = 'all';

  function paintBeingOptions() {
    const world = getWorld?.();
    if (!select) return;
    const alive = world?.beings?.filter((b) => b.alive) ?? [];
    select.innerHTML =
      `<option value="all">全部存活个体</option>` +
      alive
        .map(
          (b) =>
            `<option value="${escapeHtml(b.id)}">${escapeHtml(b.code)} · ${escapeHtml(beingTail(b.id))} · ${escapeHtml(b.ehuStage ?? 'H0')}</option>`
        )
        .join('');
    if (beingFilter !== 'all' && !alive.some((b) => b.id === beingFilter)) {
      beingFilter = 'all';
    }
    select.value = beingFilter;
  }

  function paint() {
    const recorder = getRecorder?.();
    if (!recorder) return;
    const bid = beingFilter === 'all' ? null : beingFilter;
    const entries = pickMindStreamEntries(recorder, { beingId: bid });
    const rhythm = mindStreamRhythm(entries);
    if (rhythmEl) {
      rhythmEl.textContent =
        rhythm.perTick != null
          ? `近 ${rhythm.ticks} tick · ${rhythm.lines} 条 internal · 均值 ${rhythm.perTick} 条/tick`
          : '对内节律 — 等待内在流…';
    }
    if (!entries.length) {
      list.innerHTML = '<li class="mind-stream-empty muted">暂无内在流记录</li>';
      return;
    }
    list.innerHTML = entries.map(renderStreamLine).join('');
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
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        paintBeingOptions();
        paint();
      }
    },
    isOpen() {
      return !panel.classList.contains('hidden');
    },
    refresh() {
      if (!panel.classList.contains('hidden')) {
        paintBeingOptions();
        paint();
      }
    },
  };
}
