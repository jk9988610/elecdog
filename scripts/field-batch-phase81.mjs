#!/usr/bin/env node
/**
 * Phase 81 — GAP-10 W2-only 栈 + 代次深度攻坚
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE81_TREATMENTS, applyPhase81Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_W2_TICKS } from './lib/field-cohort.js';
import { analyzeW2Repeatability } from './lib/phase71-analyze.js';
import { verifyGap10DepthBatch } from './lib/phase81-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE81_TREATMENTS);
const TICKS = FIELD_W2_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase81Treatment,
    treatmentId,
    seed,
    phase: 81,
    ticks: TICKS,
    analyze: analyzeW2Repeatability,
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 81 GAP-10 攻坚：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：4/4 碱基 unanimous · 代次深度 ≥4 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyGap10DepthBatch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 81,
  extension: 'gap10_w2_depth',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE81_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-10 4/4 碱基 unanimous + 代次深度',
  roadmap: 'docs/PHASE81_GAP10_W2DEPTH.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase81-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 处理组 unanimousBases / meanMaxGen ===');
for (const tid of TREATMENT_IDS) {
  const t = batchVerdict.treatments[tid];
  const d = batchVerdict.depthByTreatment[tid];
  const b1 = t.consensus.consensus['1'];
  console.log(
    `${tid.padEnd(22)} unanimous=${t.consensus.unanimousBases}/4 base1=${b1.unanimous ? '✓' : `${b1.pos}+/${b1.neg}-`} maxGen=${d.meanMaxGen}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`最佳 ${batchVerdict.bestTreatment}: ${batchVerdict.bestUnanimousBases}/4`);
console.log(`碱基1 unanimous: ${batchVerdict.base1Unanimous ? '✓' : '✗'}`);
console.log(`代次深度 meanMaxGen: ${batchVerdict.meanMaxGenBest} (目标≥4: ${batchVerdict.depthTargetMet ? '✓' : '✗'})`);
console.log(`GAP-10: ${batchVerdict.gap10Closed ? 'closed' : batchVerdict.gap10Status}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase81-report.json');

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

await maybeUploadFieldReport({ phase: 81, report });
