/**
 * 多细胞 v2 族谱树 — 以 pairMorph A（排出方）为主干，B 为伴侣节点
 */

import { label } from './analogy.js';
import { pairMorphCn } from './observer-lexicon.js';
import { LOGIC_CELL_TYPES, SKIN_CELL_CODE, STEM_CELL_CODE, STEM_CELL_TYPE } from '../world/logic-cell-types.js';
import {
  LIFE_STAGE_GEST,
  LIFE_STAGE_JUV,
  LIFE_STAGE_ADT,
} from '../world/logic-cell-types.js';

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
  const beings = world?.beings ?? [];
  const byId = new Map(beings.map((b) => [b.id, b]));
  const roots = beings.filter((b) => b.pairMorph === 'A' || !b.pairParentA);
  const treeRoots = roots.length ? roots.filter((b) => b.pairMorph === 'A') : beings.filter((b) => b.pairMorph === 'A');
  if (!treeRoots.length) {
    treeRoots.push(...beings.filter((b) => !b.pairParentA && !b.pairParentB).slice(0, 4));
  }

  const nodes = [];
  const seen = new Set();

  function addNode(being, role = 'stem') {
    if (!being || seen.has(being.id)) return;
    seen.add(being.id);
    const partner = being.partnerId ? byId.get(being.partnerId) : null;
    const counts = being.logicCells
      ? Object.fromEntries(
          Object.entries(being.logicCells).map(([k, v]) => [k, v?.length ?? 0])
        )
      : {};
    nodes.push({
      id: being.id,
      code: being.code,
      name: being.name,
      alive: being.alive,
      generation: being.generation ?? 0,
      pairMorph: being.pairMorph ?? null,
      role,
      partnerId: being.partnerId ?? null,
      partnerTail: partner ? beingTail(partner.id) : null,
      lifeStage: being.lifeStage ?? null,
      tickCount: being.tickCount ?? 0,
      parentA: being.pairParentA ?? being.fissionParent ?? null,
      parentB: being.pairParentB ?? null,
      logicCounts: counts,
      skin: being.skinMembrane?.code ?? SKIN_CELL_CODE,
    });
    if (partner && partner.pairMorph === 'B' && !seen.has(partner.id)) {
      addNode(partner, 'mate');
    }
  }

  function walkChildren(parentAId) {
    const children = beings.filter((b) => b.pairParentA === parentAId || b.fissionParent === parentAId);
    for (const c of children) {
      addNode(c, c.pairMorph === 'B' ? 'mate' : 'child');
      walkChildren(c.id);
    }
  }

  for (const r of treeRoots) {
    addNode(r, 'stem');
    walkChildren(r.id);
  }

  for (const b of beings) {
    if (!seen.has(b.id)) addNode(b, 'other');
  }

  return { nodes, tick: world?.tick ?? 0 };
}

export function renderGenealogyTreeHTML(model, { selectedId = null } = {}) {
  const nodes = model?.nodes ?? [];
  if (!nodes.length) {
    return `<p class="genealogy-empty muted">暂无多细胞个体</p>`;
  }

  const stems = nodes.filter((n) => n.role === 'stem' || n.pairMorph === 'A');
  const cards = stems
    .map((n) => {
      const mate = nodes.find((m) => m.id === n.partnerId && m.pairMorph === 'B');
      const children = nodes.filter(
        (c) => c.parentA === n.id && c.id !== mate?.id
      );
      const sel = selectedId === n.id ? ' selected' : '';
      const dead = !n.alive ? ' dead' : '';
      return `
        <li class="genealogy-branch">
          <div class="genealogy-couple">
            <button type="button" class="genealogy-id-btn${sel}${dead}" data-being-id="${escapeHtml(n.id)}" title="${escapeHtml(n.id)}">
              <span class="genealogy-avatar">${escapeHtml(n.code)}</span>
              <span class="genealogy-id-tail">${escapeHtml(beingTail(n.id))}</span>
              <span class="genealogy-morph">${escapeHtml(pairMorphCn(n.pairMorph))}</span>
            </button>
            ${mate
              ? `<button type="button" class="genealogy-id-btn mate${selectedId === mate.id ? ' selected' : ''}${mate.alive ? '' : ' dead'}" data-being-id="${escapeHtml(mate.id)}" title="${escapeHtml(mate.id)}">
              <span class="genealogy-avatar">${escapeHtml(mate.code)}</span>
              <span class="genealogy-id-tail">${escapeHtml(beingTail(mate.id))}</span>
              <span class="genealogy-morph">${escapeHtml(pairMorphCn(mate.pairMorph))}</span>
            </button>`
              : `<span class="genealogy-mate-placeholder">无伴侣</span>`}
          </div>
          ${children.length
            ? `<ul class="genealogy-children">${children
                .map(
                  (c) =>
                    `<li><button type="button" class="genealogy-id-btn child${selectedId === c.id ? ' selected' : ''}${c.alive ? '' : ' dead'}" data-being-id="${escapeHtml(c.id)}">${escapeHtml(c.code)} · ${escapeHtml(beingTail(c.id))}</button></li>`
                )
                .join('')}</ul>`
            : ''}
        </li>`;
    })
    .join('');

  return `<ul class="genealogy-tree">${cards}</ul>`;
}

export function renderBeingDetailHTML(being) {
  if (!being) return '<p class="muted">未选择个体</p>';
  const counts = being.logicCells ?? {};
  const logicRows = [
    `<div class="stat-row"><span>${escapeHtml(STEM_CELL_TYPE.analogy)} <code>${escapeHtml(STEM_CELL_CODE)}</code></span><strong>${counts[STEM_CELL_CODE]?.length ?? 0}/${STEM_CELL_TYPE.max}</strong></div>`,
    ...LOGIC_CELL_TYPES.map((t) => {
      const n = counts[t.code]?.length ?? 0;
      return `<div class="stat-row"><span>${escapeHtml(t.analogy)} <code>${escapeHtml(t.code)}</code></span><strong>${n}/8</strong></div>`;
    }),
  ].join('');

  return `
    <div class="genealogy-detail">
      <h3 class="genealogy-detail-title">${escapeHtml(being.name)} · ${escapeHtml(being.code)}</h3>
      <p class="genealogy-detail-id"><code>${escapeHtml(being.id)}</code></p>
      <div class="stat-grid">
        <div class="stat-row"><span>存活</span><strong>${being.alive ? '是' : '否'}</strong></div>
        <div class="stat-row"><span>形态</span><strong>${escapeHtml(pairMorphCn(being.pairMorph))}</strong></div>
        <div class="stat-row"><span>发育阶段</span><strong>${escapeHtml(stageLabel(being.devStage ?? being.lifeStage))}</strong></div>
        <div class="stat-row"><span>代次</span><strong>${being.generation ?? 0}</strong></div>
        <div class="stat-row"><span>伴侣</span><strong>${escapeHtml(beingTail(being.partnerId))}</strong></div>
        <div class="stat-row"><span>皮肤膜</span><strong>${escapeHtml(being.skinMembrane?.code ?? SKIN_CELL_CODE)}</strong></div>
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
    const being = world?.beings?.find((b) => b.id === selectedId);
    detailHost.innerHTML = renderBeingDetailHTML(being);
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
