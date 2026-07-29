#!/usr/bin/env node
/**
 * Phase 84 — GAP-ORG 储备池 [RSV] on/off 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE84_TREATMENTS, applyPhase84Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeReservoirField, verifyPhase84Batch } from './lib/phase84-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE84_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase84Treatment,
    treatmentId,
    seed,
    phase: 84,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeReservoirField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 84 储备池 [RSV]：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：剧变情境 rsv_on 比 rsv_off END 率更低 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase84Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 84,
  extension: 'gap_org_reservoir_rsv',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE84_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ORG reservoir + [RSV] 记录层 on/off',
  roadmap: 'docs/PHASE84_RESERVOIR.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase84-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 剧变对照（rsv_off_shk vs rsv_on_shk）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: off=${cmp.offEnd}/${cmp.offAlive} on=${cmp.onEnd}/${cmp.onAlive} Δalive=${cmp.aliveDelta} rsvOut=${cmp.rsvOut.toFixed?.(2) ?? cmp.rsvOut} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`均值 END: off=${batchVerdict.offShkMeanEnd} on=${batchVerdict.onShkMeanEnd} Δ=${batchVerdict.meanEndDelta}`);
console.log(`RSV 可观测: ${batchVerdict.rsvObserved ? '✓' : '✗'}`);
console.log(`support: ${batchVerdict.supportCount}/${batchVerdict.seedsCompared}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase84-report.json');

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

await maybeUploadFieldReport({ phase: 84, report });
