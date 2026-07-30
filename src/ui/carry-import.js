/** Phase 111 — 观察台留置快照导入面板 */

import { parseFieldReportJson } from '../carry/import-report.js';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderCarryImportPanelHTML() {
  return `
    <section id="carry-import-panel" class="cloud-panel carry-import-panel hidden">
      <div class="cloud-panel-grid">
        <div class="cloud-card cloud-card-wide">
          <h3>留置快照导入</h3>
          <p class="cloud-hint">从田野报告 JSON（field-phase109/110-report.json）选择留置个体载入观察台。</p>
          <label class="cloud-field">
            田野报告
            <input id="carry-import-file" type="file" accept=".json,application/json" />
          </label>
          <label class="cloud-field">
            留置条目
            <select id="carry-import-select" class="env-select" disabled>
              <option value="">— 先选择报告 —</option>
            </select>
          </label>
          <div class="cloud-actions">
            <button id="btn-carry-import-load" type="button" class="btn-secondary" disabled>载入留置</button>
            <button id="btn-carry-import-close" type="button" class="btn-ghost">关闭</button>
          </div>
          <p id="carry-import-meta" class="cloud-hint muted"></p>
        </div>
      </div>
      <p id="carry-import-message" class="cloud-message" aria-live="polite"></p>
    </section>`;
}

export function initCarryImportPanel(root, { onImport, onClose } = {}) {
  const panel = root.querySelector('#carry-import-panel');
  const fileInput = root.querySelector('#carry-import-file');
  const select = root.querySelector('#carry-import-select');
  const meta = root.querySelector('#carry-import-meta');
  const message = root.querySelector('#carry-import-message');
  const btnLoad = root.querySelector('#btn-carry-import-load');
  const btnClose = root.querySelector('#btn-carry-import-close');

  let entries = [];
  let report = null;

  function setMessage(text, isError = false) {
    if (!message) return;
    message.textContent = text ?? '';
    message.classList.toggle('error', isError);
  }

  function fillSelect(list) {
    if (!select) return;
    select.innerHTML =
      '<option value="">— 选择留置个体 —</option>' +
      list
        .map(
          (e) =>
            `<option value="${escapeHtml(e.key)}">${escapeHtml(e.treatmentLabel)} · seed${e.seed} · #${e.index + 1} · 代${e.snapshot.generation ?? 0}</option>`
        )
        .join('');
    select.disabled = !list.length;
    btnLoad.disabled = !list.length;
  }

  function updateMeta() {
    if (!meta) return;
    if (!report) {
      meta.textContent = '';
      return;
    }
    meta.textContent = `Phase ${report.phase} · ${entries.length} 条留置 · ${report.mixedEnvId ?? '混合环境见 provenance'}`;
  }

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    setMessage('解析中…');
    try {
      const text = await file.text();
      const parsed = parseFieldReportJson(text);
      report = parsed.report;
      entries = parsed.entries;
      fillSelect(entries);
      updateMeta();
      setMessage(`已加载 ${file.name}，${entries.length} 条可导入`);
    } catch (err) {
      report = null;
      entries = [];
      fillSelect([]);
      updateMeta();
      setMessage(err.message ?? String(err), true);
    }
  });

  select?.addEventListener('change', () => {
    const key = select.value;
    const entry = entries.find((e) => e.key === key);
    if (!entry || !meta) return;
    const chain = entry.snapshot.provenance?.chain ?? [];
    const envs = chain.map((c) => c.envId).filter(Boolean).join('→');
    meta.textContent = `${entry.treatmentLabel} · 代${entry.snapshot.generation ?? 0}${envs ? ` · ${envs}` : ''}`;
  });

  btnLoad?.addEventListener('click', () => {
    const key = select?.value;
    const entry = entries.find((e) => e.key === key);
    if (!entry) {
      setMessage('请选择留置条目', true);
      return;
    }
    onImport?.({ entry, report, entries });
    setMessage(`已载入 ${entry.snapshot.name ?? '留置'}（代${entry.snapshot.generation ?? 0}）`);
  });

  btnClose?.addEventListener('click', () => onClose?.());

  return {
    open() {
      panel?.classList.remove('hidden');
    },
    close() {
      panel?.classList.add('hidden');
      setMessage('');
    },
    isOpen() {
      return panel && !panel.classList.contains('hidden');
    },
    loadReportText(text) {
      const parsed = parseFieldReportJson(text);
      report = parsed.report;
      entries = parsed.entries;
      fillSelect(entries);
      updateMeta();
      return entries.length;
    },
    getEntries: () => entries,
    getReport: () => report,
  };
}
