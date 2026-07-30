#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { verifyWlrReproLineageBatch } from './lib/phase132-analyze.js';

const path = new URL('../docs/field-phase132-report.json', import.meta.url);
if (!existsSync(path)) {
  console.error('✗ 缺少 field-phase132-report.json');
  process.exit(1);
}

const report = JSON.parse(readFileSync(path, 'utf8'));
const byTreatment = {};
for (const [tid, agg] of Object.entries(report.aggregate ?? {})) {
  byTreatment[tid] = agg.runs ?? [];
}

const v = verifyWlrReproLineageBatch(byTreatment);
console.log(`Phase 132 验证：${v.verdict} (${v.passed}/${v.total})`);
console.log(JSON.stringify(v, null, 2));

if (v.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 132 验证通过');
