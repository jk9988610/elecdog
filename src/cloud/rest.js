/**
 * 仅用 fetch 访问 Supabase REST / Storage，不依赖 CDN SDK
 * 模式参考 Beat-Battle js/remote-rest.js
 */
import { getCloudConfig, isCloudEnabled, LOG_BUCKET } from './config.js';
import { formatSupabaseError } from './supabase-error.js';

function headers(contentType = 'application/json') {
  const { anonKey } = getCloudConfig();
  const h = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
  };
  if (contentType) h['Content-Type'] = contentType;
  return h;
}

function apiBase() {
  return `${getCloudConfig().url.replace(/\/$/, '')}/rest/v1`;
}

function storageBase() {
  return `${getCloudConfig().url.replace(/\/$/, '')}/storage/v1`;
}

async function restRequest(method, pathQuery, body, extraHeaders = {}) {
  const res = await fetch(`${apiBase()}${pathQuery}`, {
    method,
    headers: { ...headers(), ...extraHeaders },
    body: body != null ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatSupabaseError({ message: `HTTP ${res.status}: ${text.slice(0, 200)}` }));
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function cloudActive() {
  return isCloudEnabled();
}

export async function listFieldRuns({ limit = 20 } = {}) {
  if (!isCloudEnabled()) return [];
  return restRequest(
    'GET',
    `/field_runs?select=*&order=created_at.desc&limit=${limit}`
  );
}

export async function insertFieldRun(row) {
  if (!isCloudEnabled()) throw new Error('云同步未配置');
  const rows = await restRequest('POST', '/field_runs', row, {
    Prefer: 'return=representation',
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function listFieldNotes({ limit = 30 } = {}) {
  if (!isCloudEnabled()) return [];
  return restRequest(
    'GET',
    `/field_notes?select=*&order=created_at.desc&limit=${limit}`
  );
}

export async function upsertFieldNote(row) {
  if (!isCloudEnabled()) throw new Error('云同步未配置');
  const rows = await restRequest('POST', '/field_notes?on_conflict=obs_id', row, {
    Prefer: 'resolution=merge-duplicates,return=representation',
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function uploadLogBlob(path, blob) {
  if (!isCloudEnabled()) throw new Error('云同步未配置');
  const url = `${storageBase()}/object/${LOG_BUCKET}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers(blob.type || 'application/json'),
      'x-upsert': 'true',
    },
    body: blob,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatSupabaseError({ message: text }, LOG_BUCKET));
  }
  return path;
}

export function getLogPublicUrl(path) {
  if (!path || !isCloudEnabled()) return '';
  const base = getCloudConfig().url.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${LOG_BUCKET}/${path}`;
}

export async function fetchLogArchive(logPath) {
  const url = getLogPublicUrl(logPath);
  if (!url) throw new Error('日志路径无效');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(formatSupabaseError({ message: `HTTP ${res.status}: ${text.slice(0, 120)}` }));
  }
  return res.json();
}
