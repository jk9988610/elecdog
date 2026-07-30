#!/usr/bin/env node
/**
 * 将 codex-data.js 发布到 Supabase codex_entries
 *
 * 用法：
 *   npm run codex:publish          # 全量 33 条
 *   npm run codex:publish:wlr      # 仅 SEM/WL-R 相关条目
 *   FIELD_CLOUD=1 node scripts/codex-cloud-publish.mjs --filter=wlr
 */
import { CODEX_ENTRIES } from '../src/ui/codex-data.js';
import { isCloudEnabled } from './lib/cloud-config.mjs';
import { upsertCodexEntries } from './lib/codex-cloud.mjs';

const filterArg = process.argv.find((a) => a.startsWith('--filter='));
const filter = filterArg?.split('=')[1] ?? 'all';

function selectEntries() {
  if (filter === 'wlr') {
    return CODEX_ENTRIES.filter((e) => e.tag === 'WL-R' || e.tag === 'SEM');
  }
  return CODEX_ENTRIES;
}

if (!isCloudEnabled()) {
  console.error('云同步未配置：请设置 SUPABASE_URL / SUPABASE_ANON_KEY 或使用内置项目');
  process.exit(1);
}

const now = new Date().toISOString();
const rows = selectEntries().map((e) => ({ ...e, updated_at: now }));

console.log(`发布辞典 ${rows.length} 条（filter=${filter}）到 Supabase codex_entries…`);
const result = await upsertCodexEntries(rows);
const count = Array.isArray(result) ? result.length : rows.length;
console.log(`完成：${count} 条已 upsert`);
