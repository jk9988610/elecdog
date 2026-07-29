#!/usr/bin/env node
/**
 * Phase 73 — 预测误差最小对照（双体短跑）
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { StatsRecorder } from '../src/recorder/stats-recorder.js';
import { spawnBeing } from '../src/birth/spawn.js';

const TICKS = 400;
const CODES = ['001', '002'];

function runScenario(enablePrd) {
  const recorder = new StatsRecorder();
  const world = createWorld('01');
  applyEnvProfile(world, 'wisdom_evolution');
  world.envProfile = {
    ...world.envProfile,
    predictionEnabled: enablePrd,
    predictionAlpha: 0.35,
    predictionLogThreshold: 0.05,
    fieldStatMode: false,
  };

  for (const code of CODES) {
    spawnBeing(world, recorder, { name: `探针${code}`, code });
  }

  for (let t = 0; t < TICKS; t++) {
    stepWorld(world, recorder);
  }

  const alive = world.beings.filter((b) => b.alive);
  const prdCount = enablePrd
    ? alive.reduce((s, b) => s + (b.prdLogCount ?? 0), 0)
    : 0;
  const errors = alive.slice(0, 4).map((b) => ({
    id: b.id.slice(-6),
    meanError: b.prdErrorCount ? +(b.prdErrorSum / b.prdErrorCount).toFixed(4) : 0,
    highTicks: b.prdHighErrorTicks ?? 0,
  }));

  return {
    predictionEnabled: enablePrd,
    prdCount,
    errors,
    alive: alive.length,
  };
}

console.log('Phase 73 预测误差对照（短跑）\n');

const off = runScenario(false);
const on = runScenario(true);

console.log('无预测层:', off);
console.log('有预测层:', on);
console.log(
  on.prdCount > 0
    ? `\n✓ [PRD] 可观察（${on.prdCount} 条）`
    : '\n⚠ 短跑无 PRD，需 field:phase73'
);
