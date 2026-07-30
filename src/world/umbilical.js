// 宫内脐带 — STR-UMB 结构通道供养合胞胚胎（机制层，非地球器官名）

import { getSubCellByRole } from './organism.js';
import { multicellV2Enabled } from './multicell-v2.js';
import { noteSemDomainFromKind } from './sem-domain.js';

export const UMB_STRUCTURE_CODE = 'STR-UMB';
export const UMB_LOGIC_CODE = 'LOG-UMB';

export function umbilicalStructureOpen(being) {
  const s = being?.bodyStructures?.[UMB_STRUCTURE_CODE];
  return Boolean(s?.open);
}

export function umbilicalCellCount(being) {
  return being?.logicCells?.[UMB_LOGIC_CODE]?.length ?? 0;
}

/** 合胞成功：载体 B 挂上脐带结构（对接 draw 子域通道） */
export function initGestationalUmbilical(carrier, profile, atTick = 0) {
  if (!multicellV2Enabled(profile) || carrier.pairMorph !== 'B') return null;
  const draw = getSubCellByRole(carrier, 'draw') ?? carrier.subCells?.[0];
  carrier.bodyStructures = carrier.bodyStructures ?? {};
  carrier.bodyStructures[UMB_STRUCTURE_CODE] = {
    code: UMB_STRUCTURE_CODE,
    open: true,
    atTick,
    subCellId: draw?.id ?? null,
    subRole: draw?.role ?? 'draw',
    channelIdx: draw?.channels?.[0] ?? null,
    channels: draw?.channels ? [...draw.channels] : [],
  };
  carrier.devStage = 'GEST';
  return carrier.bodyStructures[UMB_STRUCTURE_CODE];
}

export function umbilicalFluxMult(carrier) {
  return umbilicalStructureOpen(carrier) ? 1.18 : 1;
}

export function umbilicalActive(carrier, profile) {
  return (
    multicellV2Enabled(profile) &&
    carrier?.syncyte &&
    umbilicalStructureOpen(carrier)
  );
}

/** 宫内营养通量：STR-UMB 就绪时记 [UMB]，否则由 pair-repro 记 [EMB] */
export function tickUmbilicalFlux(world, recorder, carrier, syncyte) {
  const profile = world.envProfile ?? {};
  if (!umbilicalActive(carrier, profile)) return null;

  const baseFrac = profile.embFluxFrac ?? 0.018;
  const frac = baseFrac * umbilicalFluxMult(carrier);
  const transfers = [];
  const umbN = umbilicalCellCount(carrier);
  const str = carrier.bodyStructures?.[UMB_STRUCTURE_CODE];

  for (let i = 0; i < carrier.registers.length; i++) {
    const grant = Math.min(carrier.registers[i], frac);
    if (grant <= 0.0001) continue;
    carrier.registers[i] = Math.max(0, carrier.registers[i] - grant);
    syncyte.registers[i] = Math.max(0, Math.min(1, syncyte.registers[i] + grant));
    transfers.push({ idx: i, amount: grant });
  }

  const substrate = world.substrate?.channels ?? [];
  for (let i = 0; i < carrier.registers.length; i++) {
    const floor = (substrate[i] ?? 0.4) * 0.42;
    if (carrier.registers[i] < floor) carrier.registers[i] = floor;
  }

  if (!transfers.length) return null;

  recorder.evolution(
    world.tick,
    carrier.id,
    `[UMB] flux ${transfers.length}ch ${UMB_STRUCTURE_CODE} ${str?.subCellId ?? 'sc'}`,
    {
      kind: 'UMB',
      transfers: transfers.length,
      umbCount: umbN,
      fluxMult: +umbilicalFluxMult(carrier).toFixed(3),
      gestLeft: syncyte.gestationUntilTick - world.tick,
      structure: UMB_STRUCTURE_CODE,
      subCellId: str?.subCellId ?? null,
      channelIdx: str?.channelIdx ?? null,
    }
  );
  noteSemDomainFromKind(carrier, 'UMB', world.tick);
  return transfers;
}

export function closeUmbilicalOnExpel(carrier) {
  const s = carrier?.bodyStructures?.[UMB_STRUCTURE_CODE];
  if (s) s.open = false;
}
