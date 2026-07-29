#!/usr/bin/env node
/**
 * Phase 94 — GAP-ENV patch 迁徙 [MIG] 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE94_TREATMENTS, applyPhase94Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeMigField, verifyPhase94Batch } from './lib/phase94-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE94_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase94Treatment,
    treatmentId,
    seed,
    phase: 94,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeMigField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 94 MIG：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：patch 迁徙可观测 · alt 税差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase94Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 94,
  extension: 'gap_env_patch_migration',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE94_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV patch 迁徙 + alt 税',
  roadmap: 'docs/PHASE94_PATCH_MIGRATION.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase94-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== MIG 对照（mig_off_ref vs mig_on_ref）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: moveΔ=${cmp.moveDelta} taxΔ=${cmp.taxDelta?.toFixed?.(2) ?? cmp.taxDelta} patch=${cmp.finalPatch} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`MIG 可观测: ${batchVerdict.migObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase94-report.json');

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

await maybeUploadFieldReport({ phase: 94, report });
