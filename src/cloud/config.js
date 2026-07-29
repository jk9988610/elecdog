/**
 * Supabase 云同步（与 Beat-Battle / Card-World 共用项目）
 * 仅使用 anon public key；切勿写入 service_role
 */
export const DEFAULT_CLOUD_CONFIG = {
  url: 'https://yjqkotqmglxjhlrhynsu.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWtvdHFtZ2x4amhscmh5bnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMzNDQsImV4cCI6MjA5NTc2OTM0NH0.Cm4WjiR4NXS4RrA15frLVMZPbGUyGyjaIYQXSRua8Ew',
};

export const LOG_BUCKET = 'elecdog-logs';

const LS_CLOUD = 'elecdog-cloud-config';
const LS_OBSERVER = 'elecdog-observer-label';

export function getCloudConfig() {
  try {
    const raw = localStorage.getItem(LS_CLOUD);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.anonKey) return parsed;
    }
  } catch {
    /* ignore */
  }
  if (DEFAULT_CLOUD_CONFIG.url && DEFAULT_CLOUD_CONFIG.anonKey) {
    return { ...DEFAULT_CLOUD_CONFIG };
  }
  return { url: '', anonKey: '' };
}

export function setCloudConfig({ url, anonKey }) {
  localStorage.setItem(
    LS_CLOUD,
    JSON.stringify({ url: url?.trim() || '', anonKey: anonKey?.trim() || '' })
  );
}

export function isCloudEnabled() {
  const c = getCloudConfig();
  return Boolean(c.url && c.anonKey);
}

export function hasBuiltInCloudConfig() {
  return Boolean(DEFAULT_CLOUD_CONFIG.url && DEFAULT_CLOUD_CONFIG.anonKey);
}

export function getObserverLabel() {
  try {
    const saved = localStorage.getItem(LS_OBSERVER);
    if (saved?.trim()) return saved.trim();
  } catch {
    /* ignore */
  }
  return '观察者';
}

export function setObserverLabel(label) {
  const trimmed = label?.trim();
  if (!trimmed) throw new Error('观察者昵称不能为空');
  localStorage.setItem(LS_OBSERVER, trimmed);
}
