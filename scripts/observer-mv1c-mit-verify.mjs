#!/usr/bin/env node
/**
 * MV1c — 成体同型 MIT、STEM 池冻结、田野速率调参
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing } from '../src/birth/spawn.js';
import {
  resolveLifeStage,
  LIFE_STAGE_ADT,
  stemPoolFrozen,
} from '../src/world/multicell-v2.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const world = createWorld('M-MV1c');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
world.envProfile.adultMitIntervalTicks = 3;
world.envProfile.adultMitBase = 0.42;
const recorder = new Recorder();

spawnBeing(world, recorder, { name: 'ad', code: '001', pairMorph: 'A' });
const adult = world.beings[0];
adult.logicCells['LOG-HRM'] = [
  { id: `${adult.id.slice(-6)}:LOG-HRM:0`, code: 'LOG-HRM', atTick: 0 },
];

adult.tickCount = 120;
resolveLifeStage(adult, world, world.envProfile);

assert(adult.lifeStage === LIFE_STAGE_ADT, '成体 ADT');
assert(stemPoolFrozen(adult), 'STEM 池已冻结');
const stemFrozen = adult.logicCells?.STEM?.length ?? 0;
assert(stemFrozen >= 2, `冻结时 STEM 余量≥2（${stemFrozen}）`);

for (let i = 0; i < 48; i++) stepWorld(world, recorder);

const stemAfter = adult.logicCells?.STEM?.length ?? 0;
assert(stemAfter === stemFrozen, `成体期 STEM 数量不变（${stemFrozen}→${stemAfter}）`);

const stemFrz = recorder.entries.filter((e) => e.meta?.kind === 'STEM-FRZ');
assert(stemFrz.length === 1, `[STEM-FRZ] 单次登记（${stemFrz.length}）`);

const adultMit = recorder.entries.filter(
  (e) => e.meta?.kind === 'MIT' && e.meta?.stage === LIFE_STAGE_ADT
);
assert(adultMit.length > 0, `成体同型 [MIT]（${adultMit.length}）`);
assert(
  adultMit.some((e) => e.meta?.code === 'LOG-HRM' && e.meta?.sameType),
  '成体 LOG-HRM 同型 MIT'
);

const adultDiff = recorder.entries.filter(
  (e) => e.meta?.kind === 'DIFF' && e.meta?.stage === LIFE_STAGE_ADT
);
assert(adultDiff.length === 0, '成体冻结后无 STEM→DIFF');

if (failed) process.exit(1);
console.log('\n✓ MV1c 成体 MIT / STEM 冻结验收通过');
