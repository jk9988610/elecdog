// 多细胞 v2 — 皮肤膜、发育阶段、体内 MIT/DIFF（≠ 种群 FISS）

import { hashString, mulberry32 } from '../core/hash.js';
import { getSubCellByRole } from './organism.js';
import { issueAdultHealthReport } from './health-report.js';
import { restoreAdultReproPackages } from './pair-repro.js';
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
import { initAdultMatingStructures } from './body-structures.js';
import { onSenseCellDifferentiated, SENSE_TYPES } from './senses.js';
import { initHormoneVec, hormoneActivityMult } from './hormone-system.js';
import { attachDnaExpression } from '../genetics/dna-express.js';
import { attachOrganPathway, ensureOrganPathways } from './organ-pathway.js';

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

/** 种群层观察面板 — 多细胞 v2 展示对齐后的种群统计（非单细胞 FISS/RPL 模板） */
export function populationLayerEnabled(profile) {
  return profile?.populationLayerEnabled !== false;
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
  // 排出/诞生后直接进入婴幼儿 JUV（无体外胚胎窗）；宫内发育在载体 syncyte 上
  being.devStage = LIFE_STAGE_JUV;
  being.lifeStage = LIFE_STAGE_JUV;
  being.adultAtTick = null;
  being.juvMitTicks = 0;
  being.juvDiffTicks = 0;
  being.lastMitTick = -999;
  being.lastDiffTick = -999;
  if (multicellV2Enabled(profile)) {
    attachDnaExpression(being);
    initHormoneVec(being, profile);
  }
  return being.logicCells;
}

/**
 * 发育阶段：GEST（宫内）→ JUV（排出后幼体）→ ADT（成体）
 * 不存在「体外胚胎」独立窗：胚胎在宫内完成，出生即幼体。
 */
export function resolveDevStage(being, world, profile) {
  if (!multicellV2Enabled(profile)) return being.devStage ?? LIFE_STAGE_ADT;

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
      matureAdultLogicCells(being, world, profile);
      initAdultMatingStructures(being, profile, world.tick);
      restoreAdultReproPackages(being, world, profile);
      issueAdultHealthReport(being, world.tick, world);
      if (profile?.stemFreezeAtAdult !== false) {
        freezeStemPool(being, world.tick);
      }
    }
    return LIFE_STAGE_ADT;
  }
  being.lifeStage = LIFE_STAGE_JUV;
  return LIFE_STAGE_JUV;
}

/** 成体冻结剩余 STEM 池：不再 MIT/DIFF 消耗干细胞 */
export function freezeStemPool(being, atTick = 0) {
  if (being.stemPoolFrozen) return being.stemFrozenCount ?? 0;
  being.stemPoolFrozen = true;
  being.stemFrozenAtTick = atTick;
  const stems = being.logicCells?.[STEM_CELL_CODE] ?? [];
  for (const cell of stems) cell.frozen = true;
  being.stemFrozenCount = stems.length;
  return being.stemFrozenCount;
}

export function stemPoolFrozen(being) {
  return being?.stemPoolFrozen === true;
}

/** 成体默认满格：所有可分化逻辑细胞类型拉满（观察台 8 成体开局） */
export function fillAdultLogicCellsToMax(being, world, profile, { bypassEnvGate = false } = {}) {
  if (!multicellV2Enabled(profile)) return being;
  ensureOrganPathways(being);
  const tick = being.tickCount ?? 0;
  being.logicCells = being.logicCells ?? {};
  being.logicCells[STEM_CELL_CODE] = [];

  for (const t of LOGIC_CELL_TYPES) {
    if (
      !bypassEnvGate &&
      !envAllowsLogicCode(world, profile, t.code, being)
    ) {
      continue;
    }
    const cells = ensureCellList(being, t.code);
    const max = t.max ?? LOGIC_CELL_MAX_PER_TYPE;
    while (cells.length < max) {
      const cell = {
        id: makeCellId(being.id, t.code, cells.length),
        code: t.code,
        atTick: tick,
      };
      attachOrganPathway(being, cell, t.code);
      cells.push(cell);
      if (t.code.startsWith('LOG-SEN-')) onSenseCellDifferentiated(being, t.code);
    }
  }
  freezeStemPool(being, tick);
  return being;
}

