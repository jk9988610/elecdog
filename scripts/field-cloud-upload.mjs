#!/usr/bin/env node
/**
 * 将已有田野报告 JSON 上传到 Supabase
 * 用法：node scripts/field-cloud-upload.mjs 26
 *       FIELD_CLOUD=1 npm run field:phase26
 */
import { readFileSync } from 'fs';
import { uploadFieldReport } from './lib/field-cloud-upload.mjs';

const phase = Number(process.argv[2]);
if (!phase || Number.isNaN(phase)) {
  console.error('用法: node scripts/field-cloud-upload.mjs <phase>');
  process.exit(1);
}

const reportPath = new URL(`../docs/field-phase${phase}-report.json`, import.meta.url);
const report = JSON.parse(readFileSync(reportPath, 'utf8'));

const result = await uploadFieldReport({ phase, report });
console.log('上传成功:', result.logPath);
console.log(result.publicUrl);
