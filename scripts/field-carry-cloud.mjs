#!/usr/bin/env node
/**
 * Phase 122 — 留置链谱系云归档
 *
 * 用法：
 *   npm run field:carry:cloud
 *   node scripts/field-carry-cloud.mjs
 *   node scripts/field-carry-cloud.mjs --phases 117,119,121
 *   FIELD_CLOUD=1 node scripts/field-carry-cloud.mjs
 */
import { existsSync } from 'fs';
import { isCloudEnabled } from './lib/cloud-config.mjs';
import { CARRY_CLOUD_PHASES } from './lib/field-carry-cloud.mjs';
import { uploadCarryStack } from './lib/field-cloud-upload.mjs';

function parsePhasesArg() {
  const idx = process.argv.indexOf('--phases');
  if (idx === -1) return CARRY_CLOUD_PHASES;
  const raw = process.argv[idx + 1];
  if (!raw) {
    console.error('用法: --phases 117,119,121');
    process.exit(1);
  }
  return raw.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

if (!isCloudEnabled()) {
  console.error('Supabase 未配置（设置 SUPABASE_URL / SUPABASE_ANON_KEY）');
  process.exit(1);
}

const phases = parsePhasesArg();
for (const p of phases) {
  const path = new URL(`../docs/field-phase${p}-report.json`, import.meta.url);
  if (!existsSync(path)) {
    console.error(`缺少本地报告: docs/field-phase${p}-report.json`);
    process.exit(1);
  }
}

console.log(`Phase 122 留置链云归档：上传 Phase ${phases.join(', ')} + 生成谱系清单\n`);

const result = await uploadCarryStack({ phases });

console.log('\n=== 归档完成 ===');
for (const u of result.uploads) {
  const h = u.summary?.headline;
  const lineage = u.summary?.carryLineage;
  const headline = h ? `${h.metric}=${h.value}` : '—';
  const depth = lineage?.maxChainDepth != null ? `链深${lineage.maxChainDepth}` : '';
  console.log(`Phase ${u.phase}: ${headline} · ${depth} · ${u.logPath}`);
}
const rollup = result.manifest.summary?.carryLineage ?? result.manifest.report?.lineageRollup;
if (rollup) {
  console.log(
    `谱系汇总: ${rollup.totalSnapshots ?? rollup.phases?.length} 快照 · 最大链深 ${rollup.maxChainDepth} · 阶段 ${(rollup.stages ?? rollup.uniqueStages ?? []).join('→')}`
  );
}
console.log(`清单 Phase 122: ${result.manifest.logPath}`);
console.log(result.manifest.publicUrl);
