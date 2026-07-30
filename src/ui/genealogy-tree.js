/**
 * 多细胞 v2 族谱 — 竖向树状图：父母在上、后代在下
 */

import { label } from './analogy.js';
import { pairMorphCn } from './observer-lexicon.js';
import { SKIN_CELL_CODE } from '../world/logic-cell-types.js';
import { UMB_STRUCTURE_CODE } from '../world/umbilical.js';
import {
  STR_PAIR_IN,
  STR_PAIR_OUT,
  STR_LACT_OUT,
  STR_ING_IN,
} from '../world/body-structures.js';
import { STR_SKN, STR_ORAL, STR_VIS, STR_AUD, STR_OLF } from '../world/senses.js';
import {
  LIFE_STAGE_GEST,
  LIFE_STAGE_JUV,
  LIFE_STAGE_ADT,
} from '../world/logic-cell-types.js';
import { genealogySourceBeings } from '../world/genealogy-persist.js';
import { displayLogicRows } from '../world/logic-cell-display.js';
import { isPregnant } from '../world/courtship-gate.js';
import { kinshipLabelBetween } from '../world/kinship-gate.js';
import { HORMONE_KEYS } from '../world/hormone-system.js';

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
    return {
      id: being.id,
      code: being.code,
      name: being.name,
      alive: being.alive,
      generation: being.generation ?? 0,
      pairMorph: being.pairMorph ?? null,
      partnerId: being.partnerId ?? null,
      partnerTail: partner ? beingTail(partner.id) : null,
      lifeStage: being.lifeStage ?? null,
      devStage: being.devStage ?? null,
      tickCount: being.tickCount ?? 0,
      bornAtTick: being.bornAtTick ?? null,
      endedAtTick: being.endedAtTick ?? null,
      endReason: being.endReason ?? null,
      parentA: being.pairParentA ?? being.fissionParent ?? null,
      parentB: being.pairParentB ?? null,
      logicCounts: counts,
      pregnant: isPregnant(being),
      skin: being.skinMembrane?.code ?? SKIN_CELL_CODE,
    };
  });
  return { nodes, beings, tick: world?.tick ?? 0 };
}