/** 成体化：消耗剩余干细胞分化生殖/激素细胞，并补足成体最低逻辑细胞 */
export function matureAdultLogicCells(being, world, profile) {
  if (!multicellV2Enabled(profile)) return being;
  ensureOrganPathways(being);
  const tick = being.tickCount ?? 0;
  const rng = mulberry32(hashString(`${being.id}:${tick}:mature-adt`));
  let guard = 48;
  while (!stemPoolFrozen(being) && guard-- > 0) {
    const stems = being.logicCells?.[STEM_CELL_CODE];
    if (!stems?.length) break;
    const diff = tryDifferentiation(being, world, profile, LIFE_STAGE_ADT, rng);
    if (!diff) break;
  }
  const minMap = profile?.adultMinLogicCells ?? {
    'LOG-GON': 2,
    'LOG-HRM': 2,
  };
  for (const [code, minN] of Object.entries(minMap)) {
    const cells = ensureCellList(being, code);
    const t = logicCellTypeByCode(code);
    const max = t?.max ?? LOGIC_CELL_MAX_PER_TYPE;
    const target = Math.min(max, minN);
    while (
      cells.length < target &&
      envAllowsLogicCode(world, profile, code, being)
    ) {
      addLogicCell(being, code, tick);
    }
  }
  return being;
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
      ? ['LOG-NTR', 'LOG-RES', 'LOG-DIG', 'LOG-NRV']
      : stage === LIFE_STAGE_JUV
        ? [
            'LOG-DIG',
            'LOG-MOT',
            'LOG-NRV',
            'LOG-SEN-TM',
            'LOG-SEN-TH',
            'LOG-SEN-GU',
            'LOG-SEN-VS',
            'LOG-SEN-AU',
            'LOG-SEN-OL',
            'LOG-BRN',
            'LOG-LNG',
          ]
        : ['LOG-GON', 'LOG-HRM'];

  const allowedSet = new Set(allowed.map((t) => t.code));
  const roleHint =
    posIdx === 0 ? 'LOG-DIG' : posIdx === 1 ? 'LOG-MOT' : 'LOG-NRV';

  const envOk = (code) =>
    envAllowsLogicCode(world, profile, code, being) &&
    (being.logicCells?.[code]?.length ?? 0) < LOGIC_CELL_MAX_PER_TYPE;

  if (stage === LIFE_STAGE_JUV && rng() < (profile?.senDiffWeight ?? 0.38)) {
    const senCodes = SENSE_TYPES.map((s) => s.code).filter((c) => allowedSet.has(c) && envOk(c));
    if (senCodes.length) {
      return senCodes[Math.floor(rng() * senCodes.length)];
    }
  }

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
  attachOrganPathway(being, cell, code);
  cells.push(cell);
  return cell;
}

function consumeStem(being) {
  if (stemPoolFrozen(being)) return null;
  const stems = being.logicCells?.[STEM_CELL_CODE];
  if (!stems?.length) return null;
  const stem = stems[stems.length - 1];
  stems.pop();
  return stem;
}

