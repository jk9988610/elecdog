/** 仪表盘统计 — 标签来自 CODEX 辞典 */

import { formatSubstrateState } from '../world/substrate.js';
import { formatNodesState } from '../world/nodes.js';
import { assessCellIntegrity } from '../world/cell.js';
import { compositionSnapshot } from '../world/composition.js';
import { beingLayerTransitions } from '../world/profile-stack.js';
import { beingPersonaTransitions } from '../world/persona-stack.js';
import { observerEnvHint, observerEnvLabel } from './env-select.js';
import { buildConsciousnessSummary } from './consciousness.js';
import { buildEnvStackSummary } from './env-stack.js';
import { buildSemStackSummary } from './sem-stack.js';
import { buildWlReproStackSummary } from './wl-repro-stack.js';
import { buildCarrySummary } from './carry-panel.js';
import { populationLayerEnabled, multicellV2Enabled } from '../world/multicell-v2.js';

function countEnv(entries, kind) {
  return entries.filter((e) => e.channel === 'environment' && e.meta?.kind === kind).length;
}

function beingEntryStats(entries, beingId) {
  const ext = entries.filter((e) => e.channel === 'external' && e.beingId === beingId);
  const tx = ext.filter((e) => e.content.startsWith('[TX]')).length;
  const act = ext.filter((e) => e.content.startsWith('[ACT]')).length;
  const drw = entries.filter(
    (e) => e.channel === 'metabolism' && e.beingId === beingId && e.meta?.kind === 'DRW'
  ).length;
  const low = entries.filter(
    (e) => e.channel === 'metabolism' && e.beingId === beingId && e.meta?.kind === 'LOW'
  ).length;
  const svv = entries.filter(
    (e) => e.channel === 'viability' && e.beingId === beingId && e.meta?.kind === 'SVV'
  );
  const cel = entries.filter((e) => e.channel === 'cell' && e.beingId === beingId);
  const mbr = cel.filter((e) => e.meta?.kind === 'MBR').length;
  const lastSvv = svv[svv.length - 1];
  const lastCel = cel[cel.length - 1];
  const ticks = entries.filter((e) => e.channel === 'state' && e.beingId === beingId).length;

  return {
    tx,
    act,
    extTotal: ext.length,
    extRate: ticks ? ext.length / ticks : 0,
    drw,
    low,
    stress: lastSvv?.meta?.stress ?? null,
    mbr,
    integrity: lastCel?.meta?.integrity ?? null,
  };
}

