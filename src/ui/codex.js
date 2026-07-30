/** 观察台辞典面板 — 浏览 L2 CODEX 条目（本地 + 云覆盖） */

import { CODEX_ENTRIES, CODEX_META } from './codex-data.js';
import { mergeCodexEntries } from '../cloud/codex-sync.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEvidence(list) {
  return list.map((obs) => `<span class="codex-obs">${escapeHtml(obs)}</span>`).join(' ');
}

export function renderCodexPanelHTML() {
  const ehuCount = CODEX_ENTRIES.filter((e) => e.tag === 'EHU').length;
  return `
    <section id="codex-panel" class="codex-panel hidden" aria-label="世界辞典">
      <div class="codex-head">
        <div>
          <h2 class="codex-title">${escapeHtml(CODEX_META.title)}</h2>
          <p id="codex-meta-line" class="codex-meta">${CODEX_META.count} 条 · 更新 ${CODEX_META.updated} · 电子人相关 ${ehuCount} 条 · 离线</p>
        </div>
        <div class="codex-head-actions">
          <input id="codex-search" class="codex-search" type="search" placeholder="搜索词条、OBS…" />
          <button id="btn-codex-refresh" type="button" class="btn-ghost" title="从云刷新辞典">刷新</button>
          <button id="btn-codex-close" type="button" class="btn-ghost">关闭</button>
        </div>
      </div>
      <p class="codex-note">${escapeHtml(CODEX_META.note)}</p>
      <ul id="codex-list" class="codex-list"></ul>
    </section>
  `;
}

function renderEntry(entry, expanded) {
  const tag = entry.tag ? `<span class="codex-tag">${escapeHtml(entry.tag)}</span>` : '';
  const cloud = entry.source === 'cloud' ? '<span class="codex-cloud-badge">云</span>' : '';
  return `
    <li class="codex-item${expanded ? ' expanded' : ''}" data-id="${escapeHtml(entry.id)}">
      <button type="button" class="codex-item-head" aria-expanded="${expanded}">
        <span class="codex-item-title">${escapeHtml(entry.title)}</span>
        ${tag}
        ${cloud}
        <span class="codex-item-date">${escapeHtml(entry.established)}</span>
      </button>
      <div class="codex-item-body">
        <dl class="codex-dl">
          <dt>定义</dt>
          <dd>${escapeHtml(entry.definition)}</dd>
          <dt>依据</dt>
          <dd>${formatEvidence(entry.evidence)}</dd>
          <dt>可证伪</dt>
          <dd>${escapeHtml(entry.falsifiable)}</dd>
        </dl>
      </div>
    </li>
  `;
}

export function initCodexPanel(root, { onClose, fetchCloudEntries } = {}) {
  const panel = root.querySelector('#codex-panel');
  const list = root.querySelector('#codex-list');
  const search = root.querySelector('#codex-search');
  const btnClose = root.querySelector('#btn-codex-close');
  const btnRefresh = root.querySelector('#btn-codex-refresh');
  const metaLine = root.querySelector('#codex-meta-line');
  if (!panel || !list) return null;

  let entries = [...CODEX_ENTRIES];
  let expandedId = null;
  let query = '';
  let cloudStatus = 'offline';

  function updateMeta() {
    if (!metaLine) return;
    const ehuCount = entries.filter((e) => e.tag === 'EHU').length;
    const cloudLabel =
      cloudStatus === 'synced'
        ? '云已同步'
        : cloudStatus === 'loading'
          ? '云同步中…'
          : cloudStatus === 'error'
            ? '云不可用'
            : '离线';
    metaLine.textContent = `${entries.length} 条 · 更新 ${CODEX_META.updated} · 电子人 ${ehuCount} 条 · ${cloudLabel}`;
  }

  function filteredEntries() {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const hay = [e.title, e.definition, e.falsifiable, ...(e.evidence || []), e.tag || '']
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function paint() {
    const visible = filteredEntries();
    if (!visible.length) {
      list.innerHTML = '<li class="codex-empty muted">无匹配词条</li>';
      return;
    }
    list.innerHTML = visible.map((e) => renderEntry(e, e.id === expandedId)).join('');
  }

  async function refreshFromCloud() {
    if (!fetchCloudEntries) return;
    cloudStatus = 'loading';
    updateMeta();
    try {
      const remote = await fetchCloudEntries();
      if (remote?.length) {
        entries = mergeCodexEntries(CODEX_ENTRIES, remote);
        cloudStatus = 'synced';
      } else {
        entries = [...CODEX_ENTRIES];
        cloudStatus = 'offline';
      }
    } catch {
      entries = [...CODEX_ENTRIES];
      cloudStatus = 'error';
    }
    updateMeta();
    paint();
  }

  list.addEventListener('click', (ev) => {
    const head = ev.target.closest('.codex-item-head');
    if (!head) return;
    const item = head.closest('.codex-item');
    const id = item?.dataset?.id;
    if (!id) return;
    expandedId = expandedId === id ? null : id;
    paint();
  });

  search?.addEventListener('input', () => {
    query = search.value;
    paint();
  });

  btnClose?.addEventListener('click', () => onClose?.());
  btnRefresh?.addEventListener('click', () => refreshFromCloud());

  entries = [...CODEX_ENTRIES];
  updateMeta();
  paint();

  return {
    open() {
      panel.classList.remove('hidden');
      search?.focus();
      refreshFromCloud();
    },
    close() {
      panel.classList.add('hidden');
    },
    toggle() {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        search?.focus();
        refreshFromCloud();
      }
    },
    isOpen() {
      return !panel.classList.contains('hidden');
    },
    openEntry(entryId) {
      if (!entryId) return;
      panel.classList.remove('hidden');
      query = '';
      if (search) search.value = '';
      expandedId = entryId;
      updateMeta();
      paint();
      const item = list.querySelector(`[data-id="${entryId}"]`);
      item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
    refreshFromCloud,
  };
}