function tryStemMitosis(being, profile, rng) {
  if (stemPoolFrozen(being)) return null;
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
    return n > 0 && n < LOGIC_CELL_MAX_PER_TYPE && envAllowsLogicCode(world, profile, code, being);
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
  if (stage === LIFE_STAGE_ADT && stemPoolFrozen(being)) return null;
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

function mitHormoneMult(being) {
  const homeo = being?.dnaExpress?.homeo?.mitBias ?? 1;
  if (!being.hormoneVec) return homeo;
  const codes = Object.keys(being.logicCells ?? {}).filter(
    (c) => c !== STEM_CELL_CODE && (being.logicCells[c]?.length ?? 0) > 0
  );
  if (!codes.length) return +(hormoneActivityMult(being, STEM_CELL_CODE) * homeo).toFixed(4);
  const avg =
    codes.reduce((s, c) => s + hormoneActivityMult(being, c), 0) / codes.length;
  return +(avg * homeo).toFixed(4);
}

function adultMitEnvMult(being, world, profile) {
  if (!profile?.adultMitEnvCouple) return 1;
  const env = sampleOrganismEnv(world, profile, being);
  const air = env.airScalar ?? 0.5;
  const temp = env.tempScalar ?? 0.5;
  const sub = env.hasSubstrateField ? 1 : 0.88;
  return Math.min(1.28, Math.max(0.62, ((air + temp) / 2) * sub));
}

function mitProbability(stage, profile, boost, being, world) {
  if (stage === LIFE_STAGE_ADT) {
    const adultBase = profile?.adultMitBase ?? 0.035;
    const envMult = world ? adultMitEnvMult(being, world, profile) : 1;
    return Math.min(0.38, adultBase * mitHormoneMult(being) * envMult);
  }
  const base =
    stage === LIFE_STAGE_GEST
      ? 0.16
      : stage === LIFE_STAGE_JUV
        ? 0.11
        : 0.045;
  const raw = Math.min(0.42, base + boost);
  return Math.min(0.55, raw * mitHormoneMult(being));
}

function diffProbability(stage, profile, being, targetCode) {
  let base = 0;
  if (stage === LIFE_STAGE_GEST) base = 0.12;
  else if (stage === LIFE_STAGE_JUV) base = 0.14;
  else if (stage === LIFE_STAGE_ADT) base = 0.08;
  const homeo = being?.dnaExpress?.homeo?.diffBias ?? 1;
  base *= homeo;
  if (!targetCode || !being?.hormoneVec) return base;
  return Math.min(0.22, base * hormoneActivityMult(being, targetCode));
}

function recordEnvGateIfNeeded(world, recorder, being, profile) {
  const env = sampleOrganismEnv(world, profile, being);
  const resN = being.logicCells?.['LOG-RES']?.length ?? 0;
  if (resN > 0 && !env.hasBreathableAir) {
    recorder.evolution(
      world.tick,
      being.id,
      `[ENV-GATE] RES×${resN} need AIR scalar≥${profile.cellCoupleMinAir ?? 0.08} got ${env.airScalar}`,
      { kind: 'ENV-GATE', gate: 'AIR', code: 'LOG-RES', count: resN, env }
    );
  }
  const tmN = being.logicCells?.['LOG-SEN-TM']?.length ?? 0;
  if (tmN > 0 && !env.hasWarmthField) {
    recorder.evolution(
      world.tick,
      being.id,
      `[ENV-GATE] SEN-TM×${tmN} need TEMP got ${env.tempScalar}`,
      { kind: 'ENV-GATE', gate: 'TEMP', code: 'LOG-SEN-TM', count: tmN, env }
    );
  }
}

export function recordLogicCellSnapshot(world, recorder, being) {
  const counts = logicCellCounts(being);
  const summary = LOGIC_CELL_TYPES
    .map((t) => `${t.code}:${counts[t.code] ?? 0}`)
    .join(' ');
  const stem = counts[STEM_CELL_CODE] ?? 0;
  const env = sampleOrganismEnv(world, world.envProfile ?? {}, being);
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
        substrate: env.hasSubstrateField,
        visual: env.hasVisualField,
        auditory: env.hasAuditoryField,
        olfactory: env.hasOlfactoryField,
      },
    }
  );
}

