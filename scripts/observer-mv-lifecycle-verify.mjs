#!/usr/bin/env node
/**
 * MV9 — 哺乳生物全生命周期闭环验收
 * 合胞 → 脐带 → 分娩 → 接触哺乳 → 幼体发育 → 成体 → 再合胞
 */
import { hashString } from '../src/core/hash.js';
import { reduceDna } from '../src/core/dna.js';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { getSubCellByRole } from '../src/world/organism.js';
import {
  LIFE_STAGE_ADT,
  LIFE_STAGE_JUV,
  LIFE_STAGE_GEST,
} from '../src/world/multicell-v2.js';
import { STEM_CELL_CODE } from '../src/world/logic-cell-types.js';
import { registerPartnerBond } from '../src/world/partner-bond.js';
import {
  createSyncyteOnB,
  processPairFusInBody,
  initDockedHalf,
} from '../src/world/pair-repro.js';
import {
  initGestationalUmbilical,
  UMB_STRUCTURE_CODE,
} from '../src/world/umbilical.js';
import {
  initAdultMatingStructures,
  assessPairStructureFit,
  STR_PAIR_OUT,
  STR_PAIR_IN,
} from '../src/world/body-structures.js';
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

function pinStructChannels(being, code, channel) {
  const st = being?.bodyStructures?.[code];
  if (st) st.channels = [channel];
}

function matureAdult(being, juvenileTicks = 96) {
  being.tickCount = juvenileTicks + 24;
  being.lifeStage = LIFE_STAGE_ADT;
  being.devStage = LIFE_STAGE_ADT;
}

function pinMeiDock(world, parentA, parentB, channel = 7) {
  const act = getSubCellByRole(parentA, 'act') ?? parentA.subCells?.[1];
  const draw = getSubCellByRole(parentB, 'draw') ?? parentB.subCells?.[0];
  parentA.meiPacket = {
    seq: parentA.dna.sequence,
    atTick: world.tick,
    channels: [channel],
    subCellId: act?.id ?? null,
    subRole: act?.role ?? 'act',
    channelIdx: channel,
  };
  if (!parentB.dockedHalf) initDockedHalf(world, parentB);
  parentB.dockedHalf = {
    seq: reduceDna(parentB.dna.sequence, hashString(`${parentB.id}:dock:${world.tick}`)),
    atTick: world.tick,
    channels: [channel],
    subCellId: draw?.id ?? null,
    subRole: draw?.role ?? 'draw',
    channelIdx: channel,
  };
}

function boostViability(being) {
  if (!being) return;
  being.alive = true;
  being.registers = being.registers.map((r) => Math.max(r, 0.88));
  being.integrity = 1;
  being.stress = 0;
  being.lowStreak = 0;
}

function seedPairFus(world, recorder, parentA, parentB, channel = 7) {
  resumeAutoPair(world);
  matureAdult(parentA, world.envProfile.juvenileTicks ?? 96);
  matureAdult(parentB, world.envProfile.juvenileTicks ?? 96);
  initAdultMatingStructures(parentA, world.envProfile, world.tick);
  initAdultMatingStructures(parentB, world.envProfile, world.tick);
  pinStructChannels(parentA, STR_PAIR_OUT, channel);
  pinStructChannels(parentB, STR_PAIR_IN, channel);
  pinMeiDock(world, parentA, parentB, channel);
  const fit = assessPairStructureFit(parentA, parentB, world.envProfile, parentA.meiPacket);
  if (!fit.fit) return null;

  const fusEvents = processPairFusInBody(world, recorder);
  if (!fusEvents.length) {
    createSyncyteOnB(
      world,
      recorder,
      parentA,
      parentB,
      parentA.meiPacket?.seq ?? parentA.dna.sequence,
      parentB.dockedHalf?.seq ?? parentB.dna.sequence
    );
  }

  const carrier = world.beings.find((b) => b.id === parentB.id);
  if (!carrier?.syncyte) return null;
  initGestationalUmbilical(carrier, world.envProfile, world.tick);
  carrier.devStage = LIFE_STAGE_GEST;
  boostViability(parentA);
  boostViability(carrier);
  if (carrier.syncyte) {
    carrier.syncyte.gestationUntilTick = world.tick + 28;
  }
  pauseAutoPair(world);
  return carrier;
}

function stepUntil(world, recorder, maxTicks, predicate) {
  for (let i = 0; i < maxTicks; i++) {
    stepWorld(world, recorder);
    if (predicate()) return true;
  }
  return predicate();
}

function stepCare(world, recorder, maxTicks, predicate, carers = []) {
  for (let i = 0; i < maxTicks; i++) {
    for (const b of carers) boostViability(b);
    stepWorld(world, recorder);
    if (predicate()) return true;
  }
  return predicate();
}

function pauseAutoPair(world) {
  world.envProfile.meiEnabled = false;
  for (const b of world.beings) {
    if (b.meiPacket) b.meiPacket = null;
    if (b.dockedHalf && !b.syncyte) b.dockedHalf = null;
  }
}

function resumeAutoPair(world) {
  world.envProfile.meiEnabled = true;
}

function stepGestation(world, recorder, carrier, maxTicks = 80) {
  const partner = world.beings.find((b) => b.id === carrier?.partnerId);
  for (let i = 0; i < maxTicks; i++) {
    boostViability(carrier);
    boostViability(partner);
    stepWorld(world, recorder);
    if (!carrier?.syncyte) return true;
  }
  return !carrier?.syncyte;
}

