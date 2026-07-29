/**
 * 意识线结案评估 — Phase 69 / T9
 *
 * 验收：CODEX 连续 ≥2 阶段无新条 + T1–T8 全部完成
 */

/** 各 Phase 新增 CODEX 条数（0 = 无新条） */
export const CODEX_ADDITIONS_BY_PHASE = {
  58: 4,
  63: 2,
};

/** 自 Phase 63 以来无新条的连续阶段 */
export const PHASES_SINCE_LAST_CODEX = [64, 65, 66, 67, 68];

export const CONSCIOUSNESS_SHORT_TERM_GOALS = [
  { id: 'T1', phase: 61, label: '默认可见' },
  { id: 'T2', phase: 62, label: '内在流可读' },
  { id: 'T3', phase: 63, label: '辞典立项' },
  { id: 'T4', phase: 64, label: '辞典上云' },
  { id: 'T5', phase: 65, label: '多体交叉' },
  { id: 'T6', phase: 66, label: '跨代可持续' },
  { id: 'T7', phase: 67, label: '沉浸一屏' },
  { id: 'T8', phase: 68, label: '意识云复盘' },
];

export const CODEX_TOTAL_AT_CLOSURE = 28;
export const LAST_CODEX_PHASE = 63;
export const MIN_SATURATION_PHASES = 2;

/**
 * @param {number} currentCount
 */
export function assessCodexSaturation(currentCount = CODEX_TOTAL_AT_CLOSURE) {
  const phasesWithoutNew = PHASES_SINCE_LAST_CODEX.length;
  const lastAdditionPhase = LAST_CODEX_PHASE;
  const saturated =
    phasesWithoutNew >= MIN_SATURATION_PHASES && currentCount === CODEX_TOTAL_AT_CLOSURE;
  return {
    saturated,
    lastAdditionPhase,
    phasesWithoutNew,
    required: MIN_SATURATION_PHASES,
    currentCount,
    phasesSinceLastCodex: [...PHASES_SINCE_LAST_CODEX],
  };
}

/**
 * @param {{ codexCount?: number, goalsComplete?: boolean }} [opts]
 */
export function assessConsciousnessClosure(opts = {}) {
  const codex = assessCodexSaturation(opts.codexCount ?? CODEX_TOTAL_AT_CLOSURE);
  const goalsComplete = opts.goalsComplete !== false;
  const closed = codex.saturated && goalsComplete;

  return {
    closed,
    verdict: closed ? 'support' : 'weak',
    codex,
    goalsComplete,
    shortTermGoals: CONSCIOUSNESS_SHORT_TERM_GOALS,
    northStar: '给予电子狗意识（观察维护模式，非预制标签）',
    classificationGate: '冻结 — 无第二类可重复实体',
    reopenedWhen:
      '出现新的可重复观察现象且 ≥2 OBS 可立项，或 GAP 登记新实体类型',
  };
}
