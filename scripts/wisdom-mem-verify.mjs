#!/usr/bin/env node
/**
 * Phase 70 — 记忆反馈最小对照（双体短跑）
 */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile } from '../src/world/env-profile.js';
import { stepWorld } from '../src/kernel/engine.js';
import { StatsRecorder } from '../src/recorder/stats-recorder.js';
import { spawnBeing } from '../src/birth/spawn.js';
import { memoryFeedbackEnabled } from '../src/world/memory-feedback.js';

const TICKS = 200;
const CODES = ['001', '002'];

class MemVerifyRecorder extends StatsRecorder {
  constructor() {
    super();
    this.extLines = 0;
    this.actLines = 0;
    this.extBeingTicks = 0;
  }

  external(tick, beingId, content) {
    const lines = Array.isArray(content) ? content : [content];
    if (lines.length) this.extBeingTicks++;
    for (const line of lines) {
      this.extLines++;
      if (String(line).startsWith('[ACT]')) this.actLines++;
    }
  }
}

function runScenario(enableMem) {
  const recorder = new MemVerifyRecorder();
  const world = createWorld('01');
  applyEnvProfile(world, 'baseline');
  world.envProfile = {
    ...world.envProfile,
    electronicHumanEnabled: false,
    fissionEnabled: false,
    memoryFeedbackEnabled: enableMem,
  };

  for (const code of CODES) {
    spawnBeing(world, recorder, { name: `探针${code}`, code });
  }

  for (let t = 0; t < TICKS; t++) {
    stepWorld(world, recorder);
  }

  const alive = world.beings.filter((b) => b.alive).length;
  const memLoads = world.beings
    .filter((b) => b.alive)
    .map((b) => ({
      id: b.id.slice(-6),
      memRxLoad: +(b.memRxLoad ?? 0).toFixed(3),
      memActLoad: +(b.memActLoad ?? 0).toFixed(3),
    }));

  return {
    memoryFeedback: enableMem,
    ticks: TICKS,
    alive,
    externalRate: +(recorder.extBeingTicks / (TICKS * CODES.length)).toFixed(3),
    actShare: recorder.extLines ? +(recorder.actLines / recorder.extLines).toFixed(3) : 0,
    memLoads,
  };
}

console.log('Phase 70 记忆反馈对照（短跑）\n');

const off = runScenario(false);
const on = runScenario(true);

console.log('无记忆反馈:', off);
console.log('有记忆反馈:', on);

const diff = Math.abs(off.externalRate - on.externalRate);
console.log(`\n对外率差 |Δ| = ${diff.toFixed(3)}`);
console.log(diff > 0.001 ? '✓ 可观察差异（待长时田野确认）' : '⚠ 短跑无差异，需延长 tick 或多种子');
