/** 将 Supabase / Storage 错误转为可读中文提示 */
export function formatSupabaseError(err, bucket = '') {
  const msg = err?.message || String(err || '未知错误');
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return '网络不可用，请检查连接后重试';
  }
  if (msg.includes('JWT') || msg.includes('Invalid API key')) {
    return '云同步认证失败，请检查 Supabase anon key';
  }
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return '数据库权限不足，请确认 Supabase 已执行 schema.sql 并开启表策略';
  }
  if (msg.includes('Bucket not found') || msg.includes('bucket_id')) {
    return `Storage 桶 ${bucket || 'elecdog-logs'} 不存在，请在 Supabase 创建 Public 桶`;
  }
  if (msg.includes('duplicate key') && msg.includes('field_notes_obs_id')) {
    return '该 OBS 编号已存在，请换编号或编辑已有笔记';
  }
  return msg;
}
