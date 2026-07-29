#!/usr/bin/env node
/**
 * Phase 96 — W6 全栈耦合验收田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE96_TREATMENTS, applyPhase96Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeW6StackField, verifyPhase96Batch } from './lib/phase96-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE96_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase96Treatment,
    treatmentId,
    seed,
    phase: 96,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeW6StackField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 96 W6：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：全栈层可观测 + W5 智慧指标维持 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase96Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 96,
  extension: 'w6_unified_stack_acceptance',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE96_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'W6 工具+储备+环境耦合验收',
  roadmap: 'docs/PHASE96_W6_STACK.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase96-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 全栈对照（off vs on）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: layers ${cmp.offLayers}→${cmp.onLayers} (Δ${cmp.layerDelta}) alive=${cmp.aliveTotal} → ${cmp.verdict}`
  );
}

console.log('\n=== W5 验收层（w6_stack_on）===');
for (const [goal, count] of Object.entries(batchVerdict.supportByGoal)) {
  console.log(`  ${goal.padEnd(20)} ${count}/${batchVerdict.seedsCompared}`);
}

console.log('\n=== 批次判定 ===');
console.log(`全栈可观测: ${batchVerdict.stackObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase96-report.json');

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

await maybeUploadFieldReport({ phase: 96, report });
