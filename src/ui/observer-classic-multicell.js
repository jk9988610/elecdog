/**
 * 多细胞 v2 经典卡片 — 与族谱同一套机制，无种群层字段
 */

import { label } from './analogy.js';
import { pairMorphCn } from './observer-lexicon.js';
import { assessCellIntegrity } from '../world/cell.js';
import { genealogyStageBadge, stageBadgeLabel } from '../world/genealogy-stage.js';
import { displayLogicRows } from '../world/logic-cell-display.js';
import { renderHealthReportHTML } from './genealogy-tree.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n) {
  if (n == null) return '—';
  return typeof n === 'number' ? n.toFixed(3) : String(n);
}

function pct(n) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

export function renderMulticellClassicBeingCard(being, world, entryStats = null) {
  const badge = genealogyStageBadge(being);
  const badgeHtml = badge
    ? `<span class="${escapeHtml(badge.className)}">${escapeHtml(badge.code)}</span>`
    : '';
  const logicSummary = displayLogicRows(being)
    .map((r) => `${r.analogy} ${r.n}/${r.max}`)
    .join(' · ');
  const partnerTail = being.partnerId ? being.partnerId.slice(-8) : '—';
  const integrity =
    entryStats?.integrity ?? assessCellIntegrity(being, world?.substrate?.channels);

  const healthBtn = being.healthReport
    ? `<button type="button" class="genealogy-health-btn classic-health-btn" data-health-id="${escapeHtml(being.id)}">体检</button>`
    : '';

  return `
      <article class="being-card being-card-multicell">
        <header class="being-head">
          <span class="being-id">${being.id.slice(-8)}</span>
          <span class="being-meta">${escapeHtml(being.code)} · ${escapeHtml(pairMorphCn(being.pairMorph))} · ${escapeHtml(stageBadgeLabel(being))} ${badgeHtml}</span>
        </header>
        <div class="being-grid">
          <div class="stat-row"><span>${label('stress')}</span><strong>${fmt(entryStats?.stress)}</strong></div>
          <div class="stat-row"><span>${label('integrity')}</span><strong>${fmt(integrity)}</strong></div>
          <div class="stat-row"><span>${label('lowStreak')}</span><strong>${being.lowStreak ?? 0}</strong></div>
          <div class="stat-row"><span>${label('extRate')}</span><strong>${pct(entryStats?.extRate)}</strong></div>
          <div class="stat-row"><span>TX / ACT</span><strong>${entryStats?.tx ?? 0} / ${entryStats?.act ?? 0}</strong></div>
          <div class="stat-row"><span>存活 tick</span><strong>${being.tickCount ?? 0}</strong></div>
          <div class="stat-row"><span>${label('mbr')}</span><strong>${being.skinMembrane?.code ?? '—'}</strong></div>
          <div class="stat-row"><span>发育</span><strong>${escapeHtml(being.devStage ?? being.lifeStage ?? '—')}</strong></div>
          <div class="stat-row"><span>代次</span><strong>${being.generation ?? 0}</strong></div>
          <div class="stat-row"><span>伴侣</span><strong>${escapeHtml(partnerTail)}</strong></div>
          <div class="stat-row"><span>哺乳接触</span><strong>${being.lactContactCount ?? 0}</strong></div>
        </div>
        <div class="being-domain muted">${escapeHtml(logicSummary || '逻辑细胞 —')}</div>
        ${healthBtn}
        <div class="classic-health-host hidden" data-health-host="${escapeHtml(being.id)}"></div>
      </article>`;
}

export function initClassicMulticellHealthButtons(root, { getWorld } = {}) {
  root.querySelectorAll('.classic-health-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-health-id');
      const world = getWorld?.();
      const being = world?.beings?.find((b) => b.id === id);
      const host = root.querySelector(`[data-health-host="${id}"]`);
      if (!host || !being) return;
      const open = host.classList.toggle('hidden');
      if (!open) {
        host.innerHTML = renderHealthReportHTML(being);
      } else {
        host.innerHTML = '';
      }
    });
  });
}
