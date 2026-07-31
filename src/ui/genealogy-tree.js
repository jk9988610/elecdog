/**
 * 族谱树 + 个体详情弹窗
 */

import { label, formatMetProfile } from './analogy.js';
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
import { formatHormoneValueLine, buildHealthReport } from '../world/health-report.js';
import { meiAllowedForBeing, totalLogicCells } from '../world/multicell-v2.js';
import { HORMONE_KEYS } from '../world/hormone-system.js';
import { STR_LACT_OUT } from '../world/body-structures.js';
import { initGenealogyViewport } from './genealogy-viewport.js';
import { chromosomeGeneticsEnabled } from '../genetics/genome.js';
import { genomeDisplayRows, haploidDisplayRows } from '../genetics/genome-display.js';

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
      hasHealthReport: Boolean(being.dna?.sequence),
      skin: being.skinMembrane?.code ?? SKIN_CELL_CODE,
    };
  });
  return { nodes, beings, tick: world?.tick ?? 0 };
}

function morphGenderBadge(being) {
  if (being.pairMorph === 'A') {
    return '<span class="genealogy-morph genealogy-morph-a">雄</span>';
  }
  if (being.pairMorph === 'B') {
    return '<span class="genealogy-morph genealogy-morph-b">雌</span>';
  }
  return '';
}

function renderPersonCard(being, selectedId, classExtra = '') {
  if (!being) return '';
  const sel = selectedId === being.id ? ' selected' : '';
  const dead = !being.alive ? ' dead' : '';
  const badge = genealogyStageBadge(being);
  const badgeHtml = badge
    ? `<span class="${escapeHtml(badge.className)}">${escapeHtml(badge.code)}</span>`
    : '';
  const genderHtml = morphGenderBadge(being);
  const end = !being.alive ? '<span class="genealogy-end-badge">END</span>' : '';
  return `<div class="gv-person-card${sel}${dead}${classExtra}">
    <button type="button" class="genealogy-id-btn" data-being-id="${escapeHtml(being.id)}" title="${escapeHtml(being.id)}">
      <span class="genealogy-name">${escapeHtml(formatBeingDisplayName(being))}</span>
      <span class="genealogy-avatar">${escapeHtml(being.code)}</span>
      ${badgeHtml}${genderHtml}${end}
    </button>
  </div>`;
}

function nodeFromId(nodes, id) {
  return nodes.find((n) => n.id === id) ?? null;
}

function orderCouplePrimary(being, mate) {
  if (!mate) return [being, null];
  const headId = being.lineageHeadId ?? being.id;
  if (mate.id === headId) return [mate, being];
  if (being.id === headId) return [being, mate];
  if (being.pairMorph === 'A') return [being, mate];
  if (mate.pairMorph === 'A') return [mate, being];
  return [being, mate];
}

