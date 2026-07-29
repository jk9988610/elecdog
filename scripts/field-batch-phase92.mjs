#!/usr/bin/env node
/**
 * Phase 92 — GAP-ART 持久 [ART] 场态 + 效率田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE92_TREATMENTS, applyPhase92Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeArtField, verifyPhase92Batch } from './lib/phase92-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE92_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase92Treatment,
    treatmentId,
    seed,
    phase: 92,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeArtField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 92 ART：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：ACT 沉积 [ART] 可观测 · DRW/基底效率差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase92Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 92,
  extension: 'gap_art_field_prototype',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE92_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ART 持久 [ART] 场态 + 效率田野',
  roadmap: 'docs/PHASE92_ART_PROTOTYPE.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase92-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== ART 对照（art_off_ref vs art_on_ref）===');
for (const cmp of batchVerdict.comparisons) {
  console.log(
    `  seed${cmp.seed}: depositΔ=${cmp.depositDelta} injectΔ=${cmp.injectDelta?.toFixed?.(2) ?? cmp.injectDelta} draw+Δ=${cmp.drawBonusDelta?.toFixed?.(3) ?? cmp.drawBonusDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`ART 可观测: ${batchVerdict.artObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase92-report.json');

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

await maybeUploadFieldReport({ phase: 92, report });
