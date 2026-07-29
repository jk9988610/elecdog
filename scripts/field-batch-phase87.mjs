#!/usr/bin/env node
/**
 * Phase 87 — GAP-ENV [SCL] 季相四相田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE87_TREATMENTS, applyPhase87Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeSeasonalField, verifyPhase87Batch } from './lib/phase87-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE87_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase87Treatment,
    treatmentId,
    seed,
    phase: 87,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeSeasonalField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 87 [SCL] 季相：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：四相可观测 · 冷相 LOW 高于暖相 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase87Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 87,
  extension: 'gap_env_scl_seasonal',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE87_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV [SCL] 季相四相',
  roadmap: 'docs/PHASE87_SCL_SEASONAL.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase87-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 季相对照（scl_off_ref vs scl_on_ref）===');
for (const cmp of batchVerdict.sclComparisons) {
  console.log(
    `  seed${cmp.seed}: phases off=${cmp.offPhases} on=${cmp.onPhases} trans=${cmp.onTransitions} → ${cmp.verdict}`
  );
}

console.log('\n=== 冷暖相 LOW（scl_on_ref）===');
for (const cmp of batchVerdict.coldComparisons) {
  console.log(
    `  seed${cmp.seed}: warm=${cmp.warmRate} cold=${cmp.coldRate} Δ=${cmp.coldWarmDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`SCL 可观测: ${batchVerdict.sclObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase87-report.json');

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

await maybeUploadFieldReport({ phase: 87, report });
