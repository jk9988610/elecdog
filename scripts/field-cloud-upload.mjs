#!/usr/bin/env node
/**
 * 将已有田野报告 JSON 上传到 Supabase
 *
 * 用法：
 *   node scripts/field-cloud-upload.mjs 26
 *   node scripts/field-cloud-upload.mjs 48 49 50
 *   node scripts/field-cloud-upload.mjs 48-53
 *   FIELD_CLOUD=1 npm run field:phase26
 */
import { readLocalFieldReport, uploadFieldReport } from './lib/field-cloud-upload.mjs';

function parsePhaseArgs(argv) {
  const phases = [];
  for (const arg of argv) {
    if (arg === '--cloud') continue;
    if (/^\d+-\d+$/.test(arg)) {
      const [a, b] = arg.split('-').map(Number);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      for (let p = lo; p <= hi; p += 1) phases.push(p);
      continue;
    }
    const n = Number(arg);
    if (!Number.isNaN(n) && n > 0) phases.push(n);
  }
  return [...new Set(phases)];
}

const phases = parsePhaseArgs(process.argv.slice(2));
if (!phases.length) {
  console.error('用法: node scripts/field-cloud-upload.mjs <phase> [phase2 …]');
  console.error('      node scripts/field-cloud-upload.mjs 48-53');
  process.exit(1);
}

for (const phase of phases) {
  const report = readLocalFieldReport(phase);
  const result = await uploadFieldReport({ phase, report });
  console.log(`Phase ${phase} 上传成功:`, result.logPath);
  console.log(result.publicUrl);
}
