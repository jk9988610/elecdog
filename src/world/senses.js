// 五感 — LOG-SEN-* 逻辑细胞、STR 体表出口、[SEN] 观察通道

import { getSubCellByRole } from './organism.js';
import { multicellV2Enabled } from './multicell-v2.js';
import {
  envAllowsLogicCode,
  sampleOrganismEnv,
  senseRuntimeActive,
} from './env-cell-coupling.js';
import { noteSemDomainFromKind } from './sem-domain.js';

export const STR_SKN = 'STR-SKN';
export const STR_ORAL = 'STR-ORAL';
export const STR_VIS = 'STR-VIS';
export const STR_AUD = 'STR-AUD';
export const STR_OLF = 'STR-OLF';

/** @type {Array<{ code: string; kind: string; structure: string; subRole: string }>} */
export const SENSE_TYPES = [
  { code: 'LOG-SEN-TH', kind: 'th', structure: STR_SKN, subRole: 'balance' },
  { code: 'LOG-SEN-TM', kind: 'tm', structure: STR_SKN, subRole: 'balance' },
  { code: 'LOG-SEN-GU', kind: 'gu', structure: STR_ORAL, subRole: 'draw' },
  { code: 'LOG-SEN-VS', kind: 'vs', structure: STR_VIS, subRole: 'act' },
  { code: 'LOG-SEN-AU', kind: 'au', structure: STR_AUD, subRole: 'balance' },
  { code: 'LOG-SEN-OL', kind: 'ol', structure: STR_OLF, subRole: 'draw' },
];

export function senseTypeByCode(code) {
  return SENSE_TYPES.find((s) => s.code === code) ?? null;
}

function bindSubCell(being, subRole) {
  return getSubCellByRole(being, subRole) ?? being.subCells?.[0];
}

/** 分化出感官细胞或每 tick 确保体表出口已挂接 */
export function ensureSenseStructure(being, cfg, profile, atTick = 0) {
  if (!multicellV2Enabled(profile) || !cfg) return null;
  being.bodyStructures = being.bodyStructures ?? {};
  const existing = being.bodyStructures[cfg.structure];
  if (existing?.open) {
    if (!existing.senseKinds?.includes(cfg.kind)) {
      existing.senseKinds = [...(existing.senseKinds ?? []), cfg.kind];
    }
    return existing;
  }
  const sub = bindSubCell(being, cfg.subRole);
  const st = {
    code: cfg.structure,
    open: true,
    atTick,
    senseKinds: [cfg.kind],
    subCellId: sub?.id ?? null,
    subRole: sub?.role ?? cfg.subRole,
    channels: sub?.channels ? [...sub.channels] : [],
  };
  being.bodyStructures[cfg.structure] = st;
  return st;
}

export function ensureAllSenseStructures(being, profile, atTick = 0) {
  const opened = [];
  for (const cfg of SENSE_TYPES) {
    const n = being.logicCells?.[cfg.code]?.length ?? 0;
    if (n > 0) {
      const st = ensureSenseStructure(being, cfg, profile, atTick);
      if (st) opened.push(cfg.kind);
    }
  }
  return opened.length ? opened : null;
}

export function onSenseCellDifferentiated(being, code, profile, atTick = 0) {
  const cfg = senseTypeByCode(code);
  if (!cfg) return null;
  return ensureSenseStructure(being, cfg, profile, atTick);
}

function senseLoad(cfg, env, hints) {
  switch (cfg.kind) {
    case 'th':
      return hints.hadExternal
        ? 0.25 + (hints.hadAct ? 0.35 : 0) + (hints.contestHit ? 0.2 : 0)
        : 0;
    case 'tm':
      return env.tempScalar ?? 0;
    case 'gu':
      return hints.hadDraw ? env.substrateAvg * 0.85 : env.substrateAvg * 0.35;
    case 'vs':
      return Math.min(1, (env.effectiveSolar ?? 0) * 0.7 + (env.hasVisualField ? 0.15 : 0));
    case 'au':
      return Math.min(1, (hints.heardCount ?? 0) * 0.28 + (hints.fieldTxCount ?? 0) * 0.12);
    case 'ol':
      const symN = hints.symModuleCount ?? 0;
      return Math.min(1, env.substrateAvg * 0.55 + symN * 0.08);
    default:
      return 0;
  }
}

/** 每 tick 感官采样 → [SEN]（环境场门控） */
export function tickSenses(world, recorder, being, profile, hints = {}) {
  if (!multicellV2Enabled(profile) || !being.alive) return null;

  ensureAllSenseStructures(being, profile, world.tick);
  const env = sampleOrganismEnv(world, profile, being);
  const minLoad = profile.senMinLoad ?? 0.06;
  const interval = profile.senLogInterval ?? 16;
  const forceLog = world.tick > 0 && world.tick % interval === 0;
  const events = [];

  for (const cfg of SENSE_TYPES) {
    const count = being.logicCells?.[cfg.code]?.length ?? 0;
    if (!count) continue;

    const runtimeOk = senseRuntimeActive(cfg.code, env, hints, profile);
    if (!runtimeOk) continue;

    const load = +senseLoad(cfg, env, hints).toFixed(4);
    if (load < minLoad && !forceLog) continue;

    recorder.evolution(
      world.tick,
      being.id,
      `[SEN] kind:${cfg.kind} load ${load} cells×${count}`,
      {
        kind: 'SEN',
        sense: cfg.kind,
        code: cfg.code,
        load,
        cellCount: count,
        structure: cfg.structure,
        envGate: true,
      }
    );
    events.push({ sense: cfg.kind, load, count });
  }

  if (!events.length) return null;
  noteSemDomainFromKind(being, 'SEN', world.tick);
  return events;
}
