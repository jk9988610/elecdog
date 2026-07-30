#!/usr/bin/env node
/**
 * Phase 123 — 留置交互假说报告校验（无需重跑田野）
 */
import { existsSync, readFileSync } from 'fs';
import { verifyCarryInteractionLawBatch } from './lib/phase123-analyze.js';

const path = new URL('../docs/field-phase123-report.json', import.meta.url);
if (!existsSync(path)) {
  console.error('✗ 缺少 docs/field-phase123-report.json — 请先运行 npm run field:phase123');
  process.exit(1);
}

const report = JSON.parse(readFileSync(path, 'utf8'));
const byTreatment = {};
for (const tid of report.treatmentIds ?? []) {
  byTreatment[tid] = report.aggregate?.[tid]?.runs ?? [];
}

const verdict = verifyCarryInteractionLawBatch(byTreatment);
console.log(`Phase 123 留置交互假说：${verdict.verdict} (${verdict.passed}/${verdict.total})`);
console.log(`  H4 繁殖SOC产量: ${verdict.h4CarryReproSocYieldLaw ? '✓' : '✗'}`);
console.log(`  H5 SOC负载: ${verdict.h5SocLoadLaw ? '✓' : '✗'}`);
console.log(`  H6 on>off: ${verdict.h6InteractOnBeatsOff ? '✓' : '✗'}`);
console.log(
  `  yield on=${verdict.meanCarryReproSocYieldOn} off=${verdict.meanCarryReproSocYieldOff}`
);

if (verdict.verdict === 'unsupport') process.exit(1);
console.log('\n✓ Phase 123 报告校验通过');