function renderTreeNode(being, byId, nodes, beings, selectedId, seen) {
  if (!being || seen.has(being.id)) return '';
  seen.add(being.id);

  const n = nodeFromId(nodes, being.id);
  if (!n) return '';

  let mate = being.partnerId ? byId.get(being.partnerId) : null;
  if (mate && seen.has(mate.id)) mate = null;
  if (mate) seen.add(mate.id);

  const [primary, secondary] = orderCouplePrimary(being, mate);
  mate = secondary;

  const parentIds = [primary.id, mate?.id].filter(Boolean);
  const children = beings.filter(
    (b) =>
      parentIds.some((pid) => b.pairParentA === pid || b.fissionParent === pid) &&
      !seen.has(b.id) &&
      !seen.has(b.id) &&
      b.id !== primary.id &&
      b.id !== mate?.id
  );

  const couple = mate
    ? `<div class="gv-couple">${renderPersonCard(primary, selectedId)}<span class="gv-couple-link" aria-hidden="true">—</span>${renderPersonCard(mate, selectedId, ' mate')}</div>`
    : `<div class="gv-couple">${renderPersonCard(primary, selectedId)}</div>`;

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
  if (being.pairMorph === 'A' && (being.lineageHeadId ?? being.id) !== being.id) return false;
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

function lactationDisplay(being) {
  const isAdultFemale =
    being?.pairMorph === 'B' &&
    (being.lifeStage === LIFE_STAGE_ADT || being.devStage === LIFE_STAGE_ADT);
  if (!isAdultFemale) {
    return { open: false, until: null, contacts: 0, lastTick: null, lactHormone: 0 };
  }
  const lactHormone = Math.max(0, Math.min(1, being.hormoneVec?.h2 ?? 0));
  return {
    open: Boolean(being.bodyStructures?.[STR_LACT_OUT]?.open),
    until: being.bodyStructures?.[STR_LACT_OUT]?.untilTick ?? null,
    contacts: being.lactContactCount ?? 0,
    lastTick: being.lastLacTick ?? null,
    lactHormone,
  };
}

function renderHormoneList(being) {
  if (!being?.hormoneVec) return '<p class="muted">无激素向量</p>';
  const labels = ['生殖', '泌乳', '代谢', '应激', '生长'];
  return HORMONE_KEYS.map((k, i) => {
    let v = Math.max(0, Math.min(1, being.hormoneVec[k] ?? 0));
    if (k === 'h2' && being.pairMorph !== 'B') v = 0;
    if (
      k === 'h2' &&
      being.pairMorph === 'B' &&
      being.lifeStage !== LIFE_STAGE_ADT &&
      being.devStage !== LIFE_STAGE_ADT
    ) {
      v = 0;
    }
    const line = formatHormoneValueLine({ key: k, value: v });
    return `<div class="stat-row hormone-list-row"><span>${labels[i] ?? k}</span><strong>${escapeHtml(line)}</strong></div>`;
  }).join('');
}

function renderHealthVitalRows(rows) {
  return rows
    .map(
      ([labelText, value]) =>
        `<div class="stat-row"><span>${escapeHtml(labelText)}</span><strong>${escapeHtml(String(value))}</strong></div>`
    )
    .join('');
}

function renderGenomeTable(rows) {
  if (!rows?.length) return '';
  const body = rows
    .map((r) => {
      const cls = r.isSexPair ? 'chr-sex-pair' : '';
      const yTag = r.sexYOnPaternal ? ' <span class="chr-y-tag">Y</span>' : '';
      return `<tr class="${cls}">
        <td class="chr-pair-label">${escapeHtml(r.label)}</td>
        <td><code>${escapeHtml(r.maternal)}</code></td>
        <td><code>${escapeHtml(r.paternal)}</code>${yTag}</td>
        <td><code>${escapeHtml(r.expressed)}</code></td>
      </tr>`;
    })
    .join('');
  return `
    <div class="chr-genome-table-wrap health-pos-table-wrap">
      <table class="chr-genome-table health-pos-table">
        <thead>
          <tr>
            <th>对</th>
            <th>母源</th>
            <th>父源</th>
            <th>表达</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function renderHaploidTable(rows, { title = '配子单倍体' } = {}) {
  if (!rows?.length) return '';
  const body = rows
    .map((r) => {
      const cls = r.isSexPair ? 'chr-sex-pair' : '';
      const yTag = r.isY ? ' <span class="chr-y-tag">Y</span>' : '';
      return `<tr class="${cls}">
        <td class="chr-pair-label">${escapeHtml(r.label)}</td>
        <td><code>${escapeHtml(r.sequence)}</code>${yTag}</td>
      </tr>`;
    })
    .join('');
  return `
    <h5 class="detail-subtitle">${escapeHtml(title)}</h5>
    <div class="chr-genome-table-wrap health-pos-table-wrap">
      <table class="chr-genome-table health-pos-table">
        <thead><tr><th>对</th><th>单倍体</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function renderChromosomeGeneticsSection(being, profile) {
  if (!chromosomeGeneticsEnabled(profile)) return '';
  const genomeRows = genomeDisplayRows(being?.genome);
  if (!genomeRows.length) return '';

  return `
    <h4 class="term">染色体二倍体</h4>
    <p class="muted chr-genome-hint">12 对 × 8 位；表达列为母源/父源按位 max；性染色体对父源 Y → 雄形态。</p>
    ${renderGenomeTable(genomeRows)}`;
}

/** 个体详情内嵌指标（实时计算，非「体检报告」快照） */
function renderBeingDetailVitalsSections(being, world, profile) {
  if (!being) return '';
  const tick = world?.tick ?? being.tickCount ?? 0;
  const adult = meiAllowedForBeing(being, world, profile ?? {});
  const snap = buildHealthReport(being, tick, {
    adult,
    world,
    stage: stageBadgeLabel(being),
  });
  const interp = snap.dnaInterpret;
  const vitals = snap.vitals ?? {};
  const nutrition = vitals.common?.nutrition ?? {};
  const sperm = vitals.sperm;
  const egg = vitals.egg;

  const nutritionRows = renderHealthVitalRows([
    ['代谢档案', formatMetProfile(nutrition.metProfile)],
    ['营养储备（寄存均值）', nutrition.registerMean != null ? `${Math.round(nutrition.registerMean * 100)}%` : '—'],
    ['场底均值', nutrition.substrateMean != null ? `${Math.round(nutrition.substrateMean * 100)}%` : '—'],
    ['能量平衡', nutrition.energyBalance != null ? nutrition.energyBalance.toFixed(3) : '—'],
    ['场压', nutrition.stress != null ? `${Math.round(nutrition.stress * 100)}%` : '—'],
    ['膜完整性', nutrition.integrity != null ? `${Math.round(nutrition.integrity * 100)}%` : '—'],
    ['低场连续', String(nutrition.lowStreak ?? 0)],
    ['高压连续', String(nutrition.stressStreak ?? 0)],
  ]);

  let reproHtml = '';
  if (sperm) {
    reproHtml += `
      <h4 class="term">精子指标</h4>
      <div class="stat-grid health-vitals-grid">
        ${renderHealthVitalRows([
          ['精子备货', sperm.stocked ? '有' : '无'],
          ['遗传载荷', String(sperm.packetLen)],
          ['精子活性', `${Math.round(sperm.activity * 100)}%`],
          ['游动性', `${Math.round(sperm.motility * 100)}%`],
          ['浓度指数', `${Math.round(sperm.concentration * 100)}%`],
          ['性腺活性倍率', sperm.gonadMult.toFixed(3)],
          ['交配通道能量', `${Math.round(sperm.channelEnergy * 100)}%`],
          ['排出结构', sperm.structureOpen ? '开放' : '关闭'],
          ['LOG-GON', String(sperm.logicGon)],
        ])}
      </div>
      ${being?.meiPacket?.haploid?.length ? renderHaploidTable(haploidDisplayRows(being.meiPacket.haploid), { title: '精子单倍体' }) : ''}`;
  }
  if (egg) {
    reproHtml += `
      <h4 class="term">卵细胞指标</h4>
      <div class="stat-grid health-vitals-grid">
        ${renderHealthVitalRows([
          ['卵细胞备货', egg.stocked ? '有' : '无'],
          ['驻留半态长度', String(egg.halfLen)],
          ['卵母细胞质量', `${Math.round(egg.oocyteQuality * 100)}%`],
          ['接受度', `${Math.round(egg.receptivity * 100)}%`],
          ['细胞活力', `${Math.round(egg.viability * 100)}%`],
          ['成熟度', `${Math.round(egg.maturity * 100)}%`],
          ['性腺活性倍率', egg.gonadMult.toFixed(3)],
          ['接受通道能量', `${Math.round(egg.channelEnergy * 100)}%`],
          ['接受结构', egg.structureOpen ? '开放' : '关闭'],
          ['孕期闭锁', egg.pregnancyClosed ? '是' : '否'],
          ['LOG-GON', String(egg.logicGon)],
        ])}
      </div>
      ${being?.dockedHalf?.haploid?.length ? renderHaploidTable(haploidDisplayRows(being.dockedHalf.haploid), { title: '卵单倍体' }) : ''}`;
  }

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

  const chromosomeHtml = renderChromosomeGeneticsSection(being, profile ?? {});

  return `
    <h4 class="term">遗传与 DNA</h4>
    <div class="stat-grid">
      <div class="stat-row"><span>DNA 指纹</span><strong><code>${escapeHtml(snap.dnaFp)}</code></strong></div>
      <div class="stat-row"><span>序列长度</span><strong>${interp?.length ?? snap.dnaSeq?.length ?? 0}</strong></div>
      <div class="stat-row"><span>代次</span><strong>${snap.generation ?? being.generation ?? 0}</strong></div>
    </div>
    <p class="detail-dna-seq"><code>${escapeHtml(interp?.sequence ?? snap.dnaSeq ?? '')}</code></p>
    ${chromosomeHtml}
    <h5 class="detail-subtitle">区段解读 Z1–Z6</h5>
    <div class="health-zones">${zoneRows}</div>
    <h4 class="term">营养与场态</h4>
    <div class="stat-grid health-vitals-grid">${nutritionRows}</div>
    ${reproHtml}`;
}

export function renderBeingDetailHTML(being, partnerBeing = null, profile = null, world = null) {
  if (!being) return '<p class="muted">未选择个体</p>';
  const tick = world?.tick ?? being.tickCount ?? 0;
  const logicRows = displayLogicRows(being)
    .map(
      (r) =>
        `<div class="stat-row"><span>${escapeHtml(r.analogy)} <code>${escapeHtml(r.code)}</code></span><strong>${r.n}/${r.max}</strong></div>`
    )
    .join('');

  const lact = lactationDisplay(being);
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

  const vitalsHtml = renderBeingDetailVitalsSections(being, world, profile);

  let embryoHtml = '';
  if (being.syncyte?.logicCells) {
    const gestLeft =
      being.syncyte.gestationUntilTick != null
        ? Math.max(0, being.syncyte.gestationUntilTick - tick)
        : null;
    const embRows = displayLogicRows({ logicCells: being.syncyte.logicCells })
      .map(
        (r) =>
          `<div class="stat-row"><span>${escapeHtml(r.analogy)} <code>${escapeHtml(r.code)}</code></span><strong>${r.n}/${r.max}</strong></div>`
      )
      .join('');
    embryoHtml = `
      <h4 class="term">宫内胚胎</h4>
      <p class="muted genealogy-embryo-hint">合胞在孕妇体内发育；营养由母体寄存器经脐带 STR-UMB / [EMB] 通量输送。</p>
      <div class="stat-grid">
        ${gestLeft != null ? `<div class="stat-row"><span>剩余妊娠 tick</span><strong>${gestLeft}</strong></div>` : ''}
        <div class="stat-row"><span>逻辑细胞总量</span><strong>${totalLogicCells({ logicCells: being.syncyte.logicCells })}</strong></div>
        <div class="stat-row"><span>宫内 MIT</span><strong>${being.syncyte.juvMitTicks ?? 0}</strong></div>
        <div class="stat-row"><span>宫内 DIFF</span><strong>${being.syncyte.juvDiffTicks ?? 0}</strong></div>
      </div>
      ${being.syncyte.genome?.pairs?.length ? `<h5 class="detail-subtitle">合子二倍体</h5>${renderGenomeTable(genomeDisplayRows(being.syncyte.genome))}` : ''}
      <div class="stat-grid">${embRows}</div>`;
  }

  const foodNote = `
    <p class="muted genealogy-food-hint">营养摄取：环境数字基底场 <code>substrate.channels</code> 经 draw 子单元按 MET_DRAW 通量抽吸至个体寄存器，非实体食物颗粒。</p>`;

  return `
    <div class="genealogy-detail">
      <h3 class="genealogy-detail-title">${escapeHtml(formatBeingDisplayName(being))} <span class="genealogy-detail-morph">${escapeHtml(pairMorphCn(being.pairMorph))}</span> <span class="genealogy-detail-badge">${escapeHtml(badge)}</span></h3>
      <p class="genealogy-detail-id"><code>${escapeHtml(being.id)}</code> · ${escapeHtml(being.code)}</p>
      ${foodNote}
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
      ${embryoHtml}
      ${vitalsHtml}
      <h4 class="term">激素与泌乳</h4>
      <div class="stat-grid hormone-list-panel">${renderHormoneList(being)}</div>
      <div class="stat-grid lact-panel">
        <div class="stat-row"><span>哺乳通道</span><strong>${lact.open ? '开放' : '关闭'}</strong></div>
        ${lact.until != null ? `<div class="stat-row"><span>哺乳至 tick</span><strong>${lact.until}</strong></div>` : ''}
        <div class="stat-row"><span>哺乳接触次数</span><strong>${lact.contacts}</strong></div>
        ${lact.lastTick != null ? `<div class="stat-row"><span>最近哺乳 tick</span><strong>${lact.lastTick}</strong></div>` : ''}
      </div>
      <h4 class="term">逻辑细胞</h4>
      <div class="stat-grid">${logicRows}</div>
    </div>
  `;
}

function positionDetailPopover(popover, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const margin = 12;
  const width = 520;
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
    innerEl.querySelectorAll('.gv-person-card').forEach((c) => c.classList.remove('selected'));
  }

  function openPopover(anchorEl, being) {
    const world = getWorld?.();
    const partner = being?.partnerId ? findBeing(world, being.partnerId) : null;
    popoverBody.innerHTML = renderBeingDetailHTML(being, partner, world?.envProfile, world);
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
        innerEl.querySelectorAll('.gv-person-card').forEach((c) => c.classList.remove('selected'));
        btn.closest('.gv-person-card')?.classList.add('selected');
        openPopover(btn, being);
      });
    });
  }

  function paint() {
    const world = getWorld?.();
    const model = buildGenealogyModel(world);
    const popoverOpen = !popover.classList.contains('hidden');
    const anchorId = popoverOpen ? selectedId : null;
    innerEl.innerHTML = renderGenealogyTreeHTML(model, { selectedId });
    bindTreeInteractions();
    if (popoverOpen && anchorId) {
      const btn = innerEl.querySelector(`.genealogy-id-btn[data-being-id="${anchorId}"]`);
      const being = findBeing(world, anchorId);
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
