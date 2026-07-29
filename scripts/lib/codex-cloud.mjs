/**
 * Node 侧辞典云发布（Phase 64）
 */
import { getCloudConfig, isCloudEnabled } from './cloud-config.mjs';

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

export async function listCodexEntries({ limit = 64 } = {}) {
  if (!isCloudEnabled()) return [];
  const res = await fetch(
    `${apiBase()}/codex_entries?select=*&order=title.asc&limit=${limit}`,
    { headers: headers(), cache: 'no-store' }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`codex_entries list HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function upsertCodexEntries(rows) {
  if (!isCloudEnabled()) throw new Error('云同步未配置');
  const payload = rows.map((r) => ({
    id: r.id,
    title: r.title,
    definition: r.definition,
    evidence: r.evidence ?? [],
    falsifiable: r.falsifiable,
    established: r.established ?? null,
    tag: r.tag ?? null,
    updated_at: r.updated_at ?? new Date().toISOString(),
  }));
  const res = await fetch(`${apiBase()}/codex_entries?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...headers(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`codex_entries upsert HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}
