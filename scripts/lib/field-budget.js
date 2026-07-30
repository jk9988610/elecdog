/**
 * 田野单次运行时长预算 — 每次实验必须计时，超过上限视为不通过
 *
 * 规则：可多次实验（多种子/多处理组），但**单次** runFieldScenario 不得超过 3 分钟。
 */

export const FIELD_RUN_MAX_MS = 3 * 60 * 1000;

/** 单段 tick 循环硬顶 — 防止配置错误导致无限步进 */
export const FIELD_MAX_TICKS_PER_PASS = 8192;

export function resolveTickCap(requested, maxPerPass = FIELD_MAX_TICKS_PER_PASS) {
  const n = Number(requested) || 0;
  return Math.min(Math.max(0, n), maxPerPass);
}

/** 田野单次实验墙钟截止（可在 tick 循环内轮询） */
export function createFieldDeadline(maxMs = getFieldRunMaxMs(), startedAt = performance.now()) {
  return {
    maxMs,
    startedAt,
    elapsedMs() {
      return performance.now() - startedAt;
    },
    isExpired() {
      return performance.now() - startedAt >= maxMs;
    },
    remainingMs() {
      return Math.max(0, maxMs - (performance.now() - startedAt));
    },
  };
}

export class FieldRunBudgetError extends Error {
  constructor({ label, elapsedMs, maxMs, phase }) {
    const sec = (elapsedMs / 1000).toFixed(1);
    const maxSec = (maxMs / 1000).toFixed(0);
    super(
      `田野单次实验超时（不通过）：${label}${phase != null ? ` · Phase ${phase}` : ''} 耗时 ${sec}s > 上限 ${maxSec}s`
    );
    this.name = 'FieldRunBudgetError';
    this.label = label;
    this.elapsedMs = elapsedMs;
    this.maxMs = maxMs;
    this.phase = phase;
  }
}

export function formatFieldDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getFieldRunMaxMs() {
  const raw = process.env.FIELD_RUN_MAX_MS;
  if (raw != null && raw !== '') {
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return FIELD_RUN_MAX_MS;
}

/** @returns {{ pass: boolean, elapsedMs: number, maxMs: number }} */
export function checkFieldRunBudget(elapsedMs, { label, maxMs = getFieldRunMaxMs(), phase } = {}) {
  const pass = elapsedMs <= maxMs;
  if (!pass) {
    throw new FieldRunBudgetError({ label, elapsedMs, maxMs, phase });
  }
  return { pass, elapsedMs, maxMs };
}