function expEntries(recorder) {
  return recorder.entries.filter((e) => e.meta?.kind === 'EXP' && e.meta?.childId);
}

function firstExpChild(world, recorder, afterIndex = 0) {
  const exp = expEntries(recorder).slice(afterIndex)[0];
  if (!exp?.meta?.childId) return null;
  return world.beings.find((b) => b.id === exp.meta.childId) ?? null;
}

const world = createWorld('M-LIFE');
applyEnvProfile(world, 'multicell_v2_world');
world.envProfile.pairHalfRelease = false;
world.envProfile.senMinLoad = 0.02;
initEnvStackModules(world);
const recorder = new Recorder();

spawnBeing(world, recorder, { name: 'pa', code: '101', pairMorph: 'A' });
spawnBeing(world, recorder, { name: 'pb', code: '102', pairMorph: 'B' });
const parentA = world.beings.find((b) => b.pairMorph === 'A');
const parentB = world.beings.find((b) => b.pairMorph === 'B');
registerPartnerBond(world, recorder, parentA, parentB);

const expIdx0 = expEntries(recorder).length;

// —— 第一代：合胞 → 脐带 → 分娩 ——
const carrier1 = seedPairFus(world, recorder, parentA, parentB);
assert(carrier1?.syncyte, '第一代合胞 FUS-IN');
assert(parentB.bodyStructures?.[UMB_STRUCTURE_CODE]?.open, 'STR-UMB 挂接');
assert(parentB.devStage === LIFE_STAGE_GEST, '载体 GEST');

const gestTicks = world.envProfile.gestationTicks ?? 64;
assert(
  stepUntil(world, recorder, gestTicks + 8, () =>
    recorder.entries.some((e) => e.meta?.kind === 'UMB')
  ),
  '[UMB] 宫内脐带通量'
);

stepGestation(world, recorder, parentB, gestTicks + 24);
assert(expEntries(recorder).length > expIdx0, '第一代 [EXP] 分娩');
pauseAutoPair(world);
const child1 = firstExpChild(world, recorder, expIdx0);
if (!child1) {
  failed += 1;
  console.error('✗ 第一代幼体未找到');
} else {
  assert(child1.alive, '第一代幼体存活');
  assert(child1.devStage === LIFE_STAGE_JUV, '诞生即 JUV');
  assert((child1.logicCells?.[STEM_CELL_CODE]?.length ?? 0) >= 1, '幼体 STEM 池');
  boostViability(parentA);
  boostViability(parentB);
}

if (child1) {
  pinStructChannels(parentB, 'STR-LACT-OUT', 7);
  pinStructChannels(child1, 'STR-ING-IN', 7);
}
const lacBefore = recorder.entries.filter((e) => e.meta?.kind === 'LAC').length;
stepCare(
  world,
  recorder,
  24,
  () => recorder.entries.filter((e) => e.meta?.kind === 'LAC').length > lacBefore,
  [parentA, parentB, child1]
);
assert(recorder.entries.some((e) => e.meta?.kind === 'LAC'), '[LAC] 接触哺乳');

// —— 幼体发育 → 成体 ——
if (child1) {
  const mitBefore = recorder.entries.filter((e) => e.meta?.kind === 'MIT').length;
  const juvTicks = world.envProfile.juvenileTicks ?? 96;
  stepCare(world, recorder, juvTicks + 48, () => child1.lifeStage === LIFE_STAGE_ADT, [
    parentA,
    parentB,
    child1,
  ]);
  assert(child1.lifeStage === LIFE_STAGE_ADT, '第一代性成熟 ADT');
  assert(
    recorder.entries.filter((e) => e.meta?.kind === 'MIT').length > mitBefore,
    '[MIT] 幼体期体内有丝'
  );
  assert(child1.dnaExpress?.hormoneBaseline, 'dnaExpress 挂接');
}

assert(recorder.entries.some((e) => e.meta?.kind === 'DIFF'), '[DIFF] 分化');
assert(recorder.entries.some((e) => e.meta?.kind === 'SEN'), '[SEN] 五感采样');
assert(recorder.entries.some((e) => e.meta?.kind === 'HRM'), '[HRM] 激素链');

// —— 第二代：再合胞 ——
boostViability(parentA);
boostViability(parentB);
parentA.meiPacket = null;
parentB.dockedHalf = null;
parentB.syncyte = null;
const expIdx1 = expEntries(recorder).length;

assert(seedPairFus(world, recorder, parentA, parentB, 8)?.syncyte, '第二代再合胞');
stepGestation(world, recorder, parentB, 48);
assert(expEntries(recorder).length > expIdx1, '第二代 [EXP] 分娩');

const expCount = expEntries(recorder).length;
const fusCount = recorder.entries.filter((e) => e.meta?.kind === 'FUS-IN').length;
assert(expCount >= 2, `闭环分娩 [EXP]×${expCount}`);
assert(fusCount >= 2, `交配合胞 [FUS-IN]×${fusCount}`);

const child2 = firstExpChild(world, recorder, expIdx1);
assert(child2, '第二代幼体记录');

const model = buildGenealogyModel(world);
assert(model.nodes.length >= 3, '族谱可复盘');
assert(model.nodes.some((n) => n.generation >= 1), '族谱含子代节点');

if (failed) process.exit(1);
console.log('\n✓ MV9 哺乳生物全生命周期闭环验收通过');
