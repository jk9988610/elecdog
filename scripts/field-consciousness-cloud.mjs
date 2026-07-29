#!/usr/bin/env node
/**
 * Phase 68 — 意识线田野报告批量云归档（T8）
 *
 * 上传 Phase 61–63、65–66 报告 + 生成意识线清单
 * Phase 64 为辞典云（无 field-phase64-report.json）
 */
import { existsSync } from 'fs';
import { isCloudEnabled } from './lib/cloud-config.mjs';
import { CONSCIOUSNESS_PHASES } from './lib/field-consciousness-summary.mjs';
import { uploadConsciousnessStack } from './lib/field-cloud-upload.mjs';

function parsePhasesArg() {
  const idx = process.argv.indexOf('--phases');
  if (idx === -1) return CONSCIOUSNESS_PHASES;
  const raw = process.argv[idx + 1];
  if (!raw) {
    console.error('用法: --phases 61,63,66');
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

console.log(`Phase 68 意识线云归档：上传 Phase ${phases.join(', ')} + 生成清单\n`);

const result = await uploadConsciousnessStack({ phases });

console.log('\n=== 归档完成 ===');
for (const u of result.uploads) {
  const h = u.summary?.headline;
  const headline = h ? `${h.metric}=${h.value}` : '—';
  console.log(`Phase ${u.phase}: ${headline} · ${u.logPath}`);
}
console.log(`清单 Phase 68: ${result.manifest.logPath}`);
console.log(result.manifest.publicUrl);
