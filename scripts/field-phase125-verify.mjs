#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { verifyPairFieldBatch } from './lib/phase125-analyze.js';

const path = new URL('../docs/field-phase125-report.json', import.meta.url);
if (!existsSync(path)) {
  console.error('✗ 缺少 field-phase125-report.json');
  process.exit(1);
}
const report = JSON.parse(readFileSync(path, 'utf8'));
const byTreatment = {};
for (const tid of Object.keys(report.aggregate ?? {})) {
  byTreatment[tid] = report.aggregate[tid].runs ?? [];
}
const v = verifyPairFieldBatch(byTreatment);
console.log(`Phase 125: ${v.verdict} (${v.passed}/${v.total})`);
if (v.verdict === 'unsupport') process.exit(1);
console.log('✓ 报告校验通过');
