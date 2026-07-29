#!/usr/bin/env node
/**
 * Phase 82 — 智慧物种田野验收
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE82_TREATMENTS, applyPhase82Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeWisdomOpenField, verifyWisdomAcceptanceBatch } from './lib/phase82-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE82_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase82Treatment,
    treatmentId,
    seed,
    phase: 82,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeWisdomOpenField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 82 智慧物种验收：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 情境`
);
console.log(`目标：W1/W3/W4/W5 四层 support · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyWisdomAcceptanceBatch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 82,
  extension: 'wisdom_species_acceptance',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE82_TREATMENTS,
  batchVerdict,
  shortTermGoal: '智慧物种田野验收准备',
  roadmap: 'docs/PHASE82_WISDOM_ACCEPTANCE.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase82-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 验收层 support 计数 ===');
for (const [goal, count] of Object.entries(batchVerdict.supportByGoal)) {
  console.log(`${goal.padEnd(20)} ${count}/${batchVerdict.seedsCompared}`);
}

console.log('\n=== 批次判定 ===');
console.log(`综合: ${batchVerdict.verdict}`);
console.log(`验收就绪: ${batchVerdict.acceptanceReady ? '✓' : '✗（L2 partial 仍开放）'}`);

console.log('\n报告已写入 docs/field-phase82-report.json');

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

await maybeUploadFieldReport({ phase: 82, report });
