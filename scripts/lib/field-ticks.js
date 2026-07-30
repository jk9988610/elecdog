/** 田野 tick 循环 — 带墙钟截止与 tick 硬顶 */

import { stepWorld } from '../../src/kernel/engine.js';
import {
  createFieldDeadline,
  resolveTickCap,
  resolveFieldTickChunk,
  FIELD_MAX_TICKS_PER_PASS,
} from './field-budget.js';

/**
 * @returns {{ ticksRequested: number, ticksCompleted: number, deadlineHit: boolean, tickCapHit: boolean }}
 */
export function runFieldTicks(world, recorder, ticks, opts = {}) {
  const {
    label,
    onProgress,
    deadline,
    maxTicksPerPass = FIELD_MAX_TICKS_PER_PASS,
    tickChunk = resolveFieldTickChunk(ticks, false),
  } = opts;
  const ticksRequested = resolveTickCap(ticks, maxTicksPerPass);
  const tickCapHit = ticksRequested < ticks;
  const chunk = Math.max(1, tickChunk | 0);
  const progressStep = ticksRequested > 1920 ? 960 : 0;
  let ticksCompleted = 0;

  while (ticksCompleted < ticksRequested) {
    if (deadline?.isExpired()) {
      return { ticksRequested: ticks, ticksCompleted, deadlineHit: true, tickCapHit };
    }
    const batch = Math.min(chunk, ticksRequested - ticksCompleted);
    for (let j = 0; j < batch; j++) {
      stepWorld(world, recorder);
      ticksCompleted++;
      if (progressStep && ticksCompleted % progressStep === 0) {
        onProgress?.(ticksCompleted, ticksRequested, label);
      }
    }
  }

  return { ticksRequested: ticks, ticksCompleted, deadlineHit: false, tickCapHit };
}

export function createScenarioDeadline(maxMs) {
  return createFieldDeadline(maxMs);
}
