// 多细胞 v2 — 皮肤膜、逻辑细胞群、幼体/成体阶段门控

import { hashString, mulberry32 } from '../core/hash.js';
import {
  LOGIC_CELL_TYPES,
  LOGIC_CELL_MAX_PER_TYPE,
  SKIN_CELL_CODE,
  initialLogicCellCount,
} from './logic-cell-types.js';

export const LIFE_STAGE_JUV = 'JUV';
export const LIFE_STAGE_ADT = 'ADT';

export function multicellV2Enabled(profile) {
  return profile?.multicellV2Enabled === true;
}

export function multicellV2Observer(profile) {
  return profile?.multicellV2Observer === true || multicellV2Enabled(profile);
}

function makeCellId(beingId, code, idx) {
  return `${beingId.slice(-6)}:${code}:${idx}`;
}

export function initMulticellV2(being, profile) {
  const rng = mulberry32(hashString(`${being.id}:logic-cells`));
  being.skinMembrane = {
    code: SKIN_CELL_CODE,
    integrity: 1,
    atTick: 0,
  };
  being.logicCells = {};
  for (const t of LOGIC_CELL_TYPES) {
    const n = Math.min(t.max, initialLogicCellCount(t.code, rng));
    being.logicCells[t.code] = Array.from({ length: n }, (_, i) => ({
      id: makeCellId(being.id, t.code, i),
      code: t.code,
      atTick: 0,
    }));
  }
  being.lifeStage = LIFE_STAGE_JUV;
  being.adultAtTick = null;
  being.juvFissTicks = 0;
  return being.logicCells;
}

export function resolveLifeStage(being, world, profile) {
  if (!multicellV2Enabled(profile)) return being.lifeStage ?? LIFE_STAGE_ADT;
  const juvenileTicks = profile?.juvenileTicks ?? 96;
  if (being.tickCount >= juvenileTicks) {
    if (being.lifeStage !== LIFE_STAGE_ADT) {
      being.lifeStage = LIFE_STAGE_ADT;
      being.adultAtTick = world.tick;
    }
    return LIFE_STAGE_ADT;
  }
  being.lifeStage = LIFE_STAGE_JUV;
  return LIFE_STAGE_JUV;
}

export function isJuvenile(being, profile) {
  return resolveLifeStage(being, { tick: being.tickCount ?? 0 }, profile) === LIFE_STAGE_JUV;
}

/** 幼体：减数/排出半态关闭 */
export function meiAllowedForBeing(being, world, profile) {
  if (!multicellV2Enabled(profile)) return true;
  return resolveLifeStage(being, world, profile) === LIFE_STAGE_ADT;
}

/** 幼体有丝分裂更活跃（概率加成） */
export function juvenileFissBoost(being, world, profile) {
  if (!multicellV2Enabled(profile)) return 0;
  if (resolveLifeStage(being, world, profile) !== LIFE_STAGE_JUV) return 0;
  return profile?.juvenileFissBoost ?? 0.12;
}

export function logicCellCounts(being) {
  const out = { [SKIN_CELL_CODE]: 1 };
  for (const t of LOGIC_CELL_TYPES) {
    out[t.code] = being.logicCells?.[t.code]?.length ?? 0;
  }
  return out;
}

export function totalLogicCells(being) {
  let n = 0;
  for (const cells of Object.values(being.logicCells ?? {})) {
    n += cells?.length ?? 0;
  }
  return n;
}

/** 有丝分裂成功时可增加某类逻辑细胞（MV1 骨架：优先 MOT/DIG） */
export function growLogicCellOnFiss(being, profile, rng = Math.random) {
  if (!multicellV2Enabled(profile)) return null;
  const candidates = ['LOG-MOT', 'LOG-DIG', 'LOG-NRV', 'LOG-BRN'];
  const code = candidates[Math.floor(rng() * candidates.length)];
  const cells = being.logicCells?.[code];
  if (!cells || cells.length >= LOGIC_CELL_MAX_PER_TYPE) return null;
  const cell = {
    id: makeCellId(being.id, code, cells.length),
    code,
    atTick: being.tickCount ?? 0,
  };
  cells.push(cell);
  return cell;
}

export function multicellV2Snapshot(being) {
  return {
    lifeStage: being.lifeStage ?? null,
    adultAtTick: being.adultAtTick ?? null,
    skin: being.skinMembrane ?? null,
    logicCounts: logicCellCounts(being),
    totalLogic: totalLogicCells(being),
  };
}
