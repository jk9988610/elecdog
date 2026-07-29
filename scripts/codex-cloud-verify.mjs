#!/usr/bin/env node
/**
 * 辞典云同步验证 — 本地合并逻辑 + 可选云拉取
 *
 * 用法：
 *   npm run codex:verify
 *   npm run codex:verify -- --cloud
 */
import { CODEX_ENTRIES } from '../src/ui/codex-data.js';
import { mergeCodexEntries } from '../src/cloud/codex-sync.js';
import { isCloudEnabled } from './lib/cloud-config.mjs';
import { listCodexEntries } from './lib/codex-cloud.mjs';

const useCloud = process.argv.includes('--cloud') || process.env.FIELD_CLOUD === '1';

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

// 本地合并：云覆盖同 id
const remotePatch = [
  {
    id: CODEX_ENTRIES[0].id,
    title: `${CODEX_ENTRIES[0].title}（云修订）`,
    definition: CODEX_ENTRIES[0].definition,
    evidence: CODEX_ENTRIES[0].evidence,
    falsifiable: CODEX_ENTRIES[0].falsifiable,
    established: CODEX_ENTRIES[0].established,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'codex-cloud-test-entry',
    title: '云测试词条',
    definition: '仅用于 verify 脚本，不应出现在 codex-data.js',
    evidence: ['OBS-TEST'],
    falsifiable: '删除本行即证伪',
    established: '2026-07-29',
    updated_at: new Date().toISOString(),
  },
];

const merged = mergeCodexEntries(CODEX_ENTRIES, remotePatch);
assert(merged.length === CODEX_ENTRIES.length + 1, '合并后条目数 = 本地 + 云新增');
assert(
  merged.find((e) => e.id === CODEX_ENTRIES[0].id)?.title.includes('云修订'),
  '同 id 时云条目覆盖本地'
);
assert(
  merged.find((e) => e.id === 'codex-cloud-test-entry')?.source === 'cloud',
  '云新增条目标记 source=cloud'
);
assert(
  merged.filter((e) => e.tag === 'EHU').length === CODEX_ENTRIES.filter((e) => e.tag === 'EHU').length,
  'EHU 词条数不变（无云覆盖 EHU）'
);

console.log(`本地辞典 ${CODEX_ENTRIES.length} 条 · EHU ${CODEX_ENTRIES.filter((e) => e.tag === 'EHU').length} 条`);

if (useCloud) {
  if (!isCloudEnabled()) {
    console.error('✗ --cloud 需要 SUPABASE_URL / SUPABASE_ANON_KEY');
    process.exit(1);
  }
  try {
    const rows = await listCodexEntries({ limit: 64 });
    assert(Array.isArray(rows), '云拉取返回数组');
    console.log(`云辞典 ${rows.length} 条`);
    if (rows.length) {
      const cloudMerged = mergeCodexEntries(CODEX_ENTRIES, rows);
      console.log(`云合并后 ${cloudMerged.length} 条`);
    }
  } catch (e) {
    console.error(`✗ 云拉取失败: ${e.message}`);
    failed += 1;
  }
} else {
  console.log('提示：加 --cloud 可验证 Supabase 拉取');
}

if (failed) process.exit(1);
console.log('\n辞典云验证通过');
