#!/usr/bin/env node
/**
 * MV3 — 族谱持久：END 登记 + 云归档族谱快照
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { LOW_STREAK_END } from '../src/world/viability.js';
import {
  buildGenealogyArchive,
  genealogyRegistrySnapshot,
  recordGenealogyEnd,
  applyGenealogyArchive,
  applyArchiveBeingSnapshots,
} from '../src/world/genealogy-persist.js';
import { buildGenealogyModel, renderBeingDetailHTML } from '../src/ui/genealogy-tree.js';
import { initGenealogyRegistry } from '../src/world/genealogy-persist.js';
import { pickReproEvolutionEntries } from '../src/ui/repro-evolution-stream.js';
import { mergeArchiveReproEvolution, applyObserverArchiveReplay, alignWorldTickToArchive } from '../src/cloud/field-sync.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-MV3');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();

spawnBeing(world, recorder, { name: 'a', code: '001', pairMorph: 'A' });
spawnBeing(world, recorder, { name: 'b', code: '002', pairMorph: 'B' });

assert(Object.keys(genealogyRegistrySnapshot(world)).length === 2, '诞生登记 2 节点');

const victim = world.beings.find((b) => b.code === '002');
const term = { reason: 'low_streak', lowStreak: LOW_STREAK_END };
victim.alive = false;
recordGenealogyEnd(world, victim, term);
recorder.viability(world.tick, victim.id, `[END] ${term.reason}`, { kind: 'END', ...term });

assert(!victim.alive, '个体已 END');
assert(victim.endReason != null, 'endReason 写入');
const regNode = genealogyRegistrySnapshot(world)[victim.id];
assert(regNode && !regNode.alive, '登记表标记 END');
assert(regNode.endedAtTick != null, 'endedAtTick 登记');

const archive = buildGenealogyArchive(world);
assert(archive.nodeCount === 2, `归档 2 节点（${archive.nodeCount}）`);
assert(archive.endedCount === 1, `归档 END 1（${archive.endedCount}）`);
assert(archive.kind === 'mv-genealogy', '归档 kind');

const model = buildGenealogyModel(world);
const deadNode = model.nodes.find((n) => n.id === victim.id);
assert(deadNode && !deadNode.alive, '族谱模型含 END 节点');
assert(deadNode.endReason != null, '族谱模型含 endReason');

const removedId = victim.id;
world.beings = world.beings.filter((b) => b.id !== removedId);
const modelAfter = buildGenealogyModel(world);
assert(modelAfter.nodes.some((n) => n.id === removedId && !n.alive), '移除活体后登记表仍可复盘');

const logShape = {
  world: {
    beings: [
      ...world.beings.map((b) => ({ id: b.id, alive: b.alive })),
      { id: removedId, alive: false, endReason: regNode.endReason },
    ],
  },
  genealogy: archive,
};
assert(logShape.genealogy.endedCount === 1, '云归档含族谱 END 计数');
assert(logShape.world.beings.some((b) => !b.alive), '云归档 beings 含已 END');

const reg = initGenealogyRegistry(world);
reg['reg-child'] = {
  id: 'reg-child',
  code: 'C01',
  name: 'reg-child',
  familyName: '12',
  givenName: '001',
  alive: false,
  generation: 1,
  pairMorph: 'A',
  pairParentA: 'reg-pa',
  pairParentB: 'reg-pb',
  inheritSummary: '卵6·6 精5·7 ×3',
  inheritDetail: {
    eggMat: 6,
    eggPat: 6,
    spermMat: 5,
    spermPat: 7,
    eggCross: 1,
    spermCross: 2,
    cardShort: '卵6·6 精5·7 ×3',
  },
  dnaSequence: `${'0'.repeat(48)}${'1'.repeat(48)}`,
  dnaFp: 'ABCDEF01',
  logicSummary: { 'LOG-BRN': 8 },
  endedAtTick: 10,
  endReason: 'END',
};
reg['reg-pa'] = {
  id: 'reg-pa',
  code: 'PA1',
  name: 'pa',
  familyName: '12',
  givenName: '002',
  alive: false,
  pairMorph: 'A',
  dnaSequence: `${'0'.repeat(96)}`,
  logicSummary: {},
};
reg['reg-pb'] = {
  id: 'reg-pb',
  code: 'PB1',
  name: 'pb',
  familyName: '34',
  givenName: '003',
  alive: false,
  pairMorph: 'B',
  dnaSequence: `${'2'.repeat(96)}`,
  logicSummary: {},
};
const registryChild = buildGenealogyModel(world).beings.find((b) => b.id === 'reg-child');
assert(registryChild?._registryOnly, '登记表节点标记 registryOnly');
const regDetail = renderBeingDetailHTML(registryChild, null, world.envProfile, world);
assert(regDetail.includes('减数来源登记'), '登记表详情含 inherit 登记块');
assert(regDetail.includes('卵方减数'), '登记表详情含减数统计');
assert(regDetail.includes('父母 DNA 区段相似度'), '登记表详情含父母区段相似度');
assert(regDetail.includes('·阈'), '登记表详情含区段阈值');

recorder.evolution(1, 'being-a', '[MEI] packet len 96', { kind: 'MEI' });
recorder.evolution(2, 'being-b', '[DCK] half len 96', { kind: 'DCK' });
assert(pickReproEvolutionEntries(recorder, { beingId: 'being-a' }).length === 1, '进化流可按个体筛选');
assert(pickReproEvolutionEntries(recorder).length === 2, '进化流可显示全部');
assert(pickReproEvolutionEntries(recorder, { kinds: ['MEI'] }).length === 1, '进化流仅 MEI 筛选');
assert(pickReproEvolutionEntries(recorder, { kinds: ['DCK'] }).length === 1, '进化流仅 DCK 筛选');

const wApply = createWorld('M-APPLY');
applyEnvProfile(wApply, 'multicell_v2_world');
const applyResult = applyGenealogyArchive(wApply, archive);
assert(applyResult.applied === archive.nodeCount, 'applyGenealogyArchive 合并节点');
assert(wApply.genealogyArchiveReplay?.applied === applyResult.applied, '归档复盘元数据');

const recMerge = new Recorder();
recorder.evolution(99, 'merge-a', '[MEI] merge test', { kind: 'MEI' });
const { merged } = mergeArchiveReproEvolution(recMerge, recorder.entries);
assert(merged >= 2, 'mergeArchiveReproEvolution 合并 MEI/DCK');

assert(pickReproEvolutionEntries(recorder, { tickMin: 50 }).length === 1, '进化流 tick 窗筛选');

const snapWorld = {
  tick: 50,
  beings: [
    {
      id: 'snap-1',
      code: 'S1',
      name: 'snap',
      familyName: '11',
      givenName: '001',
      lineageHeadId: 'snap-1',
      alive: false,
      generation: 1,
      pairMorph: 'A',
      pairParentA: 'pa',
      pairParentB: 'pb',
      endedAtTick: 40,
      endReason: 'END',
    },
  ],
};
const wSnap = createWorld('M-SNAP');
applyEnvProfile(wSnap, 'multicell_v2_world');
const snapResult = applyArchiveBeingSnapshots(wSnap, snapWorld);
assert(snapResult.applied === 1, 'applyArchiveBeingSnapshots');
assert(wSnap.genealogyRegistry['snap-1']?.familyName === '11', '快照写入姓');

const wReplay = createWorld('M-REPLAY');
applyEnvProfile(wReplay, 'multicell_v2_world');
const replay = applyObserverArchiveReplay(wReplay, recMerge, {
  genealogy: archive,
  world: snapWorld,
  entries: recorder.entries,
});
assert(replay.genealogy.applied === archive.nodeCount, 'applyObserverArchiveReplay 族谱');
assert(replay.beingSnapshots?.applied === 1, 'applyObserverArchiveReplay 个体快照');
assert(replay.reproEvolution.merged >= 2, 'applyObserverArchiveReplay 繁殖流');

const wTick = createWorld('M-TICK');
applyEnvProfile(wTick, 'multicell_v2_world');
wTick.tick = 5;
const tickAlign = alignWorldTickToArchive(wTick, { world: { tick: 120 }, genealogy: { tick: 120 } });
assert(tickAlign.aligned && wTick.tick === 120, 'alignWorldTickToArchive');
const replayTick = applyObserverArchiveReplay(wTick, new Recorder(), {
  genealogy: archive,
  world: { tick: 200, beings: snapWorld.beings },
  entries: [],
}, { alignTick: true });
assert(replayTick.tickAlign?.tick === 200, '复盘可选对齐 tick');

const ends = recorder.entries.filter((e) => e.meta?.kind === 'END');
assert(ends.length >= 1, `[END] 记录（${ends.length}）`);

if (failed) process.exit(1);
console.log('\n✓ MV3 族谱持久验收通过');
