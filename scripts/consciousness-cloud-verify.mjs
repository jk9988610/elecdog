#!/usr/bin/env node
/**
 * 意识线田野报告本地校验（无需 Supabase）
 */
import { existsSync, readFileSync } from 'fs';
import {
  CONSCIOUSNESS_PHASES,
  consciousnessHeadline,
} from './lib/field-consciousness-summary.mjs';

let failed = 0;

console.log('意识线田野报告校验\n');

for (const phase of CONSCIOUSNESS_PHASES) {
  const path = new URL(`../docs/field-phase${phase}-report.json`, import.meta.url);
  if (!existsSync(path)) {
    console.error(`✗ Phase ${phase}: 缺少 docs/field-phase${phase}-report.json`);
    failed += 1;
    continue;
  }
  const report = JSON.parse(readFileSync(path, 'utf8'));
  const headline = consciousnessHeadline(phase, report);
  if (!headline) {
    console.error(`✗ Phase ${phase}: 无法提取 headline`);
    failed += 1;
    continue;
  }
  console.log(`✓ Phase ${phase}: ${headline.metric}=${headline.value} · ${headline.treatmentLabel}`);
}

console.log('\n注：Phase 64 为辞典云同步，无田野批处理报告。');

if (failed) process.exit(1);
console.log('\n意识线报告校验通过');
