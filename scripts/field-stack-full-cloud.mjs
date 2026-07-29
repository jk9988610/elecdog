#!/usr/bin/env node
/**
 * Phase 56 — 六层人格栈（48–55）田野报告批量云归档
 */
import { isCloudEnabled } from './lib/cloud-config.mjs';
import { FULL_STACK_PHASES } from './lib/field-stack-summary.mjs';
import { uploadFullFieldStack } from './lib/field-cloud-upload.mjs';

function parsePhasesArg() {
  const idx = process.argv.indexOf('--phases');
  if (idx === -1) return FULL_STACK_PHASES;
  const raw = process.argv[idx + 1];
  if (!raw) {
    console.error('用法: --phases 48,55');
    process.exit(1);
  }
  return raw.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

if (!isCloudEnabled()) {
  console.error('Supabase 未配置（设置 SUPABASE_URL / SUPABASE_ANON_KEY）');
  process.exit(1);
}

const phases = parsePhasesArg();
console.log(`Phase 56 六层人格栈云归档：上传 Phase ${phases.join(', ')} + 生成清单\n`);

const result = await uploadFullFieldStack({ phases });

console.log('\n=== 归档完成 ===');
for (const u of result.uploads) {
  const h = u.summary?.headline;
  const headline = h ? `${h.metric}=${h.value}` : '—';
  console.log(`Phase ${u.phase}: ${headline} · ${u.logPath}`);
}
console.log(`清单 Phase 56: ${result.manifest.logPath}`);
console.log(result.manifest.publicUrl);
