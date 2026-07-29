#!/usr/bin/env node
/**
 * Phase 95 — GAP-11+ [DSP] 耗散定律 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE95_TREATMENTS, applyPhase95Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeDspField, verifyPhase95Batch } from './lib/phase95-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE95_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase95Treatment,
    treatmentId,
    seed,
    phase: 95,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeDspField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 95 DSP：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：yield 差可观测 · toReg/lost 账本 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase95Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 95,
  extension: 'gap11_dsp_dissipation',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE95_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-11+ DRW 耗散定律 [DSP]',
  roadmap: 'docs/PHASE95_DSP_DISSIPATION.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase95-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== yield 对照（dsp_on_low vs dsp_on_high）===');
for (const cmp of batchVerdict.yieldComparisons) {
  console.log(
    `  seed${cmp.seed}: yieldΔ=${cmp.yieldDelta?.toFixed?.(3) ?? cmp.yieldDelta} toRegΔ=${cmp.toRegDelta?.toFixed?.(2) ?? cmp.toRegDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`DSP 可观测: ${batchVerdict.dspObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase95-report.json');

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

await maybeUploadFieldReport({ phase: 95, report });
