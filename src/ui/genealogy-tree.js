/**
 * 族谱树 + 个体详情弹窗
 */

import { label } from './analogy.js';
import { pairMorphCn } from './observer-lexicon.js';
import {
  LIFE_STAGE_GEST,
  LIFE_STAGE_JUV,
  LIFE_STAGE_ADT,
  SKIN_CELL_CODE,
} from '../world/logic-cell-types.js';
import { genealogySourceBeings } from '../world/genealogy-persist.js';
import { displayLogicRows } from '../world/logic-cell-display.js';
import {
  genealogyStageBadge,
  isDisplayPregnant,
  stageBadgeLabel,
} from '../world/genealogy-stage.js';
import {
  formatBeingDisplayName,
  courtshipBondLineForCouple,
  courtshipInitiatorFromPair,
} from '../world/being-names.js';
import { HORMONE_KEYS } from '../world/hormone-system.js';
import { STR_LACT_OUT } from '../world/body-structures.js';
import { initGenealogyViewport } from './genealogy-viewport.js';

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

function stageLabel(stage) {
  if (stage === LIFE_STAGE_GEST) return '宫内胚胎';
  if (stage === LIFE_STAGE_JUV) return '婴幼儿';
  if (stage === LIFE_STAGE_ADT) return '成体';
  return stage ?? '—';
}

export function buildGenealogyModel(world) {
  const beings = genealogySourceBeings(world);
  const byId = new Map(beings.map((b) => [b.id, b]));
  const nodes = beings.map((being) => {
    const partner = being.partnerId ? byId.get(being.partnerId) : null;
    const counts = being.logicCells
      ? Object.fromEntries(
          Object.entries(being.logicCells).map(([k, v]) => [k, v?.length ?? 0])
        )
      : {};
    const badge = genealogyStageBadge(being);
    return {
      id: being.id,
      code: being.code,
      name: being.name,
      familyName: being.familyName ?? null,
      givenName: being.givenName ?? null,
      displayName: formatBeingDisplayName(being),
      alive: being.alive,
      generation: being.generation ?? 0,
      pairMorph: being.pairMorph ?? null,
      partnerId: being.partnerId ?? null,
      partnerTail: partner ? beingTail(partner.id) : null,
      partnerBondTick: being.partnerBondTick ?? null,
      lifeStage: being.lifeStage ?? null,
      devStage: being.devStage ?? null,
      tickCount: being.tickCount ?? 0,
      bornAtTick: being.bornAtTick ?? null,
      endedAtTick: being.endedAtTick ?? null,
      endReason: being.endReason ?? null,
      parentA: being.pairParentA ?? being.fissionParent ?? null,
      parentB: being.pairParentB ?? null,
      logicCounts: counts,
      stageBadge: badge?.code ?? null,
      stageBadgeClass: badge?.className ?? null,
      hasHealthReport: Boolean(being.healthReport),
      skin: being.skinMembrane?.code ?? SKIN_CELL_CODE,
    };
  });
  return { nodes, beings, tick: world?.tick ?? 0 };
}

function renderPersonCard(being, selectedId, classExtra = '') {
  if (!being) return '';
  const sel = selectedId === being.id ? ' selected' : '';
  const dead = !being.alive ? ' dead' : '';
  const badge = genealogyStageBadge(being);
  const badgeHtml = badge
    ? `<span class="${escapeHtml(badge.className)}">${escapeHtml(badge.code)}</span>`
    : '';
  const end = !being.alive ? '<span class="genealogy-end-badge">END</span>' : '';
  return `<div class="gv-person-card${sel}${dead}${classExtra}">
    <button type="button" class="genealogy-id-btn" data-being-id="${escapeHtml(being.id)}" title="${escapeHtml(being.id)}">
      <span class="genealogy-name">${escapeHtml(formatBeingDisplayName(being))}</span>
      <span class="genealogy-avatar">${escapeHtml(being.code)}</span>
      <span class="genealogy-morph">${escapeHtml(pairMorphCn(being.pairMorph))}</span>
      ${badgeHtml}${end}
    </button>
  </div>`;
}

