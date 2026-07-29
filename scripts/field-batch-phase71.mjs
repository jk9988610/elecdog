#!/usr/bin/env node
/**
 * Phase 71 — W2 选择压可重复性度量
 * 智慧演化场 12体 × 2500 tick × 4 种子 × 剧变/无剧变
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE71_TREATMENTS, applyPhase71Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS } from './lib/field-cohort.js';
import { analyzeW2Repeatability, verifyW2Batch } from './lib/phase71-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE71_TREATMENTS);
const TICKS = 2500;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase71Treatment,
    treatmentId,
    seed,
    phase: 71,
    ticks: TICKS,
    analyze: analyzeW2Repeatability,
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 71 W2 选择压度量：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`单次实验上限：${formatFieldDuration(MAX_MS)}（超时即不通过）\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyW2Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 71,
  extension: 'w2_selection_repeatability',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE71_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'W2 选择压可重复性度量',
  roadmap: 'docs/PHASE71_SELECTION_METRICS.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase71-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== W2 跨种子度量 ===');
for (const tid of TREATMENT_IDS) {
  const t = batchVerdict.treatments[tid];
  console.log(
    `${tid}: signConsistent=${t.compare.signConsistent} unanimousBases=${t.consensus.unanimousBases}/4 meanDrift=${t.meanDrift} meanSEL=${t.meanSel}`
  );
  for (const s of t.perSeed) {
    console.log(
      `  seed${s.seed}: drift=${JSON.stringify(s.drift)} SEL=${s.selCount} maxGen=${s.maxGen}`
    );
  }
}

console.log('\n=== 批次判定 ===');
console.log(`signConsistent 剧变: ${batchVerdict.signConsistentCat ? '✓' : '✗'}`);
console.log(`signConsistent 对照: ${batchVerdict.signConsistentCtrl ? '✓' : '✗'}`);
console.log(`最佳 unanimousBases: ${batchVerdict.bestUnanimousBases}/4`);
console.log(`GAP-10 状态: ${batchVerdict.gap10Status}`);
console.log(`综合: ${batchVerdict.verdict}`);
console.log(`Phase 72 目标: ${batchVerdict.phase72Target}`);

console.log('\n报告已写入 docs/field-phase71-report.json');

const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));
const totalBatchMs = performance.now() - batchStartedAt;
console.log(
  `时长：单次最慢 ${formatFieldDuration(maxRunMs)} · 合计 ${formatFieldDuration(totalBatchMs)} · 上限 ${formatFieldDuration(MAX_MS)}/次`
);
if (maxRunMs > MAX_MS) {
  console.error(`\n✗ 存在超时单次实验，田野不通过`);
  process.exit(1);
}
console.log('✓ 全部单次实验在预算内');

await maybeUploadFieldReport({ phase: 71, report });
