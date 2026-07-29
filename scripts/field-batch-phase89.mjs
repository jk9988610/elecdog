#!/usr/bin/env node
/**
 * Phase 89 — GAP-ORG FUS 捕获 [SYM] module 田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE89_TREATMENTS, applyPhase89Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeSymField, verifyPhase89Batch } from './lib/phase89-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE89_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase89Treatment,
    treatmentId,
    seed,
    phase: 89,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeSymField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 89 FUS+[SYM]：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：FUS 子代 SYM 捕获可观测 · 模块通量差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase89Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 89,
  extension: 'gap_org_sym_fus_capture',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE89_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ORG FUS 捕获 [SYM] module',
  roadmap: 'docs/PHASE89_SYM_FUS.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase89-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== SYM 捕获对照（sym_off_fus vs sym_on_fus）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: captureΔ=${cmp.captureDelta} modulesΔ=${cmp.moduleDelta} fluxΔ=${cmp.fluxDelta?.toFixed?.(2) ?? cmp.fluxDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`SYM 可观测: ${batchVerdict.symObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase89-report.json');

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

await maybeUploadFieldReport({ phase: 89, report });
