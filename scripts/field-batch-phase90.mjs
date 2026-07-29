#!/usr/bin/env node
/**
 * Phase 90 — GAP-ENV air 标量 + 日相耦合 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE90_TREATMENTS, applyPhase90Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeAirField, verifyPhase90Batch } from './lib/phase90-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE90_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase90Treatment,
    treatmentId,
    seed,
    phase: 90,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeAirField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 90 air+日相：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：air 衰减 solar 注能可观测 · 稀薄 drain 差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase90Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 90,
  extension: 'gap_env_air_diurnal',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE90_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV air 标量 + 日相耦合',
  roadmap: 'docs/PHASE90_AIR_DIURNAL.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase90-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== air 对照（air_off_ref vs air_on_ref）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: injectΔ=${cmp.injectDelta} effSolarΔ=${cmp.effSolarDelta} meanAir=${cmp.meanAir} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`AIR 可观测: ${batchVerdict.airObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase90-report.json');

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

await maybeUploadFieldReport({ phase: 90, report });
