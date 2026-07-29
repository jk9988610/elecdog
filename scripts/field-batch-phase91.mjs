#!/usr/bin/env node
/**
 * Phase 91 — GAP-ENV [ADV] 邻格平流 + [LTC] 月相 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE91_TREATMENTS, applyPhase91Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeAdvLtcField, verifyPhase91Batch } from './lib/phase91-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE91_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase91Treatment,
    treatmentId,
    seed,
    phase: 91,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeAdvLtcField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 91 ADV+LTC：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：邻格平流可观测 · 月相潮汐调制 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase91Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 91,
  extension: 'gap_env_adv_ltc',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE91_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV [ADV] 邻格平流 + [LTC] 月相',
  roadmap: 'docs/PHASE91_ADV_LTC.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase91-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== ADV+LTC 对照（adv_ltc_off vs adv_ltc_on）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: advΔ=${cmp.advDelta} fluxΔ=${cmp.fluxDelta?.toFixed?.(2) ?? cmp.fluxDelta} ltcΔ=${cmp.ltcDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`机制可观测: ${batchVerdict.mechanismObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase91-report.json');

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

await maybeUploadFieldReport({ phase: 91, report });
