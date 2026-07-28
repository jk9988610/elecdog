/** 仪表盘统计 — 标签来自 CODEX 辞典 */

import { formatSubstrateState } from '../world/substrate.js';
import { formatNodesState } from '../world/nodes.js';
import { assessCellIntegrity } from '../world/cell.js';
import { compositionSnapshot } from '../world/composition.js';

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
      registers: b.registers.map((v) => v.toFixed(3)),
      cellBoundary: b.cellBoundary,
      integrity,
      lowStreak: b.lowStreak,
      stressStreak: b.stressStreak,
      ...es,
    };
  });

  return {
    world: {
      name: world.name,
      birthPlace: world.birthPlace,
      tick: world.tick,
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
      selection: entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'SEL').length,
      contest: entries.filter((e) => e.meta?.kind === 'CONTEST').length,
      cmp: cmpRecorded,
      slots: slotCounts,
    },
    beings,
  };
}
