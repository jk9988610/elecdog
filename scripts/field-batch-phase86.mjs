#!/usr/bin/env node
/**
 * Phase 86 — GAP-ENV terrain L/O + [PCP] 简化水循环田野
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { PHASE86_TREATMENTS, applyPhase86Treatment } from '../src/world/env-profile.js';
import { runFieldScenario } from './lib/field-run.js';
import { FIELD_SEEDS, FIELD_LONG_TICKS } from './lib/field-cohort.js';
import { analyzePcpField, verifyPhase86Batch } from './lib/phase86-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';
import { formatFieldDuration, getFieldRunMaxMs } from './lib/field-budget.js';

const TREATMENT_IDS = Object.keys(PHASE86_TREATMENTS);
const TICKS = FIELD_LONG_TICKS;
const MAX_MS = getFieldRunMaxMs();

function runOne(treatmentId, seed) {
  const run = runFieldScenario({
    createWorld,
    applyTreatment: applyPhase86Treatment,
    treatmentId,
    seed,
    phase: 86,
    ticks: TICKS,
    analyze: (recorder, beings, world, ctx) =>
      analyzePcpField(recorder, beings, world, { ticks: ctx?.ticks ?? TICKS }),
  });
  process.stdout.write(` ✓ ${run.durationLabel}\n`);
  return run;
}

console.log(
  `Phase 86 terrain+[PCP]：12体 ${TICKS} tick × ${FIELD_SEEDS.length} 种子 × ${TREATMENT_IDS.length} 处理组`
);
console.log(`目标：PCP on/off 补场差 · 陆海 e1/DRW/LOW 分布差 · 上限 ${formatFieldDuration(MAX_MS)}/次\n`);

const batchStartedAt = performance.now();
const byTreatment = {};
for (const tid of TREATMENT_IDS) {
  byTreatment[tid] = [];
  for (const seed of FIELD_SEEDS) {
    process.stdout.write(`  ${tid} seed${seed}…`);
    byTreatment[tid].push(runOne(tid, seed));
  }
}

const batchVerdict = verifyPhase86Batch(byTreatment);

const report = {
  runAt: new Date().toISOString(),
  phase: 86,
  extension: 'gap_env_terrain_pcp',
  mode: 'field_stat',
  cohort: '12 beings (001-006 ×2)',
  ticks: TICKS,
  seeds: FIELD_SEEDS,
  treatments: PHASE86_TREATMENTS,
  batchVerdict,
  shortTermGoal: 'GAP-ENV terrain L/O + [PCP] 水循环',
  roadmap: 'docs/PHASE86_PCP_TERRAIN.md',
  runBudgetMs: MAX_MS,
};

writeFileSync(
  new URL('../docs/field-phase86-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== PCP 对照（pcp_off_L vs pcp_on_L）===');
for (const cmp of batchVerdict.pcpComparisons) {
  console.log(
    `  seed${cmp.seed}: inject off=${cmp.offInject} on=${cmp.onInject} Δ=${cmp.injectDelta?.toFixed?.(4) ?? cmp.injectDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 陆海对照（pcp_on_L vs pcp_on_O）===');
for (const cmp of batchVerdict.terrainComparisons) {
  console.log(
    `  seed${cmp.seed}: e1 L=${cmp.e1Land} O=${cmp.e1Ocean} Δ=${cmp.e1Delta} drwOceanΔ=${cmp.drwOceanDelta} → ${cmp.verdict}`
  );
}

console.log('\n=== 批次判定 ===');
console.log(`PCP 可观测: ${batchVerdict.pcpObserved ? '✓' : '✗'}`);
console.log(`综合: ${batchVerdict.verdict}`);

console.log('\n报告已写入 docs/field-phase86-report.json');

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

await maybeUploadFieldReport({ phase: 86, report });