function nodeFromId(nodes, id) {
  return nodes.find((n) => n.id === id) ?? null;
}

function renderTreeNode(being, byId, nodes, beings, selectedId, seen) {
  if (!being || seen.has(being.id)) return '';
  seen.add(being.id);

  const n = nodeFromId(nodes, being.id);
  if (!n) return '';

  let mate = being.partnerId ? byId.get(being.partnerId) : null;
  if (mate && seen.has(mate.id)) mate = null;
  if (mate) seen.add(mate.id);

  const parentIds = [being.id, mate?.id].filter(Boolean);
  const children = beings.filter(
    (b) =>
      parentIds.some((pid) => b.pairParentA === pid || b.fissionParent === pid) &&
      !seen.has(b.id) &&
      b.id !== being.id &&
      b.id !== mate?.id
  );

  const couple = mate
    ? `<div class="gv-couple">${renderPersonCard(being, selectedId)}<span class="gv-couple-link" aria-hidden="true">—</span>${renderPersonCard(mate, selectedId, ' mate')}</div>`
    : `<div class="gv-couple">${renderPersonCard(being, selectedId)}</div>`;

  const kids =
    children.length > 0
      ? `<ul class="gv-children">${children
          .map((c) => renderTreeNode(c, byId, nodes, beings, selectedId, seen))
          .join('')}</ul>`
      : '';

  return `<li class="gv-node${children.length ? ' has-children' : ''}">
    ${couple}
    ${kids}
  </li>`;
}

function isGenealogyForestRoot(being, byId) {
  if (being.pairParentA || being.fissionParent) return false;
  const headId = being.lineageHeadId ?? being.id;
  if (headId !== being.id) return false;
  if (being.pairMorph === 'B' && being.partnerId) {
    const partner = byId.get(being.partnerId);
    if (partner && (partner.lineageHeadId ?? partner.id) === partner.id) return false;
  }
  return true;
}

export function renderGenealogyTreeHTML(model, { selectedId = null } = {}) {
  const nodes = model?.nodes ?? [];
  const beings = model?.beings ?? [];
  if (!nodes.length) {
    return `<p class="genealogy-empty muted">暂无多细胞个体</p>`;
  }

  const byId = new Map(beings.map((b) => [b.id, b]));
  const forestRoots = beings.filter((b) => isGenealogyForestRoot(b, byId));
  const seen = new Set();

  let trees = forestRoots
    .map((r) => renderTreeNode(r, byId, nodes, beings, selectedId, seen))
    .join('');

  for (const b of beings) {
    if (!seen.has(b.id)) {
      trees += renderTreeNode(b, byId, nodes, beings, selectedId, seen);
    }
  }

  return `<ul class="genealogy-forest">${trees}</ul>`;
}

function renderHormoneBars(being) {
  if (!being?.hormoneVec) return '<p class="muted">无激素向量</p>';
  const labels = ['生殖', '泌乳', '代谢', '应激', '生长'];
  return HORMONE_KEYS.map((k, i) => {
    const v = Math.max(0, Math.min(1, being.hormoneVec[k] ?? 0));
    const pct = Math.round(v * 100);
    const lact = k === 'h2' && being.bodyStructures?.[STR_LACT_OUT]?.open;
    return `<div class="hormone-bar-row${lact ? ' hormone-bar-lact' : ''}">
      <span class="hormone-bar-label">${labels[i] ?? k}</span>
      <div class="hormone-bar-track"><div class="hormone-bar-fill" style="width:${pct}%"></div></div>
      <span class="hormone-bar-val">${pct}%</span>
    </div>`;
  }).join('');
}

