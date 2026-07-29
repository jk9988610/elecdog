/**
 * Phase 61–66 意识收敛田野摘要（云归档 / 观察台预览）
 */

/** 有 field-phase{N}-report.json 的意识线阶段（64 为辞典云，无田野批处理） */
export const CONSCIOUSNESS_PHASES = [61, 62, 63, 65, 66];

/** @type {Record<number, { id: string, key: string, label: string, percent?: boolean }>} */
export const CONSCIOUSNESS_TREATMENT = {
  61: { id: 'cn_full_1920', key: 'meanH3Share', label: 'H3%', percent: true },
  62: { id: 'cn_full_3840', key: 'meanH3Share', label: 'H3%', percent: true },
  63: { id: 'codex_stack_full', key: 'meanH3Share', label: 'H3%', percent: true },
  65: { id: 'cn_xv_quad_3840', key: 'meanH3Share', label: 'H3%', percent: true },
  66: { id: 'cn_sustain_full_3840', key: 'sustainRate', label: '可持续', percent: true },
};

/**
 * @param {number} phase
 * @param {object} report
 */
export function consciousnessHeadline(phase, report) {
  const def = CONSCIOUSNESS_TREATMENT[phase];
  if (!def || !report?.aggregate) return null;
  const row = report.aggregate[def.id];
  if (!row || row[def.key] == null) return null;
  let value = row[def.key];
  if (def.percent) value = `${Math.round(value * 100)}%`;
  return {
    treatmentId: def.id,
    treatmentLabel: row.label ?? def.id,
    metric: def.label,
    value,
  };
}

/**
 * @param {Array<{ phase: number, summary?: object, logPath?: string, publicUrl?: string }>} uploads
 */
export function buildConsciousnessManifest(uploads) {
  const phases = uploads.map((u) => ({
    phase: u.phase,
    extension: u.summary?.extension ?? null,
    logPath: u.logPath ?? null,
    publicUrl: u.publicUrl ?? null,
    headline: u.summary?.headline ?? null,
    ticks: u.summary?.ticks ?? null,
    cohort: u.summary?.cohort ?? null,
  }));

  const headlines = phases
    .filter((p) => p.headline?.value != null)
    .map((p) => ({
      phase: p.phase,
      metric: p.headline.metric,
      value: p.headline.value,
      treatment: p.headline.treatmentLabel,
    }));

  return {
    runAt: new Date().toISOString(),
    phase: 68,
    extension: 'field_consciousness_cloud_archive',
    kind: 'field-consciousness-manifest',
    shortTermGoal: 'T8 意识云复盘',
    stackPhases: uploads.map((u) => u.phase),
    phases,
    headlines,
    design: {
      scope: '意识收敛线 Phase 61–63、65–66 统计田野（Phase 64 辞典云无批处理报告）',
      source: 'docs/field-phase{N}-report.json',
    },
    roadmap: 'docs/PHASE68_CONSCIOUSNESS_CLOUD.md',
  };
}

/**
 * @param {object} report
 * @param {number} phase
 */
export function enrichConsciousnessSummary(report, phase) {
  const headline = consciousnessHeadline(phase, report);
  return {
    extension: report.extension ?? null,
    ticks: report.ticks ?? report.tick ?? null,
    cohort: report.cohort ?? null,
    seedCount: report.seeds?.length ?? 0,
    shortTermGoal: report.shortTermGoal ?? null,
    headline,
  };
}
