#!/usr/bin/env node
/**
 * Phase 85 — GAP-ENV band E/M/P + [DLC] 日相田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE85_TREATMENTS, applyPhase85Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzeDiurnalField, verifyPhase85Batch } from './lib/phase85-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE85_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase85Treatment,
    treatmentId,
    seed,
    phase: 85,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzeDiurnalField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 85 band+[DLC]：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：日相昼夜 LOW 差 · 同 DNA 不同 band 存活差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase85Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 85,
  extension: 'gap_env_band_dlc',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE85_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV band E/M/P + [DLC] 日相',
  roadmap: 'docs/PHASE85_DLC_DIURNAL.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase85-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 日相对照（dlc_off_M vs dlc_on_M）===');
for (const cmp of batchVerdict.dlcComparisons) {
  console.log(
    `  seed${cmp.seed}: offNight=${cmp.offNight} onNight=${cmp.onNight} Δ=${cmp.nightDelta?.toFixed?.(6) ?? cmp.nightDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 区带对照（E vs P）===');
console.log(`  alive E=${batchVerdict.bandAliveE} P=${batchVerdict.bandAliveP} → ${batchVerdict.bandVerdict}`);

console.log('\n=== 批次判定 ===');
console.log(`DLC 可观测: ${batchVerdict.dlcObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase85-report.json');

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

await maybeUploadFieldReport({ phase: 85, report });