export function renderHealthReportHTML(being) {
  const report = being?.healthReport;
  if (!report) {
    return '<p class="muted">尚无体检报告（幼体出生后签发；成体性成熟时覆盖更新）</p>';
  }
  const interp = report.dnaInterpret;
  const zoneRows = (interp?.zones ?? [])
    .map(
      (z) =>
        `<div class="health-zone-block">
          <h5 class="health-zone-title">${escapeHtml(z.zone)} ${escapeHtml(z.name)} <code>${z.start}–${z.end}</code></h5>
          <p class="health-zone-role muted">${escapeHtml(z.role)}</p>
          <p class="health-zone-slice"><code>${escapeHtml(z.slice)}</code></p>
          ${(z.expressLines ?? [])
            .map((line) => `<p class="health-zone-express">${escapeHtml(line)}</p>`)
            .join('')}
        </div>`
    )
    .join('');

  const posRows = (interp?.positions ?? [])
    .map(
      (p) =>
        `<tr><td>${p.index}</td><td><code>${escapeHtml(p.base)}</code></td><td>${escapeHtml(p.zone)}</td><td>${escapeHtml(p.meaning)}</td></tr>`
    )
    .join('');

  return `
    <div class="health-report-panel">
      <h4 class="term">体检报告</h4>
      <div class="stat-grid">
        <div class="stat-row"><span>签发 tick</span><strong>${report.atTick}</strong></div>
        <div class="stat-row"><span>阶段</span><strong>${escapeHtml(report.stage ?? '—')}</strong></div>
        <div class="stat-row"><span>DNA 指纹</span><strong><code>${escapeHtml(report.dnaFp)}</code></strong></div>
        <div class="stat-row"><span>序列长度</span><strong>${interp?.length ?? report.dnaSeq?.length ?? 0}</strong></div>
      </div>
      <p class="health-seq"><code>${escapeHtml(interp?.sequence ?? report.dnaSeq ?? '')}</code></p>
      <h5 class="health-subtitle">区段解读 Z1–Z6</h5>
      <div class="health-zones">${zoneRows}</div>
      <h5 class="health-subtitle">位点解读（96 段）</h5>
      <div class="health-pos-table-wrap">
        <table class="health-pos-table">
          <thead><tr><th>位</th><th>碱</th><th>区</th><th>释义</th></tr></thead>
          <tbody>${posRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderBeingDetailHTML(
  being,
  partnerBeing = null,
  profile = null,
  { showHealth = false } = {}
) {
  if (!being) return '<p class="muted">未选择个体</p>';
  const logicRows = displayLogicRows(being)
    .map(
      (r) =>
        `<div class="stat-row"><span>${escapeHtml(r.analogy)} <code>${escapeHtml(r.code)}</code></span><strong>${r.n}/${r.max}</strong></div>`
    )
    .join('');

  const lactOpen = being.bodyStructures?.[STR_LACT_OUT]?.open;
  const lactUntil = being.bodyStructures?.[STR_LACT_OUT]?.untilTick;
  const badge = stageBadgeLabel(being);
  let courtshipHtml = '';
  if (partnerBeing) {
    const male = being.pairMorph === 'A' ? being : partnerBeing.pairMorph === 'A' ? partnerBeing : null;
    const female = being.pairMorph === 'B' ? being : partnerBeing.pairMorph === 'B' ? partnerBeing : null;
    const line = male && female ? courtshipBondLineForCouple(male, female) : null;
    const initiator = male && female ? courtshipInitiatorFromPair(male, female) : null;
    if (line) {
      courtshipHtml = `
      <h4 class="term">求偶</h4>
      <p class="genealogy-courtship-detail">${escapeHtml(line)}</p>
      ${initiator?.partnerBondTick != null ? `<p class="muted genealogy-courtship-meta">伴侣登记 tick ${initiator.partnerBondTick}</p>` : ''}`;
    }
  }

  const healthBtn = being.healthReport
    ? `<button type="button" class="genealogy-detail-health-btn">${showHealth ? '收起体检' : '查看体检'}</button>`
    : '';
  const healthBlock = showHealth
    ? `<div class="genealogy-detail-health-host">${renderHealthReportHTML(being)}</div>`
    : '';

  return `
    <div class="genealogy-detail">
      <h3 class="genealogy-detail-title">${escapeHtml(formatBeingDisplayName(being))} <span class="genealogy-detail-morph">${escapeHtml(pairMorphCn(being.pairMorph))}</span> <span class="genealogy-detail-badge">${escapeHtml(badge)}</span></h3>
      <p class="genealogy-detail-id"><code>${escapeHtml(being.id)}</code> · ${escapeHtml(being.code)}</p>
      <div class="stat-grid">
        <div class="stat-row"><span>存活</span><strong>${being.alive ? '是' : '否'}</strong></div>
        ${!being.alive ? `<div class="stat-row"><span>END</span><strong>${escapeHtml(being.endReason ?? '—')} @t${being.endedAtTick ?? '—'}</strong></div>` : ''}
        <div class="stat-row"><span>发育阶段</span><strong>${escapeHtml(stageLabel(being.devStage ?? being.lifeStage))}</strong></div>
        <div class="stat-row"><span>族谱标记</span><strong>${escapeHtml(badge)}</strong></div>
        ${isDisplayPregnant(being) ? '<div class="stat-row"><span>妊娠</span><strong>孕妇</strong></div>' : ''}
        <div class="stat-row"><span>代次</span><strong>${being.generation ?? 0}</strong></div>
        <div class="stat-row"><span>伴侣</span><strong>${escapeHtml(beingTail(being.partnerId))}</strong></div>
      </div>
      ${courtshipHtml}
      ${healthBtn ? `<div class="genealogy-detail-actions">${healthBtn}</div>` : ''}
      ${healthBlock}
      <h4 class="term">激素与泌乳</h4>
      <div class="hormone-bars">${renderHormoneBars(being)}</div>
      <div class="stat-grid lact-panel">
        <div class="stat-row"><span>哺乳通道</span><strong>${lactOpen ? '开放' : '关闭'}</strong></div>
        ${lactUntil != null ? `<div class="stat-row"><span>哺乳至 tick</span><strong>${lactUntil}</strong></div>` : ''}
        <div class="stat-row"><span>哺乳接触次数</span><strong>${being.lactContactCount ?? 0}</strong></div>
        ${being.lastLacTick != null ? `<div class="stat-row"><span>最近哺乳 tick</span><strong>${being.lastLacTick}</strong></div>` : ''}
      </div>
      <h4 class="term">逻辑细胞</h4>
      <div class="stat-grid">${logicRows}</div>
    </div>
  `;
}

function positionDetailPopover(popover, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const margin = 12;
  const width = 340;
  const maxHeight = Math.min(520, window.innerHeight - margin * 2);
  popover.style.width = `${width}px`;
  popover.style.maxHeight = `${maxHeight}px`;

  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;
  let left;
  if (spaceRight >= width + margin) {
    left = rect.right + margin;
    popover.classList.add('popover-anchor-right');
    popover.classList.remove('popover-anchor-left');
  } else {
    left = Math.max(margin, rect.left - width - margin);
    popover.classList.add('popover-anchor-left');
    popover.classList.remove('popover-anchor-right');
  }
  const top = Math.min(Math.max(margin, rect.top), window.innerHeight - maxHeight - margin);
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}

let activeGenealogyPopoverClose = null;

function bindGenealogyPopoverDismiss() {
  if (bindGenealogyPopoverDismiss.done) return;
  bindGenealogyPopoverDismiss.done = true;
  document.addEventListener(
    'click',
    (ev) => {
      const pop = document.getElementById('genealogy-detail-popover');
      if (!pop || pop.classList.contains('hidden')) return;
      if (pop.contains(ev.target) || ev.target.closest('.genealogy-id-btn')) return;
      activeGenealogyPopoverClose?.();
    },
    true
  );
}

export function initGenealogyPanel(root, { getWorld, onSelect } = {}) {
  const viewportEl = root.querySelector('#genealogy-viewport');
  const innerEl = root.querySelector('#genealogy-viewport-inner');
  const popover = root.querySelector('#genealogy-detail-popover');
  const popoverBody = root.querySelector('#genealogy-detail-popover-body');
  const popoverClose = root.querySelector('#genealogy-detail-popover-close');
  if (!viewportEl || !innerEl || !popover || !popoverBody) return null;

  let selectedId = null;
  let showHealth = false;
  let viewportCtrl = initGenealogyViewport(viewportEl, innerEl);

  function findBeing(world, id) {
    return (
      world?.beings?.find((b) => b.id === id) ??
      genealogySourceBeings(world).find((b) => b.id === id)
    );
  }

  function closePopover() {
    popover.classList.add('hidden');
    selectedId = null;
    showHealth = false;
    innerEl.querySelectorAll('.gv-person-card').forEach((c) => c.classList.remove('selected'));
  }

  function openPopover(anchorEl, being) {
    const world = getWorld?.();
    const partner = being?.partnerId ? findBeing(world, being.partnerId) : null;
    popoverBody.innerHTML = renderBeingDetailHTML(being, partner, world?.envProfile, {
      showHealth,
    });
    popoverBody.querySelector('.genealogy-detail-health-btn')?.addEventListener('click', () => {
      showHealth = !showHealth;
      openPopover(anchorEl, being);
    });
    popover.classList.remove('hidden');
    positionDetailPopover(popover, anchorEl);
    onSelect?.(being.id);
  }

  popoverClose?.addEventListener('click', () => closePopover());
  activeGenealogyPopoverClose = closePopover;
  bindGenealogyPopoverDismiss();

  function bindTreeInteractions() {
    innerEl.querySelectorAll('.genealogy-id-btn').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = btn.getAttribute('data-being-id');
        const world = getWorld?.();
        const being = findBeing(world, id);
        if (!being) return;
        if (selectedId === id && !popover.classList.contains('hidden')) {
          closePopover();
          return;
        }
        selectedId = id;
        showHealth = false;
        innerEl.querySelectorAll('.gv-person-card').forEach((c) => c.classList.remove('selected'));
        btn.closest('.gv-person-card')?.classList.add('selected');
        openPopover(btn, being);
      });
    });
  }

  function paint() {
    const world = getWorld?.();
    const model = buildGenealogyModel(world);
    innerEl.innerHTML = renderGenealogyTreeHTML(model, { selectedId });
    bindTreeInteractions();
    if (selectedId && !popover.classList.contains('hidden')) {
      const btn = innerEl.querySelector(`.genealogy-id-btn[data-being-id="${selectedId}"]`);
      const being = findBeing(world, selectedId);
      if (btn && being) {
        openPopover(btn, being);
      } else {
        closePopover();
      }
    }
  }

  return { paint, getSelectedId: () => selectedId, closePopover };
}

export function renderGenealogyPanelHTML() {
  return `
    <section id="genealogy-panel" class="genealogy-panel panel">
      <h2>${escapeHtml(label('genealogyPanel'))}</h2>
      <p class="panel-hint">${escapeHtml(label('genealogyHint'))}</p>
      <div class="genealogy-viewport-wrap">
        <div id="genealogy-viewport" class="genealogy-viewport" aria-label="族谱画布">
          <div id="genealogy-viewport-inner" class="genealogy-viewport-inner"></div>
        </div>
      </div>
      <div id="genealogy-detail-popover" class="genealogy-detail-popover hidden" role="dialog" aria-modal="true" aria-label="个体详情">
        <div class="genealogy-detail-popover-head">
          <span class="genealogy-detail-popover-title">个体详情</span>
          <button type="button" id="genealogy-detail-popover-close" class="genealogy-detail-popover-close" aria-label="关闭">×</button>
        </div>
        <div id="genealogy-detail-popover-body" class="genealogy-detail-popover-body"></div>
      </div>
    </section>
  `;
}
