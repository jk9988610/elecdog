/** 田野 tick 循环 — 带墙钟截止与 tick 硬顶 */

import { stepWorld } from '../../src/kernel/engine.js';
import { createFieldDeadline, resolveTickCap, FIELD_MAX_TICKS_PER_PASS } from './field-budget.js';

/**
 * @returns {{ ticksRequested: number, ticksCompleted: number, deadlineHit: boolean, tickCapHit: boolean }}
 */
export function runFieldTicks(world, recorder, ticks, opts = {}) {
  const { label, onProgress, deadline, maxTicksPerPass = FIELD_MAX_TICKS_PER_PASS } = opts;
  const ticksRequested = resolveTickCap(ticks, maxTicksPerPass);
  const tickCapHit = ticksRequested < ticks;
  const step = ticksRequested > 1920 ? 960 : 0;
  let ticksCompleted = 0;

  for (let i = 0; i < ticksRequested; i++) {
    if (deadline?.isExpired()) {
      return { ticksRequested: ticks, ticksCompleted, deadlineHit: true, tickCapHit };
    }
    stepWorld(world, recorder);
    ticksCompleted++;
    if (step && ticksCompleted % step === 0) {
      onProgress?.(ticksCompleted, ticksRequested, label);
    }
  }

  return { ticksRequested: ticks, ticksCompleted, deadlineHit: false, tickCapHit };
}

export function createScenarioDeadline(maxMs) {
  return createFieldDeadline(maxMs);
}
