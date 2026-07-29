#!/usr/bin/env node
/**
 * Phase 88 — GAP-ORG Synth-A/B + reservoir 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE88_TREATMENTS, applyPhase88Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeSynthField, verifyPhase88Batch } from './lib/phase88-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE88_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase88Treatment,
    treatmentId,
    seed,
    phase: 88,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeSynthField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 88 Synth-A/B：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：Synth 注能可观测 · 剧变情境 synth-b 动用 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase88Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 88,
  extension: 'gap_org_synth_ab_reservoir',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE88_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ORG Synth-A/B + reservoir',
  roadmap: 'docs/PHASE88_SYNTH_RESERVOIR.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase88-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== Synth 对照（off vs on_ref）===');
for (const cmp of batchVerdict.refComparisons) {
  console.log(
    `  seed${cmp.seed}: synthA=${cmp.synthAIn?.toFixed?.(3) ?? cmp.synthAIn} synthB=${cmp.synthBOut?.toFixed?.(3) ?? cmp.synthBOut} → ${cmp.verdict}`
  );
}

console.log('\n=== 剧变对照（off vs on_shk）===');
for (const cmp of batchVerdict.shkComparisons) {
  console.log(
    `  seed${cmp.seed}: end off=${cmp.offEnd} on=${cmp.onEnd} synthB=${cmp.synthBOut?.toFixed?.(3) ?? cmp.synthBOut} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`Synth 可观测: ${batchVerdict.synthObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase88-report.json');

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

await maybeUploadFieldReport({ phase: 88, report });
