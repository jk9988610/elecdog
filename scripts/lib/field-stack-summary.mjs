/**
 * Phase 48–53 统计田野报告摘要（云归档 / 观察台预览）
 */

/** @type {Record<number, { key: string, label: string }>} */
export const PHASE_HEADLINE_METRIC = {
  48: { key: 'meanExpTransitions', label: 'EXP' },
  49: { key: 'meanRegTransitions', label: 'REG' },
  50: { key: 'meanMtbTransitions', label: 'MTB' },
  51: { key: 'meanCoopTransitions', label: 'COOP' },
  52: { key: 'meanTotalLayers', label: 'LAY' },
  53: { key: 'meanRpr', label: 'RPR' },
  55: { key: 'meanEhu', label: 'EHU' },
  56: { key: 'meanPersona', label: 'PSN' },
  57: { key: 'meanEhuLin', label: 'LIN' },
};

/** @type {Record<number, string>} */
export const PHASE_FEEDBACK_TREATMENT = {
  48: 'fertile_exp_feedback',
  49: 'fertile_reg_couple',
  50: 'fertile_mtb_feedback',
  51: 'fertile_coop_feedback',
  52: 'fertile_stack_feedback',
  53: 'stack_rpr_observe',
  55: 'stack_ehu_feedback',
  56: 'persona_feedback',
  57: 'ehu_deep_full',
};

export const STACK_PHASES = [48, 49, 50, 51, 52, 53];
export const FULL_STACK_PHASES = [48, 49, 50, 51, 52, 53, 55];

function pickMeanFields(row) {
  return Object.fromEntries(
    Object.entries(row).filter(([k, v]) => k.startsWith('mean') && v != null && typeof v !== 'object')
  );
}

/**
 * @param {object} report
 */
export function summarizeAggregateReport(report) {
  const aggregate = report.aggregate ?? {};
  const treatments = Object.entries(aggregate).map(([id, row]) => ({
    id,
    label: row.label ?? id,
    ...pickMeanFields(row),
  }));

  const aliveVals = treatments.map((t) => t.meanAlive).filter((v) => v != null);
  const aliveAtEnd = aliveVals.length ? Math.max(...aliveVals) : 0;

  let totalBeings = 12;
  if (typeof report.cohort === 'string') {
    const m = report.cohort.match(/(\d+)\s*beings?/i);
    if (m) totalBeings = Number(m[1]);
  }

  const phase = report.phase ?? null;
  const headlineDef = phase ? PHASE_HEADLINE_METRIC[phase] : null;
  const feedbackId = phase ? PHASE_FEEDBACK_TREATMENT[phase] : null;
  const feedbackRow = feedbackId ? aggregate[feedbackId] : null;

  return {
    mode: report.mode ?? 'field_stat',
    cohort: report.cohort ?? null,
    seedCount: report.seeds?.length ?? 0,
    treatmentCount: treatments.length,
    treatments,
    aliveAtEnd,
    totalBeings,
    headline: headlineDef && feedbackRow
      ? {
          treatmentId: feedbackId,
          treatmentLabel: feedbackRow.label ?? feedbackId,
          metric: headlineDef.label,
          value: feedbackRow[headlineDef.key] ?? null,
        }
      : null,
  };
}

/**
 * @param {Array<{ phase: number, summary?: object, logPath?: string, publicUrl?: string }>} uploads
 */
export function buildStackManifest(uploads, { phase = 54, extension = 'field_stack_cloud_archive' } = {}) {
  const phases = uploads.map((u) => ({
    phase: u.phase,
    extension: u.summary?.extension ?? null,
    logPath: u.logPath ?? null,
    publicUrl: u.publicUrl ?? null,
    headline: u.summary?.headline ?? u.summary?.aggregateSummary?.headline ?? null,
    aliveAtEnd: u.summary?.aliveAtEnd ?? null,
    treatmentCount: u.summary?.treatmentCount ?? u.summary?.aggregateSummary?.treatmentCount ?? null,
  }));

  const headlines = phases
    .filter((p) => p.headline?.value != null)
    .map((p) => ({
      phase: p.phase,
      metric: p.headline.metric,
      value: p.headline.value,
      treatment: p.headline.treatmentLabel,
    }));

  const scope =
    phase >= 56
      ? 'EXP + REG + MTB + COOP + 四层整合 + RPR + EHU 统计田野云归档'
      : 'EXP + REG + MTB + COOP + 四层整合 + RPR 统计田野云归档';

  return {
    runAt: new Date().toISOString(),
    phase,
    extension,
    kind: phase >= 56 ? 'field-full-stack-manifest' : 'field-stack-manifest',
    stackPhases: uploads.map((u) => u.phase),
    phases,
    headlines,
    design: {
      scope,
      source: 'docs/field-phase{N}-report.json',
    },
    roadmap: phase >= 56 ? 'docs/PHASE56_PERSONA_STACK.md' : 'docs/PHASE54_CLOUD_ARCHIVE.md',
  };
}

export function buildFullStackManifest(uploads) {
  return buildStackManifest(uploads, {
    phase: 56,
    extension: 'field_full_stack_cloud_archive',
  });
}
