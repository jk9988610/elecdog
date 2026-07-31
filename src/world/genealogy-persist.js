// MV3 — 族谱持久：END 登记 + 云归档族谱快照

import { SKIN_CELL_CODE } from './logic-cell-types.js';
import { provenanceToInheritDetail } from '../genetics/genome-display.js';
import { dnaFingerprint } from '../genetics/dna-kinship.js';

export function initGenealogyRegistry(world) {
  if (!world.genealogyRegistry) world.genealogyRegistry = {};
  return world.genealogyRegistry;
}

function logicSummary(being) {
  const cells = being.logicCells ?? {};
  const out = {};
  for (const [code, list] of Object.entries(cells)) {
    const n = list?.length ?? 0;
    if (n > 0) out[code] = n;
  }
  return out;
}

/** 从活体或已 END 个体生成族谱节点（紧凑，可云归档） */
export function genealogyNodeFromBeing(being, world, patch = {}) {
  const tick = world?.tick ?? being.tickCount ?? 0;
  const inheritDetail = provenanceToInheritDetail(being?.genome?.provenance);
  return {
    id: being.id,
    code: being.code,
    name: being.name,
    familyName: being.familyName ?? null,
    givenName: being.givenName ?? null,
    lineageHeadId: being.lineageHeadId ?? being.id,
    surnameLineMorph: being.surnameLineMorph ?? null,
    bondCourtshipInitiatorMorph: being.bondCourtshipInitiatorMorph ?? null,
    alive: being.alive !== false,
    generation: being.generation ?? 0,
    pairMorph: being.pairMorph ?? null,
    partnerId: being.partnerId ?? null,
    pairParentA: being.pairParentA ?? being.fissionParent ?? null,
    pairParentB: being.pairParentB ?? null,
    fissionParent: being.fissionParent ?? null,
    lifeStage: being.lifeStage ?? null,
    devStage: being.devStage ?? null,
    tickCount: being.tickCount ?? 0,
    bornAtTick: being.bornAtTick ?? null,
    endedAtTick: being.endedAtTick ?? null,
    endReason: being.endReason ?? null,
    skin: being.skinMembrane?.code ?? SKIN_CELL_CODE,
    logicSummary: logicSummary(being),
    inheritSummary: inheritDetail?.cardShort ?? null,
    inheritDetail: inheritDetail ?? null,
    dnaSequence: being.dna?.sequence ?? null,
    dnaFp: being.dnaFp ?? dnaFingerprint(being.dna?.sequence),
    updatedAtTick: tick,
    ...patch,
  };
}

export function upsertGenealogyFromBeing(world, being, patch = {}) {
  const reg = initGenealogyRegistry(world);
  const prev = reg[being.id];
  const node = genealogyNodeFromBeing(being, world, {
    ...prev,
    ...patch,
  });
  reg[being.id] = node;
  return node;
}

/** 个体 [END] 时写入族谱登记 */
export function recordGenealogyEnd(world, being, endMeta = {}) {
  const tick = world?.tick ?? being.tickCount ?? 0;
  being.endedAtTick = tick;
  being.endReason = endMeta.reason ?? endMeta.kind ?? 'END';
  return upsertGenealogyFromBeing(world, being, {
    alive: false,
    endedAtTick: tick,
    endReason: being.endReason,
    endDetail: {
      lowStreak: endMeta.lowStreak ?? being.lowStreak ?? null,
      stressStreak: endMeta.stressStreak ?? being.stressStreak ?? null,
      stress: endMeta.stress ?? null,
      generation: endMeta.generation ?? being.generation ?? null,
    },
  });
}

/** 合并 world.beings 与登记表（登记表可保留已移除个体） */
export function genealogySourceBeings(world) {
  const reg = initGenealogyRegistry(world);
  const byId = new Map((world.beings ?? []).map((b) => [b.id, b]));
  for (const node of Object.values(reg)) {
    if (!node?.id || byId.has(node.id)) continue;
    byId.set(node.id, {
      id: node.id,
      code: node.code,
      name: node.name,
      familyName: node.familyName ?? null,
      givenName: node.givenName ?? null,
      lineageHeadId: node.lineageHeadId ?? node.id,
      surnameLineMorph: node.surnameLineMorph ?? null,
      bondCourtshipInitiatorMorph: node.bondCourtshipInitiatorMorph ?? null,
      alive: node.alive,
      generation: node.generation,
      pairMorph: node.pairMorph,
      partnerId: node.partnerId,
      pairParentA: node.pairParentA,
      pairParentB: node.pairParentB,
      fissionParent: node.fissionParent,
      lifeStage: node.lifeStage,
      devStage: node.devStage,
      tickCount: node.tickCount,
      bornAtTick: node.bornAtTick,
      endedAtTick: node.endedAtTick,
      endReason: node.endReason,
      skinMembrane: node.skin ? { code: node.skin } : null,
      inheritSummary: node.inheritSummary ?? null,
      inheritDetail: node.inheritDetail ?? null,
      dna: node.dnaSequence ? { sequence: node.dnaSequence } : null,
      dnaFp: node.dnaFp ?? null,
      logicCells: Object.fromEntries(
        Object.entries(node.logicSummary ?? {}).map(([k, n]) =>
          [k, Array.from({ length: n }, (_, i) => ({ id: `${k}:${i}`, code: k }))]
        )
      ),
      _registryOnly: true,
    });
  }
  return [...byId.values()];
}

export function buildGenealogyArchive(world) {
  const reg = initGenealogyRegistry(world);
  const nodes = Object.values(reg);
  const alive = nodes.filter((n) => n.alive).length;
  const ended = nodes.filter((n) => !n.alive).length;
  return {
    kind: 'mv-genealogy',
    tick: world?.tick ?? 0,
    worldName: world?.name ?? null,
    nodeCount: nodes.length,
    aliveCount: alive,
    endedCount: ended,
    nodes,
  };
}

export function genealogyRegistrySnapshot(world) {
  return { ...initGenealogyRegistry(world) };
}
