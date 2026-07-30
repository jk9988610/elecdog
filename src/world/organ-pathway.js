// MV2 — 分化逻辑细胞 ↔ subCell / TX / ACT / PAIR 器官通路

import { getSubCellByRole } from './organism.js';
import { multicellV2Enabled } from './multicell-v2.js';
import { logicCellTypeByCode } from './logic-cell-types.js';

/** 逻辑细胞类型 → 通路锚点（机制层，非地球器官名） */
export const PATHWAY_RULES = {
  'LOG-DIG': { pathway: 'draw', subRole: 'draw' },
  'LOG-ING': { pathway: 'draw', subRole: 'draw' },
  'LOG-NTR': { pathway: 'draw', subRole: 'draw' },
  'LOG-UMB': { pathway: 'draw', subRole: 'draw' },
  'LOG-RES': { pathway: 'draw', subRole: 'draw' },
  'LOG-MOT': { pathway: 'act', subRole: 'act' },
  'LOG-SIG-TX': { pathway: 'tx', subRole: 'act' },
  'LOG-GON': { pathway: 'pair', subRole: 'act' },
  'LOG-NRV': { pathway: 'balance', subRole: 'balance' },
  'LOG-BRN': { pathway: 'balance', subRole: 'balance' },
  'LOG-STR': { pathway: 'balance', subRole: 'balance' },
  'LOG-CLR': { pathway: 'balance', subRole: 'balance' },
  'LOG-TRP': { pathway: 'balance', subRole: 'balance' },
  'LOG-BAR': { pathway: 'balance', subRole: 'balance' },
  'LOG-HRM': { pathway: 'balance', subRole: 'balance' },
  'LOG-LNG': { pathway: 'tx', subRole: 'balance' },
  'LOG-SIG-RX': { pathway: 'rx', subRole: 'draw' },
  'LOG-SEN-TH': { pathway: 'sense', subRole: 'balance' },
  'LOG-SEN-TM': { pathway: 'sense', subRole: 'balance' },
  'LOG-SEN-GU': { pathway: 'sense', subRole: 'draw' },
  'LOG-SEN-VS': { pathway: 'sense', subRole: 'balance' },
  'LOG-SEN-AU': { pathway: 'sense', subRole: 'balance' },
  'LOG-SEN-OL': { pathway: 'sense', subRole: 'draw' },
};

const SENSE_CODES = Object.keys(PATHWAY_RULES).filter((c) => c.startsWith('LOG-SEN-'));

export function pathwayRuleForCode(code) {
  if (PATHWAY_RULES[code]) return PATHWAY_RULES[code];
  const t = logicCellTypeByCode(code);
  if (!t?.roles?.length) return null;
  const role = t.roles[0];
  if (role === 'draw' || role === 'act') {
    return { pathway: role, subRole: role };
  }
  if (role === 'sense') return { pathway: 'sense', subRole: 'balance' };
  if (role === 'tx' || role === 'speech') return { pathway: 'tx', subRole: 'balance' };
  if (role === 'repro' || role === 'half-state') return { pathway: 'pair', subRole: 'act' };
  return { pathway: 'balance', subRole: 'balance' };
}

export function attachOrganPathway(being, cell, code) {
  const rule = pathwayRuleForCode(code);
  if (!rule) return cell;
  cell.pathway = rule.pathway;
  if (rule.subRole) {
    const sub = getSubCellByRole(being, rule.subRole);
    cell.subRole = rule.subRole;
    cell.subCellId = sub?.id ?? null;
  }
  return cell;
}

/** 补挂已有分化细胞（载入/旧存档） */
export function ensureOrganPathways(being) {
  if (!being.logicCells) return;
  for (const [code, cells] of Object.entries(being.logicCells)) {
    if (!cells?.length || code === 'STEM') continue;
    for (const cell of cells) {
      if (!cell.pathway) attachOrganPathway(being, cell, code);
    }
  }
}

function countPathwayCells(being, pathway) {
  let n = 0;
  for (const cells of Object.values(being.logicCells ?? {})) {
    for (const cell of cells ?? []) {
      if (cell.pathway === pathway) n++;
    }
  }
  return n;
}

export function organPathwaySummary(being) {
  const out = { draw: 0, act: 0, balance: 0, tx: 0, rx: 0, pair: 0, sense: 0 };
  for (const cells of Object.values(being.logicCells ?? {})) {
    for (const cell of cells ?? []) {
      const p = cell.pathway;
      if (p && out[p] != null) out[p]++;
    }
  }
  return out;
}

/** 并入 experienceBias：LOG-MOT 抬 ACT、LOG-LNG/SIG-TX 抬 TX */
export function organPathwayExperienceBias(being, profile) {
  if (!multicellV2Enabled(profile)) return null;
  ensureOrganPathways(being);
  const motN = countPathwayCells(being, 'act');
  const txN = countPathwayCells(being, 'tx');
  const rxN = countPathwayCells(being, 'rx');
  if (!motN && !txN && !rxN) return null;
  return {
    actBoost: Math.min(0.18, motN * (profile?.pathActBoostPerCell ?? 0.045)),
    txBoost: Math.min(0.2, txN * (profile?.pathTxBoostPerCell ?? 0.05)),
    pathRxN: rxN,
  };
}

export function recordOrganPathwayTick(world, recorder, being, profile) {
  if (!multicellV2Enabled(profile)) return null;
  const interval = profile?.pathLogInterval ?? 48;
  if (world.tick % interval !== 0 || world.tick === 0) return null;

  ensureOrganPathways(being);
  const summary = organPathwaySummary(being);
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  if (!total) return null;

  const pairStruct =
    being.bodyStructures?.['STR-PAIR-OUT']?.subCellId ??
    being.bodyStructures?.['STR-PAIR-IN']?.subCellId ??
    null;

  recorder.evolution(
    world.tick,
    being.id,
    `[PATH] draw:${summary.draw} act:${summary.act} tx:${summary.tx} pair:${summary.pair} sense:${summary.sense}`,
    {
      kind: 'PATH',
      summary,
      pairStructSubCell: pairStruct,
      devStage: being.devStage ?? null,
    }
  );
  return summary;
}

export function logicCellsOnSubRole(being, subRole) {
  const out = [];
  for (const cells of Object.values(being.logicCells ?? {})) {
    for (const cell of cells ?? []) {
      if (cell.subRole === subRole) out.push(cell);
    }
  }
  return out;
}

export { SENSE_CODES };