/** 每 tick 体内发育：MIT / DIFF（≠ 种群 FISS） */
export function tickMulticellDevelopment(world, recorder, being, profile) {
  if (!multicellV2Enabled(profile) || !being.alive) return null;

  ensureOrganPathways(being);
  const stage = resolveDevStage(being, world, profile);
  resolveLifeStage(being, world, profile);
  if (
    being.lifeStage === LIFE_STAGE_ADT &&
    being.stemPoolFrozen &&
    !being.stemFrzLogged
  ) {
    recorder.evolution(
      world.tick,
      being.id,
      `[STEM-FRZ] pool ${being.stemFrozenCount ?? 0} frozen`,
      {
        kind: 'STEM-FRZ',
        stemCount: being.stemFrozenCount ?? 0,
        frozenAtTick: being.stemFrozenAtTick ?? world.tick,
      }
    );
    being.stemFrzLogged = true;
  }
  const rng = mulberry32(hashString(`${being.id}:${world.tick}:mv-dev`));
  const boost = juvenileMitBoost(being, world, profile);
  const events = [];

  const mitGap =
    stage === LIFE_STAGE_ADT
      ? profile?.adultMitIntervalTicks ?? profile?.mitIntervalTicks ?? 8
      : profile?.mitIntervalTicks ?? 6;
  if (world.tick - (being.lastMitTick ?? -999) >= mitGap) {
    const pMit = mitProbability(stage, profile, boost, being, world);
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
    const pDiff = diffProbability(stage, profile, being, null);
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
        if (diff.to.startsWith('LOG-SEN-')) {
          onSenseCellDifferentiated(being, diff.to, profile, world.tick);
        }
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

function embryoNutritionMult(syncyte) {
  const regs = syncyte?.registers ?? [];
  if (!regs.length) return 0.55;
  const avg = regs.reduce((s, v) => s + v, 0) / regs.length;
  return Math.min(1.25, Math.max(0.4, 0.35 + avg * 0.9));
}

/** 合胞成功：在 syncyte 上初始化干细胞池与 DNA 表达 */
export function initEmbryoInSyncyte(syncyte, profile, seed) {
  if (!syncyte?.dnaSeq) return null;
  const rng = mulberry32(seed);
  const embId = `emb${String(seed).slice(-8)}`;
  syncyte.logicCells = {};
  const stemN = initialStemCellCount(rng);
  syncyte.logicCells[STEM_CELL_CODE] = Array.from({ length: stemN }, (_, i) => ({
    id: makeCellId(embId, STEM_CELL_CODE, i),
    code: STEM_CELL_CODE,
    atTick: 0,
  }));
  syncyte.lastMitTick = -999;
  syncyte.lastDiffTick = -999;
  syncyte.juvMitTicks = 0;
  syncyte.juvDiffTicks = 0;
  syncyte.gestTickCount = 0;
  const embryoProxy = { id: embId, dna: { sequence: syncyte.dnaSeq } };
  attachDnaExpression(embryoProxy);
  syncyte.dnaExpress = embryoProxy.dnaExpress;
  return syncyte.logicCells;
}

/** 宫内胚胎每 tick MIT/DIFF（由母体脐带/EMB 通量供养） */
export function tickEmbryoDevelopment(world, recorder, carrier, syncyte, profile) {
  if (!multicellV2Enabled(profile) || !carrier?.alive || !syncyte) return null;
  if (!syncyte.logicCells) {
    initEmbryoInSyncyte(syncyte, profile, hashString(`${carrier.id}:${syncyte.atTick ?? 0}:emb`));
  }

  syncyte.gestTickCount = (syncyte.gestTickCount ?? 0) + 1;
  const embryo = {
    id: carrier.id,
    alive: true,
    logicCells: syncyte.logicCells,
    dnaExpress: syncyte.dnaExpress,
    hormoneVec: carrier.hormoneVec,
    tickCount: syncyte.gestTickCount,
    lastMitTick: syncyte.lastMitTick ?? -999,
    lastDiffTick: syncyte.lastDiffTick ?? -999,
    intraTick: world.tick,
    stemPoolFrozen: false,
  };

  const stage = LIFE_STAGE_GEST;
  const rng = mulberry32(hashString(`${carrier.id}:${world.tick}:emb-dev`));
  const boost = profile?.juvenileFissBoost ?? 0.12;
  const nutMult = embryoNutritionMult(syncyte);
  const events = [];

  const mitGap = profile?.mitIntervalTicks ?? 6;
  if (world.tick - embryo.lastMitTick >= mitGap) {
    const pMit = mitProbability(stage, profile, boost, embryo, world) * nutMult;
    if (rng() < pMit) {
      const mit =
        rng() < 0.72
          ? tryStemMitosis(embryo, profile, rng)
          : trySameTypeMitosis(embryo, world, profile, rng);
      if (mit) {
        embryo.lastMitTick = world.tick;
        syncyte.juvMitTicks = (syncyte.juvMitTicks ?? 0) + 1;
        recorder.evolution(
          world.tick,
          carrier.id,
          `[EMB-MIT] ${mit.code} ${mit.parentId}→${mit.daughterId}`,
          { kind: 'EMB-MIT', ...mit }
        );
        events.push({ type: 'EMB-MIT', ...mit });
      }
    }
  }

  const diffGap = profile?.diffIntervalTicks ?? 8;
  if (world.tick - embryo.lastDiffTick >= diffGap) {
    const pDiff = diffProbability(stage, profile, embryo, null) * nutMult;
    if (rng() < pDiff) {
      const diff = tryDifferentiation(embryo, world, profile, stage, rng);
      if (diff) {
        embryo.lastDiffTick = world.tick;
        syncyte.juvDiffTicks = (syncyte.juvDiffTicks ?? 0) + 1;
        const gate = envGateLabel(diff.to);
        recorder.evolution(
          world.tick,
          carrier.id,
          `[EMB-DIFF] ${diff.from}→${diff.to}${gate ? ` env:${gate}` : ''}`,
          { kind: 'EMB-DIFF', ...diff }
        );
        events.push({ type: 'EMB-DIFF', ...diff });
      }
    }
  }

  syncyte.lastMitTick = embryo.lastMitTick;
  syncyte.lastDiffTick = embryo.lastDiffTick;
  return events.length ? events : null;
}

/** 外排：将宫内 logicCells 映射到子代个体 */
export function applyEmbryoLogicToChild(child, syncyte, atTick = 0) {
  if (!child || !syncyte?.logicCells) return child;
  const prefix = child.id.slice(-6);
  child.logicCells = {};
  for (const [code, cells] of Object.entries(syncyte.logicCells)) {
    child.logicCells[code] = (cells ?? []).map((c, i) => ({
      ...c,
      id: `${prefix}:${code}:${i}`,
      code,
      atTick: c.atTick ?? atTick,
    }));
  }
  child.juvMitTicks = syncyte.juvMitTicks ?? 0;
  child.juvDiffTicks = syncyte.juvDiffTicks ?? 0;
  child.lastMitTick = syncyte.lastMitTick ?? -999;
  child.lastDiffTick = syncyte.lastDiffTick ?? -999;
  if (syncyte.dnaExpress) {
    child.dnaExpress = { ...syncyte.dnaExpress };
  }
  return child;
}

export function multicellV2Snapshot(being) {
  return {
    devStage: being.devStage ?? null,
    lifeStage: being.lifeStage ?? null,
    adultAtTick: being.adultAtTick ?? null,
    stemPoolFrozen: being.stemPoolFrozen ?? false,
    stemFrozenCount: being.stemFrozenCount ?? null,
    skin: being.skinMembrane ?? null,
    logicCounts: logicCellCounts(being),
    totalLogic: totalLogicCells(being),
    stemCount: being.logicCells?.[STEM_CELL_CODE]?.length ?? 0,
  };
}
