#!/usr/bin/env node
import { existsSync, readFileSync } from 'fs';
import { verifyPairReproBatch } from './lib/phase124-analyze.js';

const path = new URL('../docs/field-phase124-report.json', import.meta.url);
if (!existsSync(path)) {
  console.error('✗ 缺少 field-phase124-report.json');
  process.exit(1);
}
const report = JSON.parse(readFileSync(path, 'utf8'));
const byTreatment = {};
for (const tid of report.treatmentIds ?? []) {
  byTreatment[tid] = report.aggregate?.[tid]?.runs ?? [];
}
const v = verifyPairReproBatch(byTreatment);
console.log(`Phase 124: ${v.verdict} (${v.passed}/${v.total})`);
if (v.verdict === 'unsupport') process.exit(1);
console.log('✓ 报告校验通过');