function renderPersonBtn(n, selectedId, classExtra = '') {
  const sel = selectedId === n.id ? ' selected' : '';
  const dead = !n.alive ? ' dead' : '';
  const preg = n.pregnant && n.alive ? '<span class="genealogy-preg-badge">孕</span>' : '';
  const end = !n.alive ? '<span class="genealogy-end-badge">END</span>' : '';
  return `<button type="button" class="genealogy-id-btn${sel}${dead}${classExtra}" data-being-id="${escapeHtml(n.id)}" title="${escapeHtml(n.id)}">
    <span class="genealogy-avatar">${escapeHtml(n.code)}</span>
    <span class="genealogy-morph">${escapeHtml(pairMorphCn(n.pairMorph))}</span>
  ${preg}${end}
  </button>`;
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
    ? `<div class="gv-couple">${renderPersonBtn(n, selectedId)}<span class="gv-couple-link">—</span>${renderPersonBtn(nodeFromId(nodes, mate.id) ?? { ...n, id: mate.id, code: mate.code, pairMorph: mate.pairMorph, alive: mate.alive, pregnant: isPregnant(mate) }, selectedId, ' mate')}</div>`
    : `<div class="gv-couple">${renderPersonBtn(n, selectedId)}</div>`;

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

export function renderGenealogyTreeHTML(model, { selectedId = null } = {}) {
  const nodes = model?.nodes ?? [];
  const beings = model?.beings ?? [];
  if (!nodes.length) {
    return `<p class="genealogy-empty muted">暂无多细胞个体</p>`;
  }

  const byId = new Map(beings.map((b) => [b.id, b]));
  const roots = beings.filter((b) => !b.pairParentA && !b.fissionParent);
  const seen = new Set();
  const forestRoots = [];

  for (const r of roots) {
    if (r.pairMorph === 'B' && r.partnerId && roots.some((x) => x.id === r.partnerId)) {
      continue;
    }
    forestRoots.push(r);
  }

  const trees = forestRoots
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

export function renderBeingDetailHTML(being, partnerBeing = null, profile = null) {
  if (!being) return '<p class="muted">未选择个体</p>';
  const logicRows = displayLogicRows(being)
    .map(
      (r) =>
        `<div class="stat-row"><span>${escapeHtml(r.analogy)} <code>${escapeHtml(r.code)}</code></span><strong>${r.n}/${r.max}</strong></div>`
    )
    .join('');

  const lactOpen = being.bodyStructures?.[STR_LACT_OUT]?.open;
  const lactUntil = being.bodyStructures?.[STR_LACT_OUT]?.untilTick;
  const kinPartner = partnerBeing
    ? kinshipLabelBetween(being, partnerBeing, profile)
    : null;

  return `
    <div class="genealogy-detail">
      <h3 class="genealogy-detail-title">${escapeHtml(being.code)} <span class="genealogy-detail-morph">${escapeHtml(pairMorphCn(being.pairMorph))}</span></h3>
      <p class="genealogy-detail-id"><code>${escapeHtml(being.id)}</code></p>
      <div class="stat-grid">
        <div class="stat-row"><span>存活</span><strong>${being.alive ? '是' : '否'}</strong></div>
        ${!being.alive ? `<div class="stat-row"><span>END</span><strong>${escapeHtml(being.endReason ?? '—')} @t${being.endedAtTick ?? '—'}</strong></div>` : ''}
        <div class="stat-row"><span>发育阶段</span><strong>${escapeHtml(stageLabel(being.devStage ?? being.lifeStage))}</strong></div>
        ${isPregnant(being) ? '<div class="stat-row"><span>妊娠</span><strong>孕妇</strong></div>' : ''}
        <div class="stat-row"><span>代次</span><strong>${being.generation ?? 0}</strong></div>
        <div class="stat-row"><span>伴侣</span><strong>${escapeHtml(beingTail(being.partnerId))}</strong></div>
        ${being.partnerId ? `<div class="stat-row"><span>与伴侣血缘</span><strong>${escapeHtml(kinPartner ?? '—')}</strong></div>` : ''}
        ${being.healthReport?.dnaFp ? `<div class="stat-row"><span>体检 DNA 指纹</span><strong><code>${escapeHtml(being.healthReport.dnaFp)}</code></strong></div>` : ''}
        <div class="stat-row"><span>皮肤膜</span><strong>${escapeHtml(being.skinMembrane?.code ?? SKIN_CELL_CODE)}</strong></div>
        <div class="stat-row"><span>脐带结构</span><strong>${escapeHtml(
          being.bodyStructures?.[UMB_STRUCTURE_CODE]?.open ? UMB_STRUCTURE_CODE : '—'
        )}</strong></div>
        <div class="stat-row"><span>交配结构</span><strong>${escapeHtml(
          being.bodyStructures?.[STR_PAIR_OUT]?.open
            ? STR_PAIR_OUT
            : being.bodyStructures?.[STR_PAIR_IN]?.open
              ? STR_PAIR_IN
              : '—'
        )}</strong></div>
        <div class="stat-row"><span>哺乳/摄取</span><strong>${escapeHtml(
          lactOpen ? STR_LACT_OUT : being.bodyStructures?.[STR_ING_IN]?.open ? STR_ING_IN : '—'
        )}</strong></div>
        <div class="stat-row"><span>感官出口</span><strong>${escapeHtml(
          [
            being.bodyStructures?.[STR_SKN]?.open ? STR_SKN : null,
            being.bodyStructures?.[STR_ORAL]?.open ? STR_ORAL : null,
            being.bodyStructures?.[STR_VIS]?.open ? STR_VIS : null,
            being.bodyStructures?.[STR_AUD]?.open ? STR_AUD : null,
            being.bodyStructures?.[STR_OLF]?.open ? STR_OLF : null,
          ]
            .filter(Boolean)
            .join(' ') || '—'
        )}</strong></div>
      </div>
      <h4 class="term">激素与泌乳</h4>
      <p class="panel-hint muted">在族谱面板选中哺乳中的母亲个体可观察泌乳激素（h2）与哺乳通量。</p>
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

export function initGenealogyPanel(root, { getWorld, onSelect } = {}) {
  const treeHost = root.querySelector('#genealogy-tree-host');
  const detailHost = root.querySelector('#genealogy-detail-host');
  if (!treeHost || !detailHost) return null;

  let selectedId = null;

  function paint() {
    const world = getWorld?.();
    const model = buildGenealogyModel(world);
    treeHost.innerHTML = renderGenealogyTreeHTML(model, { selectedId });
    treeHost.querySelectorAll('.genealogy-id-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedId = btn.getAttribute('data-being-id');
        onSelect?.(selectedId);
        paint();
      });
    });
    const being = world?.beings?.find((b) => b.id === selectedId) ??
      genealogySourceBeings(world).find((b) => b.id === selectedId);
    const partner =
      being?.partnerId
        ? world?.beings?.find((b) => b.id === being.partnerId) ??
          genealogySourceBeings(world).find((b) => b.id === being.partnerId)
        : null;
    detailHost.innerHTML = renderBeingDetailHTML(being, partner, world?.envProfile);
  }

  return { paint, getSelectedId: () => selectedId };
}

export function renderGenealogyPanelHTML() {
  return `
    <section id="genealogy-panel" class="genealogy-panel panel">
      <h2>${escapeHtml(label('genealogyPanel'))}</h2>
      <p class="panel-hint">${escapeHtml(label('genealogyHint'))}</p>
      <div class="genealogy-layout">
        <div id="genealogy-tree-host" class="genealogy-tree-host"></div>
        <div id="genealogy-detail-host" class="genealogy-detail-host"></div>
      </div>
    </section>
  `;
}
