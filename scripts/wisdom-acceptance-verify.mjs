#!/usr/bin/env node
/**
 * Phase 82 — 智慧物种田野验收汇总（聚合 Phase 70–82 田野 + 检查表）
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { assessWisdomConditions } from './lib/wisdom-conditions.mjs';

function loadJson(relPath) {
  const url = new URL(relPath, import.meta.url);
  if (!existsSync(url)) return null;
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch {
    return null;
  }
}

const SOURCES = [
  { goal: 'W1', phase: 70, path: '../docs/field-phase70-report.json', label: '记忆→行为闭环' },
  { goal: 'W2', phase: 72, path: '../docs/field-phase72-report.json', label: '可重复选择压' },
  { goal: 'W3', phase: 74, path: '../docs/field-phase74-report.json', label: '预测–校正' },
  { goal: 'W4a', phase: 75, path: '../docs/field-phase75-report.json', label: '社会知识累积' },
  { goal: 'W4b', phase: 76, path: '../docs/field-phase76-report.json', label: '谱系记忆回响' },
  { goal: 'W5a', phase: 77, path: '../docs/field-phase77-report.json', label: '长时开放演化' },
  { goal: 'W5b', phase: 78, path: '../docs/field-phase78-report.json', label: '多情境泛化' },
  { goal: 'ACC', phase: 82, path: '../docs/field-phase82-report.json', label: '综合验收田野' },
];

const checklist = loadJson('../docs/wisdom-checklist-report.json');
const phase82 = loadJson('../docs/field-phase82-report.json');

if (!phase82) {
  console.error('✗ 缺少 docs/field-phase82-report.json — 请先运行 npm run field:phase82');
  process.exit(1);
}

const goals = SOURCES.map(({ goal, phase, path, label }) => {
  const report = loadJson(path);
  const verdict = report?.batchVerdict?.verdict ?? 'missing';
  const partial =
    goal === 'W2' &&
    report?.batchVerdict?.bestUnanimousBases != null &&
    report.batchVerdict.bestUnanimousBases >= 2;
  const status =
    verdict === 'support'
      ? 'support'
      : verdict === 'weak' || partial
        ? 'partial'
        : verdict === 'missing'
          ? 'missing'
          : 'unsupport';
  return { goal, phase, label, verdict, status, report: path.replace('../docs/', '') };
});

const wSupport = goals.filter((g) => g.status === 'support').length;
const wPartial = goals.filter((g) => g.status === 'partial').length;
const checklistSummary = checklist?.assessment?.summary ?? { complete: 0, partial: 0, total: 14 };
const accVerdict = phase82.batchVerdict?.verdict ?? 'unknown';

const acceptance = {
  runAt: new Date().toISOString(),
  phase: 82,
  extension: 'wisdom_acceptance_summary',
  goals,
  checklist: {
    complete: checklistSummary.complete,
    partial: checklistSummary.partial,
    total: checklistSummary.total,
    progressPct: checklist?.assessment?.progressPct ?? 0,
    openItems: (checklist?.assessment?.items ?? [])
      .filter((i) => i.status === 'partial' || i.status === 'open')
      .map((i) => ({ id: i.id, label: i.label, gap: i.gap })),
  },
  integratedField: {
    phase: 82,
    verdict: accVerdict,
    acceptanceReady: phase82.batchVerdict?.acceptanceReady ?? false,
    supportByGoal: phase82.batchVerdict?.supportByGoal,
  },
  summary: {
    wGoalsSupport: wSupport,
    wGoalsPartial: wPartial,
    wGoalsTotal: goals.length - 1,
  },
  verdict:
    wSupport >= 6 && accVerdict === 'support' && checklistSummary.complete >= 12
      ? 'prepared'
      : wSupport >= 5 && accVerdict !== 'unsupport'
        ? 'partial_prepared'
        : 'not_ready',
  knownGaps: ['GAP-10', 'L2b-selection', 'L2c-repeatable'],
  roadmap: 'docs/PHASE82_WISDOM_ACCEPTANCE.md',
  obs: 'OBS-20260729-93',
};

writeFileSync(
  new URL('../docs/wisdom-acceptance-report.json', import.meta.url),
  JSON.stringify(acceptance, null, 2)
);

console.log('智慧物种田野验收汇总\n');
console.log('W 目标田野：');
for (const g of goals) {
  const mark = g.status === 'support' ? '✅' : g.status === 'partial' ? '⚠️' : '✗';
  console.log(`  ${mark} ${g.goal} Phase ${g.phase} — ${g.label} (${g.verdict})`);
}

console.log(`\n检查表：${checklistSummary.complete}/${checklistSummary.total} 完成`);
console.log(`综合验收田野 Phase 82：${accVerdict}`);
console.log(`\n验收状态：${acceptance.verdict}`);
console.log('报告已写入 docs/wisdom-acceptance-report.json');

if (acceptance.verdict === 'not_ready') process.exit(1);
