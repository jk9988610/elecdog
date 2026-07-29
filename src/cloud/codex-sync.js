/** 辞典云同步 — 只读覆盖 + 维护者发布 */

import { CODEX_ENTRIES } from '../ui/codex-data.js';
import { isCloudEnabled } from './config.js';
import { listCodexEntries, upsertCodexEntries } from './rest.js';

export function normalizeCodexRow(row) {
  return {
    id: row.id,
    title: row.title,
    definition: row.definition,
    evidence: Array.isArray(row.evidence) ? row.evidence : [],
    falsifiable: row.falsifiable,
    established:
      typeof row.established === 'string' ? row.established.slice(0, 10) : row.established ?? '',
    tag: row.tag || undefined,
    updatedAt: row.updated_at ?? null,
    source: 'cloud',
  };
}

/** 本地为离线兜底；同 id 时云条目覆盖 */
export function mergeCodexEntries(local, remote = []) {
  const map = new Map(local.map((e) => [e.id, { ...e, source: 'local' }]));
  for (const row of remote) {
    map.set(row.id, normalizeCodexRow(row));
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
}

export async function fetchCodexEntries() {
  if (!isCloudEnabled()) return [];
  const rows = await listCodexEntries({ limit: 64 });
  return rows ?? [];
}

export async function publishLocalCodexToCloud() {
  const now = new Date().toISOString();
  const rows = CODEX_ENTRIES.map((e) => ({
    ...e,
    updated_at: now,
  }));
  return upsertCodexEntries(rows);
}
