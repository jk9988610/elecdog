#!/usr/bin/env node
/**
 * Phase 72 — W2 选择压强化环境
 * 智慧演化场 12体 × 3000 tick × 4 种子 × 4 处理组
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE72_TREATMENTS, applyPhase72Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS } from './lib/field-cohort.js';
import { analyzeW2Repeatability } from './lib/phase71-analyze.js';
import { verifyW2ReinforcementBatch } from './lib/phase72-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE72_TREATMENTS);
const TICKS = 3000;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase72Treatment,
    treatmentId,
    seed,
    phase: 72,
    ticks: TICKS,
    analyze: analyzeW2Repeatability,
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 72 W2 强化环境：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：≥2/4 碱基 unanimous · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyW2ReinforcementBatch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 72,
  extension: 'w2_selection_reinforcement',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE72_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'W2 选择压强化 · ≥2 碱基 unanimous',
  roadmap: 'docs/PHASE72_SELECTION_REINFORCE.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase72-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组 unanimousBases ===');
for (const tid of TREATMENT_IDS) {
  const t = batchVerdict.treatments[tid];
  console.log(
    `${tid.padEnd(18)} unanimous=${t.consensus.unanimousBases}/4 signConsistent=${t.compare.signConsistent} meanDrift=${t.meanDrift} maxGen~${Math.round(t.perSeed.reduce((s, p) => s + p.maxGen, 0) / t.perSeed.length)}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`基线 ${batchVerdict.baselineId}: ${batchVerdict.baselineUnanimousBases}/4`);
console.log(`最佳 ${batchVerdict.bestTreatment}: ${batchVerdict.bestUnanimousBases}/4`);
console.log(`W2 目标 (≥2): ${batchVerdict.w2TargetMet ? '✓' : '✗'}`);
console.log(`GAP-10: ${batchVerdict.gap10Status}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase72-report.json');

const allRuns = TREATMENT_IDS.flatMap((tid) => byTreatment[tid]);
const maxRunMs = Math.max(...allRuns.map((r) => r.durationMs ?? 0));
const totalBatchMs = performance.now() - batchStartedAt;
console.log(
  `时长：单次最慢 ${formatFieldDuration(maxRunMs)} · 合计 ${formatFieldDuration(totalBatchMs)}`
);
if (maxRunMs > MAX_MS) {
  console.error(`\n✗ 存在超时单次实验，田野不通过`);
  process.exit(1);
}
console.log('✓ 全部单次实验在预算内');

await maybeUploadFieldReport({ phase: 72, report });
