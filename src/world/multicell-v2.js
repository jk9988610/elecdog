// 多细胞 v2 — 皮肤膜、发育阶段、体内 MIT/DIFF（≠ 种群 FISS）

import { hashString, mulberry32 } from '../core/hash.js';
import { getSubCellByRole } from './organism.js';
import {
  LOGIC_CELL_TYPES,
  LOGIC_CELL_MAX_PER_TYPE,
  SKIN_CELL_CODE,
  STEM_CELL_CODE,
  STEM_CELL_MAX,
  LIFE_STAGE_GEST,
  LIFE_STAGE_JUV,
  LIFE_STAGE_ADT,
  initialStemCellCount,
  typesDifferentiableInStage,
  logicCellTypeByCode,
} from './logic-cell-types.js';
import {
  envAllowsLogicCode,
  envGateLabel,
  sampleOrganismEnv,
} from './env-cell-coupling.js';

export {
  LIFE_STAGE_GEST,
  LIFE_STAGE_JUV,
  LIFE_STAGE_ADT,
} from './logic-cell-types.js';

export function multicellV2Enabled(profile) {
  return profile?.multicellV2Enabled === true;
}

export function multicellV2Observer(profile) {
  return profile?.multicellV2Observer === true || multicellV2Enabled(profile);
}

function makeCellId(beingId, code, idx) {
  return `${beingId.slice(-6)}:${code}:${idx}`;
}

function ensureCellList(being, code) {
  if (!being.logicCells) being.logicCells = {};
  if (!being.logicCells[code]) being.logicCells[code] = [];
  return being.logicCells[code];
}

export function initMulticellV2(being, profile) {
  const rng = mulberry32(hashString(`${being.id}:logic-cells`));
  being.skinMembrane = {
    code: SKIN_CELL_CODE,
    integrity: 1,
    atTick: 0,
  };
  being.logicCells = {};
  const stemN = initialStemCellCount(rng);
  being.logicCells[STEM_CELL_CODE] = Array.from({ length: stemN }, (_, i) => ({
    id: makeCellId(being.id, STEM_CELL_CODE, i),
    code: STEM_CELL_CODE,
    atTick: 0,
  }));
  // 宫内 GEST（载体合胞）；排出/诞生后直接进入婴幼儿 JUV（无体外胚胎窗）
  being.devStage = being.syncyte ? LIFE_STAGE_GEST : LIFE_STAGE_JUV;
  being.lifeStage = LIFE_STAGE_JUV;
  being.adultAtTick = null;
  being.juvMitTicks = 0;
  being.juvDiffTicks = 0;
  being.lastMitTick = -999;
  being.lastDiffTick = -999;
  return being.logicCells;
}

/**
 * 发育阶段：GEST（宫内）→ JUV（排出后幼体）→ ADT（成体）
 * 不存在「体外胚胎」独立窗：胚胎在宫内完成，出生即幼体。
 */
export function resolveDevStage(being, world, profile) {
  if (!multicellV2Enabled(profile)) return being.devStage ?? LIFE_STAGE_ADT;

  if (being.syncyte) {
    being.devStage = LIFE_STAGE_GEST;
    return LIFE_STAGE_GEST;
  }

  const juvenileTicks = profile?.juvenileTicks ?? 96;
  const tick = being.tickCount ?? 0;

  if (tick < juvenileTicks) {
    being.devStage = LIFE_STAGE_JUV;
    return LIFE_STAGE_JUV;
  }
  being.devStage = LIFE_STAGE_ADT;
  return LIFE_STAGE_ADT;
}

