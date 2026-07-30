/**
 * 田野批处理报告上传 Supabase（Phase 30 / 54 扩展）
 */
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import {
  getCloudConfig,
  isCloudEnabled,
  LOG_BUCKET,
  shouldUploadFieldCloud,
} from './cloud-config.mjs';
import {
  buildStackManifest,
  buildFullStackManifest,
  STACK_PHASES,
  FULL_STACK_PHASES,
  summarizeAggregateReport,
} from './field-stack-summary.mjs';
import {
  buildConsciousnessManifest,
  CONSCIOUSNESS_PHASES,
  enrichConsciousnessSummary,
} from './field-consciousness-summary.mjs';
import {
  buildCarryManifest,
  CARRY_CLOUD_PHASES,
  CARRY_MANIFEST_PHASE,
  enrichCarrySummary,
} from './field-carry-cloud.mjs';

function headers(contentType = 'application/json') {
  const { anonKey } = getCloudConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
    'Content-Type': contentType,
  };
}

function apiBase() {
  return `${getCloudConfig().url.replace(/\/$/, '')}/rest/v1`;
}

function storageBase() {
  return `${getCloudConfig().url.replace(/\/$/, '')}/storage/v1`;
}

async function insertFieldRun(row) {
  const res = await fetch(`${apiBase()}/field_runs`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`field_runs insert HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function uploadJson(path, payload) {
  const body = JSON.stringify(payload);
  const res = await fetch(`${storageBase()}/object/${LOG_BUCKET}/${path}`, {
    method: 'POST',
    headers: { ...headers('application/json'), 'x-upsert': 'true' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storage upload HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return path;
}

export function summarizeBatchReport(phase, report) {
  const ticks = report.ticks ?? report.tick ?? 0;
  let alive = 0;
  let total = 0;
  let aggregateSummary = null;

  if (report.aggregate && typeof report.aggregate === 'object') {
    aggregateSummary = summarizeAggregateReport({ ...report, phase });
    alive = aggregateSummary.aliveAtEnd;
    total = aggregateSummary.totalBeings;
  } else if (report.catastrophe?.length) {
    const last = report.catastrophe[report.catastrophe.length - 1];
    alive = last?.viability?.aliveAtEnd ?? last?.selection?.aliveCount ?? 0;
    total = last?.viability?.totalBeings ?? 4;
  } else if (report.runs?.length) {
    const last = report.runs[report.runs.length - 1];
    alive = last?.cooperation?.bySlot
      ? Object.values(last.cooperation.bySlot).reduce((s, x) => s + (x.aliveAtEnd ?? 0), 0)
      : last?.viability?.endCount ?? 0;
    total = 4;
  } else if (report.four?.length) {
    const last = report.four[report.four.length - 1];
    alive = last?.selection?.aliveCount ?? 0;
    total = 4;
  } else if (report.solo?.length) {
    alive = 1;
    total = 1;
  } else if (report.experiments?.length) {
    alive = report.experiments.length;
    total = report.experiments.length;
  }

  const summary = {
    kind:
      report.kind === 'field-consciousness-manifest'
        ? 'field-consciousness-manifest'
        : report.kind === 'field-carry-manifest'
          ? 'field-carry-manifest'
          : report.kind === 'field-full-stack-manifest'
            ? 'field-full-stack-manifest'
            : report.kind === 'field-stack-manifest'
              ? 'field-stack-manifest'
              : 'field-batch',
    phase,
    extension: report.extension ?? null,
    ticks,
    runAt: report.runAt ?? new Date().toISOString(),
    aliveAtEnd: alive,
    totalBeings: total,
    keys: Object.keys(report).filter((k) => !['runAt'].includes(k)),
  };

  if (aggregateSummary) {
    summary.mode = aggregateSummary.mode;
    summary.cohort = aggregateSummary.cohort;
    summary.seedCount = aggregateSummary.seedCount;
    summary.treatmentCount = aggregateSummary.treatmentCount;
    summary.treatments = aggregateSummary.treatments;
    summary.headline = aggregateSummary.headline;
  }

  if (report.kind === 'field-stack-manifest' || report.kind === 'field-full-stack-manifest') {
    summary.stackPhases = report.stackPhases ?? [];
    summary.headlines = report.headlines ?? [];
  }

  if (report.kind === 'field-consciousness-manifest') {
    summary.stackPhases = report.stackPhases ?? [];
    summary.headlines = report.headlines ?? [];
    summary.shortTermGoal = report.shortTermGoal ?? null;
  }

  if (report.kind === 'field-carry-manifest') {
    summary.stackPhases = report.stackPhases ?? [];
    summary.headlines = report.headlines ?? [];
    summary.shortTermGoal = report.shortTermGoal ?? null;
    summary.carryLineage = report.lineageRollup ?? null;
  }

  if (CARRY_CLOUD_PHASES.includes(phase) && report.aggregate && !summary.carryLineage) {
    const extra = enrichCarrySummary(report);
    summary.carryLineage = extra.carryLineage;
    if (!summary.headline && extra.headline) summary.headline = extra.headline;
    if (!summary.cohort && extra.cohort) summary.cohort = extra.cohort;
    if (!summary.seedCount && extra.seedCount) summary.seedCount = extra.seedCount;
  }

  if (CONSCIOUSNESS_PHASES.includes(phase) && !summary.headline) {
    const extra = enrichConsciousnessSummary(report, phase);
    if (extra.headline) summary.headline = extra.headline;
    if (extra.cohort) summary.cohort = extra.cohort;
    if (extra.seedCount) summary.seedCount = extra.seedCount;
    if (extra.shortTermGoal) summary.shortTermGoal = extra.shortTermGoal;
  }

  return summary;
}

/**
 * @param {{ phase: number, report: object, label?: string }} opts
 */
export async function uploadFieldReport({ phase, report, label = 'field-batch' }) {
  if (!isCloudEnabled()) {
    throw new Error('Supabase 未配置（设置 SUPABASE_URL / SUPABASE_ANON_KEY）');
  }

  const id = randomUUID();
  const logPath = `field-reports/phase${phase}-${id}.json`;
  const summary = summarizeBatchReport(phase, report);
  const archive = {
    exportedAt: new Date().toISOString(),
    kind: summary.kind ?? 'field-batch',
    phase,
    summary,
    report,
  };

  await uploadJson(logPath, archive);

  const worldName =
    summary.kind === 'field-consciousness-manifest'
      ? `Phase ${phase} 意识线云归档`
      : summary.kind === 'field-carry-manifest'
        ? `Phase ${phase} 留置链谱系云归档`
        : summary.kind === 'field-full-stack-manifest'
          ? `Phase ${phase} 六层人格栈云归档`
          : summary.kind === 'field-stack-manifest'
            ? `Phase ${phase} 四层栈云归档`
            : CONSCIOUSNESS_PHASES.includes(phase)
              ? `Phase ${phase} 意识田野`
              : CARRY_CLOUD_PHASES.includes(phase)
                ? `Phase ${phase} 留置链田野`
                : `Phase ${phase} 田野批处理`;

  const row = await insertFieldRun({
    id,
    place: '01',
    world_name: worldName,
    tick: summary.ticks,
    alive_count: summary.aliveAtEnd,
    total_beings: summary.totalBeings,
    observer_label: label,
    summary,
    log_path: logPath,
  });

  return {
    ...row,
    logPath,
    publicUrl: `${getCloudConfig().url.replace(/\/$/, '')}/storage/v1/object/public/${LOG_BUCKET}/${logPath}`,
    summary,
  };
}

export async function maybeUploadFieldReport(opts) {
  if (!shouldUploadFieldCloud()) return null;
  const result = await uploadFieldReport(opts);
  console.log(`\n☁ 已上传田野批处理 Phase ${opts.phase} → ${result.logPath}`);
  return result;
}

export function readLocalFieldReport(phase) {
  const reportPath = new URL(`../../docs/field-phase${phase}-report.json`, import.meta.url);
  return JSON.parse(readFileSync(reportPath, 'utf8'));
}

/**
 * @param {{ phases?: number[], label?: string, manifestPhase?: number, buildManifest?: Function }} [opts]
 */
export async function uploadFieldStack({
  phases = STACK_PHASES,
  label = 'field-stack-batch',
  manifestPhase = 54,
  buildManifest = buildStackManifest,
} = {}) {
  const uploads = [];
  for (const phase of phases) {
    const report = readLocalFieldReport(phase);
    const result = await uploadFieldReport({ phase, report, label });
    uploads.push({
      phase,
      logPath: result.logPath,
      publicUrl: result.publicUrl,
      summary: result.summary,
    });
    console.log(`  Phase ${phase} → ${result.logPath}`);
  }

  const manifest = buildManifest(uploads);
  const manifestResult = await uploadFieldReport({
    phase: manifestPhase,
    report: manifest,
    label: manifest.kind === 'field-full-stack-manifest' ? 'field-full-stack-manifest' : 'field-stack-manifest',
  });
  console.log(`\n☁ 栈归档清单 Phase ${manifestPhase} → ${manifestResult.logPath}`);

  return { uploads, manifest: manifestResult };
}

export async function uploadConsciousnessStack({
  phases = CONSCIOUSNESS_PHASES,
  label = 'field-consciousness-batch',
  manifestPhase = 68,
} = {}) {
  const uploads = [];
  for (const phase of phases) {
    const report = readLocalFieldReport(phase);
    const result = await uploadFieldReport({ phase, report, label });
    uploads.push({
      phase,
      logPath: result.logPath,
      publicUrl: result.publicUrl,
      summary: result.summary,
    });
    console.log(`  Phase ${phase} → ${result.logPath}`);
  }

  const manifest = buildConsciousnessManifest(uploads);
  const manifestResult = await uploadFieldReport({
    phase: manifestPhase,
    report: manifest,
    label: 'field-consciousness-manifest',
  });
  console.log(`\n☁ 意识线归档清单 Phase ${manifestPhase} → ${manifestResult.logPath}`);

  return { uploads, manifest: manifestResult };
}

export async function maybeUploadConsciousnessStack(opts) {
  if (!shouldUploadFieldCloud()) return null;
  return uploadConsciousnessStack(opts);
}

export async function uploadFullFieldStack(opts = {}) {
  return uploadFieldStack({
    phases: FULL_STACK_PHASES,
    manifestPhase: 56,
    buildManifest: buildFullStackManifest,
    label: 'field-full-stack-batch',
    ...opts,
  });
}

export async function maybeUploadFullFieldStack(opts) {
  if (!shouldUploadFieldCloud()) return null;
  return uploadFullFieldStack(opts);
}

export async function maybeUploadFieldStack(opts) {
  if (!shouldUploadFieldCloud()) return null;
  return uploadFieldStack(opts);
}

export async function uploadCarryStack({
  phases = CARRY_CLOUD_PHASES,
  label = 'field-carry-batch',
  manifestPhase = CARRY_MANIFEST_PHASE,
} = {}) {
  const uploads = [];
  for (const phase of phases) {
    const report = readLocalFieldReport(phase);
    const result = await uploadFieldReport({ phase, report, label });
    uploads.push({
      phase,
      logPath: result.logPath,
      publicUrl: result.publicUrl,
      summary: result.summary,
    });
    console.log(`  Phase ${phase} → ${result.logPath}`);
  }

  const manifest = buildCarryManifest(uploads);
  const manifestResult = await uploadFieldReport({
    phase: manifestPhase,
    report: manifest,
    label: 'field-carry-manifest',
  });
  console.log(`\n☁ 留置链谱系清单 Phase ${manifestPhase} → ${manifestResult.logPath}`);

  return { uploads, manifest: manifestResult };
}

export async function maybeUploadCarryStack(opts) {
  if (!shouldUploadFieldCloud()) return null;
  return uploadCarryStack(opts);
}
