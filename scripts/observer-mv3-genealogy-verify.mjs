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
} from '../src/world/genealogy-persist.js';
import { buildGenealogyModel } from '../src/ui/genealogy-tree.js';

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

const ends = recorder.entries.filter((e) => e.meta?.kind === 'END');
assert(ends.length >= 1, `[END] 记录（${ends.length}）`);

if (failed) process.exit(1);
console.log('\n✓ MV3 族谱持久验收通过');
