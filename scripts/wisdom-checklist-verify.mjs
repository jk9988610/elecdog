#!/usr/bin/env node
/**
 * 智慧诞生条件检查表 — 输出 docs/wisdom-checklist-report.json
 */
import { existsSync, readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { assessWisdomConditions } from './lib/wisdom-conditions.mjs';

const memoryFeedbackInCode = existsSync(
  new URL('../src/world/memory-feedback.js', import.meta.url)
);

let phase70FieldVerdict;
const fieldReportPath = new URL('../docs/field-phase70-report.json', import.meta.url);
if (existsSync(fieldReportPath)) {
  try {
    const fieldReport = JSON.parse(readFileSync(fieldReportPath, 'utf8'));
    phase70FieldVerdict = fieldReport.batchVerdict?.verdict;
  } catch {
    /* ignore */
  }
}

let phase75FieldVerdict;
const field75Path = new URL('../docs/field-phase75-report.json', import.meta.url);
if (existsSync(field75Path)) {
  try {
    const fieldReport = JSON.parse(readFileSync(field75Path, 'utf8'));
    phase75FieldVerdict = fieldReport.batchVerdict?.verdict;
  } catch {
    /* ignore */
  }
}

const assessment = assessWisdomConditions({ memoryFeedbackInCode, phase70FieldVerdict, phase75FieldVerdict });

const report = {
  runAt: new Date().toISOString(),
  phase: 75,
  extension: 'wisdom_checklist',
  kind: 'wisdom-birth-conditions',
  assessment,
  layers: assessment.items.reduce((acc, item) => {
    if (!acc[item.layer]) acc[item.layer] = { label: item.layerLabel, items: [] };
    acc[item.layer].items.push(item);
    return acc;
  }, {}),
  next: 'Phase 76 W4 — lineage memory echo',
};

writeFileSync(
  new URL('../docs/wisdom-checklist-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('智慧诞生条件检查表\n');
console.log(`北极星：${assessment.northStar}`);
console.log(`进度：${assessment.summary.complete}/${assessment.summary.total} 完成 · ${assessment.progressPct}%`);
console.log(`当前：Phase ${assessment.currentPhase} · ${assessment.currentGoal}\n`);

for (const item of assessment.items) {
  const mark =
    item.status === 'complete'
      ? '✅'
      : item.status === 'in_progress'
        ? '🔧'
        : item.status === 'partial'
          ? '⚠️'
          : '⬜';
  console.log(`${mark} [${item.layer}] ${item.label} (${item.status})`);
}

console.log('\n报告已写入 docs/wisdom-checklist-report.json');
