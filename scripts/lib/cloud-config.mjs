/**
 * Node 侧 Supabase 配置（田野批处理上传）
 * 优先读环境变量，否则使用与观察台相同的内置项目。
 */
export const DEFAULT_CLOUD_CONFIG = {
  url: 'https://yjqkotqmglxjhlrhynsu.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcWtvdHFtZ2x4amhscmh5bnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTMzNDQsImV4cCI6MjA5NTc2OTM0NH0.Cm4WjiR4NXS4RrA15frLVMZPbGUyGyjaIYQXSRua8Ew',
};

export const LOG_BUCKET = 'elecdog-logs';

export function getCloudConfig() {
  const url = process.env.SUPABASE_URL?.trim() || DEFAULT_CLOUD_CONFIG.url;
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || DEFAULT_CLOUD_CONFIG.anonKey;
  return { url, anonKey };
}

export function isCloudEnabled() {
  const { url, anonKey } = getCloudConfig();
  return Boolean(url && anonKey);
}

export function shouldUploadFieldCloud() {
  if (process.env.FIELD_CLOUD === '0' || process.env.FIELD_CLOUD === 'false') return false;
  if (process.env.FIELD_CLOUD === '1' || process.env.FIELD_CLOUD === 'true') return true;
  return process.argv.includes('--cloud');
}