export function resolveLifeStage(being, world, profile) {
  if (!multicellV2Enabled(profile)) return being.lifeStage ?? LIFE_STAGE_ADT;
  resolveDevStage(being, world, profile);
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

export function meiAllowedForBeing(being, world, profile) {
  if (!multicellV2Enabled(profile)) return true;
  return resolveLifeStage(being, world, profile) === LIFE_STAGE_ADT;
}

/** 幼体体内 MIT 加成（≠ 种群 FISS） */
export function juvenileMitBoost(being, world, profile) {
  if (!multicellV2Enabled(profile)) return 0;
  const stage = resolveDevStage(being, world, profile);
  if (stage === LIFE_STAGE_GEST) {
    return profile?.juvenileFissBoost ?? 0.12;
  }
  if (stage === LIFE_STAGE_JUV) return (profile?.juvenileFissBoost ?? 0.12) * 0.65;
  return 0;
}

/** @deprecated 种群 FISS 不再随机增长逻辑细胞；保留名避免外部引用断裂 */
export function juvenileFissBoost(being, world, profile) {
  return juvenileMitBoost(being, world, profile);
}

export function growLogicCellOnFiss() {
  return null;
}

export function logicCellCounts(being) {
  const out = { [SKIN_CELL_CODE]: 1 };
  if (being.logicCells?.[STEM_CELL_CODE]?.length) {
    out[STEM_CELL_CODE] = being.logicCells[STEM_CELL_CODE].length;
  }
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

function diffPositionLabel(being) {
  const draw = getSubCellByRole(being, 'draw');
  const act = getSubCellByRole(being, 'act');
  const balance = getSubCellByRole(being, 'balance');
  const idx = (being.intraTick ?? 0) % 3;
  if (idx === 0 && draw) return `sc:${draw.id}`;
  if (idx === 1 && act) return `sc:${act.id}`;
  if (idx === 2 && balance) return `sc:${balance.id}`;
  return 'core';
}

function pickDiffTarget(being, world, profile, stage, rng) {
  const allowed = typesDifferentiableInStage(stage);
  if (!allowed.length) return null;

  const posIdx = (being.intraTick ?? 0) % 3;
  const preference =
    stage === LIFE_STAGE_GEST
      ? ['LOG-BAR', 'LOG-UMB', 'LOG-NTR', 'LOG-TRP', 'LOG-RES', 'LOG-DIG', 'LOG-NRV']
      : stage === LIFE_STAGE_JUV
        ? ['LOG-DIG', 'LOG-MOT', 'LOG-NRV', 'LOG-BRN', 'LOG-LNG', 'LOG-STR', 'LOG-CLR']
        : ['LOG-GON', 'LOG-HRM'];

  const allowedSet = new Set(allowed.map((t) => t.code));
  const roleHint =
    posIdx === 0 ? 'LOG-DIG' : posIdx === 1 ? 'LOG-MOT' : 'LOG-NRV';

  const envOk = (code) =>
    envAllowsLogicCode(world, profile, code) &&
    (being.logicCells?.[code]?.length ?? 0) < LOGIC_CELL_MAX_PER_TYPE;

  if (allowedSet.has(roleHint) && envOk(roleHint) && rng() < 0.55) {
    return roleHint;
  }

  for (const code of preference) {
    if (!allowedSet.has(code) || !envOk(code)) continue;
    return code;
  }

  const fallback = allowed.find((t) => envOk(t.code));
  return fallback?.code ?? null;
}

function addLogicCell(being, code, atTick) {
  const cells = ensureCellList(being, code);
  const t = logicCellTypeByCode(code);
  const max = t?.max ?? LOGIC_CELL_MAX_PER_TYPE;
  if (cells.length >= max) return null;
  const cell = {
    id: makeCellId(being.id, code, cells.length),
    code,
    atTick,
  };
  cells.push(cell);
  return cell;
}

function consumeStem(being) {
  const stems = being.logicCells?.[STEM_CELL_CODE];
  if (!stems?.length) return null;
  const stem = stems[stems.length - 1];
  stems.pop();
  return stem;
}

function tryStemMitosis(being, profile, rng) {
  const stems = ensureCellList(being, STEM_CELL_CODE);
  if (!stems.length || stems.length >= STEM_CELL_MAX) return null;
  const parent = stems[Math.floor(rng() * stems.length)];
  const daughter = addLogicCell(being, STEM_CELL_CODE, being.tickCount ?? 0);
  if (!daughter) return null;
  return { parentId: parent.id, daughterId: daughter.id, code: STEM_CELL_CODE, sameType: true };
}

function trySameTypeMitosis(being, world, profile, rng) {
  const codes = LOGIC_CELL_TYPES.map((t) => t.code).filter((code) => {
    const n = being.logicCells?.[code]?.length ?? 0;
    return n > 0 && n < LOGIC_CELL_MAX_PER_TYPE && envAllowsLogicCode(world, profile, code);
  });
  if (!codes.length) return null;
  const code = codes[Math.floor(rng() * codes.length)];
  const cells = being.logicCells[code];
  const parent = cells[Math.floor(rng() * cells.length)];
  const daughter = addLogicCell(being, code, being.tickCount ?? 0);
  if (!daughter) return null;
  return { parentId: parent.id, daughterId: daughter.id, code, sameType: true };
}

function tryDifferentiation(being, world, profile, stage, rng) {
  const target = pickDiffTarget(being, world, profile, stage, rng);
  if (!target) return null;
  const stem = consumeStem(being);
  if (!stem) return null;
  const cell = addLogicCell(being, target, being.tickCount ?? 0);
  if (!cell) {
    ensureCellList(being, STEM_CELL_CODE).push(stem);
    return null;
  }
  return {
    stage,
    from: STEM_CELL_CODE,
    to: target,
    stemId: stem.id,
    cellId: cell.id,
    pos: diffPositionLabel(being),
  };
}

function mitProbability(stage, profile, boost) {
  const base =
    stage === LIFE_STAGE_GEST
      ? 0.14
      : stage === LIFE_STAGE_JUV
        ? 0.07
        : 0.035;
  return Math.min(0.42, base + boost);
}

function diffProbability(stage, profile) {
  if (stage === LIFE_STAGE_GEST) return 0.12;
  if (stage === LIFE_STAGE_JUV) return 0.08;
  if (stage === LIFE_STAGE_ADT) return 0.05;
  return 0;
}

function recordEnvGateIfNeeded(world, recorder, being, profile) {
  const env = sampleOrganismEnv(world, profile);
  const resN = being.logicCells?.['LOG-RES']?.length ?? 0;
  if (resN > 0 && !env.hasBreathableAir) {
    recorder.evolution(
      world.tick,
      being.id,
      `[ENV-GATE] RES×${resN} need AIR scalar≥${profile.cellCoupleMinAir ?? 0.08} got ${env.airScalar}`,
      { kind: 'ENV-GATE', gate: 'AIR', code: 'LOG-RES', count: resN, env }
    );
  }
}

export function recordLogicCellSnapshot(world, recorder, being) {
  const counts = logicCellCounts(being);
  const summary = LOGIC_CELL_TYPES
    .map((t) => `${t.code}:${counts[t.code] ?? 0}`)
    .join(' ');
  const stem = counts[STEM_CELL_CODE] ?? 0;
  const env = sampleOrganismEnv(world, world.envProfile ?? {});
  recorder.cell(
    world.tick,
    being.id,
    `[CEL] logic STEM:${stem} ${summary}`,
    {
      kind: 'CEL-LOG',
      devStage: being.devStage,
      counts,
      totalLogic: totalLogicCells(being),
      envCoupling: {
        air: env.hasBreathableAir,
        temp: env.hasWarmthField,
        airScalar: env.airScalar,
        tempScalar: env.tempScalar,
      },
    }
  );
}

/** 每 tick 体内发育：MIT / DIFF（≠ 种群 FISS） */
export function tickMulticellDevelopment(world, recorder, being, profile) {
  if (!multicellV2Enabled(profile) || !being.alive) return null;

  const stage = resolveDevStage(being, world, profile);
  resolveLifeStage(being, world, profile);
  const rng = mulberry32(hashString(`${being.id}:${world.tick}:mv-dev`));
  const boost = juvenileMitBoost(being, world, profile);
  const events = [];

  const mitGap = profile?.mitIntervalTicks ?? 6;
  if (world.tick - (being.lastMitTick ?? -999) >= mitGap) {
    const pMit = mitProbability(stage, profile, boost);
    if (rng() < pMit) {
      const mit =
        stage === LIFE_STAGE_ADT
          ? trySameTypeMitosis(being, world, profile, rng)
          : rng() < 0.72
            ? tryStemMitosis(being, profile, rng)
            : trySameTypeMitosis(being, world, profile, rng);
      if (mit) {
        being.lastMitTick = world.tick;
        if (stage === LIFE_STAGE_JUV || stage === LIFE_STAGE_GEST) being.juvMitTicks++;
        recorder.evolution(
          world.tick,
          being.id,
          `[MIT] ${mit.code} ${mit.parentId}→${mit.daughterId}`,
          { kind: 'MIT', stage, ...mit }
        );
        events.push({ type: 'MIT', ...mit });
      }
    }
  }

  const diffGap = profile?.diffIntervalTicks ?? 8;
  if (world.tick - (being.lastDiffTick ?? -999) >= diffGap) {
    const pDiff = diffProbability(stage, profile);
    if (rng() < pDiff) {
      const diff = tryDifferentiation(being, world, profile, stage, rng);
      if (diff) {
        being.lastDiffTick = world.tick;
        being.juvDiffTicks++;
        const gate = envGateLabel(diff.to);
        recorder.evolution(
          world.tick,
          being.id,
          `[DIFF] ${diff.stage} ${diff.from}→${diff.to} ${diff.pos}${gate ? ` env:${gate}` : ''}`,
          { kind: 'DIFF', ...diff }
        );
        events.push({ type: 'DIFF', ...diff });
      }
    }
  }

  if (world.tick > 0 && world.tick % (profile?.celLogInterval ?? 32) === 0) {
    recordLogicCellSnapshot(world, recorder, being);
    recordEnvGateIfNeeded(world, recorder, being, profile);
  }

  return events.length ? events : null;
}

export function multicellV2Snapshot(being) {
  return {
    devStage: being.devStage ?? null,
    lifeStage: being.lifeStage ?? null,
    adultAtTick: being.adultAtTick ?? null,
    skin: being.skinMembrane ?? null,
    logicCounts: logicCellCounts(being),
    totalLogic: totalLogicCells(being),
    stemCount: being.logicCells?.[STEM_CELL_CODE]?.length ?? 0,
  };
}
