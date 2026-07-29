#!/usr/bin/env node
/**
 * Phase 93 — GAP-ENV 地热 vent 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE93_TREATMENTS, applyPhase93Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeVentField, verifyPhase93Batch } from './lib/phase93-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE93_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase93Treatment,
    treatmentId,
    seed,
    phase: 93,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeVentField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 93 VTN vent：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：极带 vent 注入可观测 · patch 匹配差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase93Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 93,
  extension: 'gap_env_vent_geothermal',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE93_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV 地热 vent 极带生存缝',
  roadmap: 'docs/PHASE93_VENT_GEOTHERMAL.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase93-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== vent 对照（vent_off_ref vs vent_on_ref）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: injectΔ=${cmp.injectDelta?.toFixed?.(2) ?? cmp.injectDelta} activeΔ=${cmp.activeDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`VTN 可观测: ${batchVerdict.ventObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase93-report.json');

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

await maybeUploadFieldReport({ phase: 93, report });
