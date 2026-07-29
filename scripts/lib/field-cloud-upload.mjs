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
  STACK_PHASES,
  summarizeAggregateReport,
} from './field-stack-summary.mjs';

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
    kind: report.kind === 'field-stack-manifest' ? 'field-stack-manifest' : 'field-batch',
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

  if (report.kind === 'field-stack-manifest') {
    summary.stackPhases = report.stackPhases ?? [];
    summary.headlines = report.headlines ?? [];
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
    summary.kind === 'field-stack-manifest'
      ? `Phase ${phase} 四层栈云归档`
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
 * @param {{ phases?: number[], label?: string }} [opts]
 */
export async function uploadFieldStack({ phases = STACK_PHASES, label = 'field-stack-batch' } = {}) {
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

  const manifest = buildStackManifest(uploads);
  const manifestResult = await uploadFieldReport({
    phase: 54,
    report: manifest,
    label: 'field-stack-manifest',
  });
  console.log(`\n☁ 四层栈归档清单 Phase 54 → ${manifestResult.logPath}`);

  return { uploads, manifest: manifestResult };
}

export async function maybeUploadFieldStack(opts) {
  if (!shouldUploadFieldCloud()) return null;
  return uploadFieldStack(opts);
}