export function buildDashboardStats(world, recorder) {
  const entries = recorder.entries;
  const alive = world.beings.filter((b) => b.alive);
  const substrate = formatSubstrateState(world.substrate.channels);
  const nodes = formatNodesState(world.nodes);

  const cmpLive = compositionSnapshot(world);
  const cmps = entries.filter((e) => e.channel === 'population' && e.meta?.kind === 'CMP');
  const cmpRecorded = cmps[cmps.length - 1]?.meta ?? cmpLive;

  const slotCounts = {};
  for (const b of alive) {
    slotCounts[b.socialSlot] = (slotCounts[b.socialSlot] || 0) + 1;
  }

  const beings = alive.map((b) => {
    const es = beingEntryStats(entries, b.id);
    const integrity =
      es.integrity ?? assessCellIntegrity(b, world.substrate.channels);
    return {
      id: b.id,
      code: b.code,
      slot: b.socialSlot,
      generation: b.generation ?? 0,
      tickCount: b.tickCount ?? 0,
      bornAtTick: b.bornAtTick,
      registers: b.registers.map((v) => v.toFixed(3)),
      cellBoundary: b.cellBoundary,
      integrity,
      lowStreak: b.lowStreak,
      stressStreak: b.stressStreak,
      fissionCount: b.fissionCount ?? 0,
      organismType: b.organismType ?? 'unicell',
      devStage: b.devStage ?? null,
      lifeStage: b.lifeStage ?? null,
      pairMorph: b.pairMorph ?? null,
      rplRemaining: b.rplRemaining,
      rplMax: b.rplMax,
      rplScope: b.rplScope,
      rplTickCap: b.rplTickCap,
      renCount: b.renCount ?? 0,
      plgCount: b.plgCount ?? 0,
      renewCostCount: b.renewCostCount ?? 0,
      renewTickDebt: b.renewTickDebt ?? 0,
      meiCount: b.meiCount ?? 0,
      fusCount: b.fusCount ?? 0,
      hasMeiPacket: Boolean(b.meiPacket),
      expStage: b.expStage ?? 'E0',
      expTransitions: b.expTransitions ?? 0,
      expLoad: +(
        (b.expStress ?? 0) +
        (b.expLow ?? 0) +
        (b.expSocial ?? 0) +
        (b.expAct ?? 0)
      ).toFixed(3),
      regMode: b.regMode ?? 'SYNC',
      regTransitions: b.regTransitions ?? 0,
      regGapMean: +(b.regGapMean ?? 0).toFixed(3),
      metProfile: b.metProfile ?? 'N0',
      metTransitions: b.metTransitions ?? 0,
      metDomIdx: b.metDominantIdx ?? 0,
      coopMode: b.coopMode ?? 'S0',
      coopTransitions: b.coopTransitions ?? 0,
      socCrossRx: b.socCrossRx ?? 0,
      socContest: b.socContest ?? 0,
      layerTransitions: beingLayerTransitions(b),
      rprMode: b.rprMode ?? 'R0',
      rprOrigin: b.rprOrigin ?? 'SEED',
      rprTransitions: b.rprTransitions ?? 0,
      ehuStage: b.ehuStage ?? 'H0',
      ehuTransitions: b.ehuTransitions ?? 0,
      ehuCoherence: +(b.ehuCoherence ?? 0).toFixed(3),
      ehuDistinction: +(b.ehuDistinction ?? 0).toFixed(3),
      ehuSocialBind: +(b.ehuSocialBind ?? 0).toFixed(3),
      ehuParentStage: b.ehuParentStage ?? null,
      ehuRenCount: b.ehuRenCount ?? 0,
      ehuArc: beingLayerTransitions(b) + (b.rprTransitions ?? 0),
      personaTransitions: beingPersonaTransitions(b),
      ...es,
    };
  });

  const envId = world.envProfile?.id ?? 'baseline';
  const v2Pop = multicellV2Enabled(world.envProfile);

  return {
    world: {
      name: world.name,
      birthPlace: world.birthPlace,
      tick: world.tick,
      envId,
      envLabel: observerEnvLabel(envId),
      envHint: observerEnvHint(envId),
      fissionEnabled: Boolean(world.envProfile?.fissionEnabled),
      rplEnabled: Boolean(world.envProfile?.rplEnabled),
      multicellV2Observer: Boolean(world.envProfile?.multicellV2Observer),
      multicellV2Enabled: multicellV2Enabled(world.envProfile),
      populationLayerEnabled: populationLayerEnabled(world.envProfile),
    },
    environment: {
      substrate,
      nodes,
      amb: countEnv(entries, 'AMB'),
      ptb: countEnv(entries, 'PTB'),
      res: countEnv(entries, 'RES'),
      shk: countEnv(entries, 'SHK'),
      npl: countEnv(entries, 'NPL'),
      bio: countEnv(entries, 'BIO'),
      dep: entries.filter((e) => e.meta?.kind === 'DEP').length,
      tgt: countEnv(entries, 'TGT'),
    },
    population: {
      alive: alive.length,
      total: world.beings.length,
      ended: entries.filter((e) => e.meta?.kind === 'END').length,
      lineage: entries.filter((e) => e.content?.includes('[LINEAGE]')).length,
      fission: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FISS').length,
      rpl: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'RPL').length,
      rplExhausted: entries.filter((e) => e.meta?.kind === 'RPL' && e.meta?.phase === 'exhausted').length,
      ren: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'REN').length,
      plg: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'PLG').length,
      rco: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'RCO').length,
      mei: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'MEI').length,
      fus: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'FUS').length,
      bcn: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'BCN').length,
      exp: entries.filter(
        (e) =>
          (e.channel === 'experience' && e.meta?.kind === 'EXP') ||
          (e.channel === 'evolution' && e.meta?.kind === 'EXP')
      ).length,
      reg: entries.filter(
        (e) =>
          (e.channel === 'register' && e.meta?.kind === 'REG') ||
          (e.channel === 'evolution' && e.meta?.kind === 'REG')
      ).length,
      mtb: entries.filter(
        (e) =>
          (e.channel === 'metabolism' && e.meta?.kind === 'MTB') ||
          (e.channel === 'evolution' && e.meta?.kind === 'MTB')
      ).length,
      coop: entries.filter(
        (e) =>
          (e.channel === 'social' && e.meta?.kind === 'COOP') ||
          (e.channel === 'evolution' && e.meta?.kind === 'COOP')
      ).length,
      lay:
        entries.filter(
          (e) =>
            (e.channel === 'experience' && e.meta?.kind === 'EXP') ||
            (e.channel === 'evolution' && e.meta?.kind === 'EXP')
        ).length +
        entries.filter(
          (e) =>
            (e.channel === 'register' && e.meta?.kind === 'REG') ||
            (e.channel === 'evolution' && e.meta?.kind === 'REG')
        ).length +
        entries.filter(
          (e) =>
            (e.channel === 'metabolism' && e.meta?.kind === 'MTB') ||
            (e.channel === 'evolution' && e.meta?.kind === 'MTB')
        ).length +
        entries.filter(
          (e) =>
            (e.channel === 'social' && e.meta?.kind === 'COOP') ||
            (e.channel === 'evolution' && e.meta?.kind === 'COOP')
        ).length,
      rpr: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'RPR').length,
      ehu: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EHU').length,
      ehuLin: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EHU-LIN').length,
      ehuRen: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EHU-REN').length,
      selection: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'SEL').length,
      contest: entries.filter((e) => e.meta?.kind === 'CONTEST').length,
      cmp: cmpRecorded,
      slots: slotCounts,
      bond: entries.filter((e) => e.meta?.kind === 'BOND').length,
      prq: entries.filter((e) => e.meta?.kind === 'PRQ').length,
      pgr: entries.filter((e) => e.meta?.kind === 'PGR').length,
      fusIn: entries.filter((e) => e.meta?.kind === 'FUS-IN').length,
      pairExp: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EXP').length,
      pregnant: alive.filter((b) => b.syncyte).length,
      partnered: alive.filter((b) => b.partnerId).length,
      multicellPop: v2Pop,
    },
    beings,
    consciousness: buildConsciousnessSummary(beings, world, {
      ehu: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EHU').length,
      ehuLin: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EHU-LIN').length,
      ehuRen: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'EHU-REN').length,
    }),
    envStack: buildEnvStackSummary(world, recorder),
    semStack: buildSemStackSummary(world, recorder),
    wlReproStack: buildWlReproStackSummary(world, recorder),
    carry: buildCarrySummary(world),
  };
}
