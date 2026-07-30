/** Phase 111/114 — 观察台留置快照导入面板（单条 + 混编批次） */

import { parseFieldReportJson } from '../carry/import-report.js';
import {
  groupEntriesByRun,
  pickRunCarryBatch,
  DEFAULT_OBSERVER_NAIVE_COUNT,
  MAX_CARRY_BATCH,
} from '../carry/mixed-cohort.js';

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
          <p class="cloud-hint">从田野报告 JSON 载入留置；支持单条或 2 carry + naive 混编（对齐田野队列）。</p>
          <label class="cloud-field">
            田野报告
            <input id="carry-import-file" type="file" accept=".json,application/json" />
          </label>
          <label class="cloud-field">
            单条留置
            <select id="carry-import-select" class="env-select" disabled>
              <option value="">— 先选择报告 —</option>
            </select>
          </label>
          <label class="cloud-field">
            混编 run（处理组 × 种子）
            <select id="carry-import-run" class="env-select" disabled>
              <option value="">— 先选择报告 —</option>
            </select>
          </label>
          <label class="cloud-field">
            naive 数量
            <input id="carry-import-naive" type="number" min="1" max="10" value="${DEFAULT_OBSERVER_NAIVE_COUNT}" />
          </label>
          <div class="cloud-actions">
            <button id="btn-carry-import-load" type="button" class="btn-secondary" disabled>载入单条</button>
            <button id="btn-carry-import-mixed" type="button" class="btn-secondary" disabled>载入混编批次</button>
            <button id="btn-carry-import-close" type="button" class="btn-ghost">关闭</button>
          </div>
          <p id="carry-import-meta" class="cloud-hint muted"></p>
        </div>
      </div>
      <p id="carry-import-message" class="cloud-message" aria-live="polite"></p>
    </section>`;
}

export function initCarryImportPanel(root, { onImport, onImportMixed, onClose } = {}) {
  const panel = root.querySelector('#carry-import-panel');
  const fileInput = root.querySelector('#carry-import-file');
  const select = root.querySelector('#carry-import-select');
  const runSelect = root.querySelector('#carry-import-run');
  const naiveInput = root.querySelector('#carry-import-naive');
  const meta = root.querySelector('#carry-import-meta');
  const message = root.querySelector('#carry-import-message');
  const btnLoad = root.querySelector('#btn-carry-import-load');
  const btnMixed = root.querySelector('#btn-carry-import-mixed');
  const btnClose = root.querySelector('#btn-carry-import-close');

  let entries = [];
  let runGroups = [];
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
    btnMixed.disabled = !runGroups.length;
  }

  function fillRunSelect(groups) {
    if (!runSelect) return;
    runSelect.innerHTML =
      '<option value="">— 选择田野 run —</option>' +
      groups
        .map(
          (g) =>
            `<option value="${escapeHtml(g.runKey)}">${escapeHtml(g.treatmentLabel)} · seed${g.seed} · ${g.entries.length} 留置</option>`
        )
        .join('');
    runSelect.disabled = !groups.length;
    btnMixed.disabled = !groups.length;
  }

  function updateMeta() {
    if (!meta) return;
    if (!report) {
      meta.textContent = '';
      return;
    }
    meta.textContent = `Phase ${report.phase} · ${entries.length} 条留置 · ${runGroups.length} run · 混编最多 ${MAX_CARRY_BATCH} carry + naive`;
  }

  function refreshFromParsed(parsed) {
    report = parsed.report;
    entries = parsed.entries;
    runGroups = groupEntriesByRun(entries);
    fillSelect(entries);
    fillRunSelect(runGroups);
    updateMeta();
  }

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    setMessage('解析中…');
    try {
      const text = await file.text();
      refreshFromParsed(parseFieldReportJson(text));
      setMessage(`已加载 ${file.name}，${entries.length} 条可导入`);
    } catch (err) {
      report = null;
      entries = [];
      runGroups = [];
      fillSelect([]);
      fillRunSelect([]);
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

  runSelect?.addEventListener('change', () => {
    const g = runGroups.find((r) => r.runKey === runSelect.value);
    if (!g || !meta) return;
    const batch = pickRunCarryBatch(g, MAX_CARRY_BATCH);
    meta.textContent = `混编：${batch.length} carry + ${naiveInput?.value ?? DEFAULT_OBSERVER_NAIVE_COUNT} naive · ${g.treatmentLabel} seed${g.seed}`;
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

  btnMixed?.addEventListener('click', () => {
    const g = runGroups.find((r) => r.runKey === runSelect?.value);
    if (!g) {
      setMessage('请选择混编 run', true);
      return;
    }
    const batch = pickRunCarryBatch(g, MAX_CARRY_BATCH);
    if (!batch.length) {
      setMessage('该 run 无留置条目', true);
      return;
    }
    const naiveCount = Math.min(10, Math.max(1, Number(naiveInput?.value) || DEFAULT_OBSERVER_NAIVE_COUNT));
    onImportMixed?.({
      entries: batch,
      report,
      runGroup: g,
      naiveCount,
      seed: g.seed,
    });
    setMessage(`已混编载入 ${batch.length} carry + ${naiveCount} naive`);
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
      refreshFromParsed(parseFieldReportJson(text));
      return entries.length;
    },
    getEntries: () => entries,
    getReport: () => report,
    getRunGroups: () => runGroups,
  };
}
