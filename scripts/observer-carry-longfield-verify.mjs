#!/usr/bin/env node
/**
 * Phase 120 — 观察台导入 8192 tick 长时留置快照验证
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing, spawnCarriedBeing } from '../src/birth/spawn.js';
import {
  parseFieldReportJson,
  suggestObserverEnvId,
  summarizeCarryReport,
} from '../src/carry/import-report.js';
import {
  groupEntriesByRun,
  pickRunCarryBatch,
  buildObserverNaiveSpecs,
  MAX_CARRY_BATCH,
} from '../src/carry/mixed-cohort.js';
import { buildCarrySummary } from '../src/ui/carry-panel.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const reportPath = new URL('../docs/field-phase119-report.json', import.meta.url);
let reportText;
try {
  reportText = readFileSync(reportPath, 'utf8');
} catch {
  console.error('✗ 缺少 docs/field-phase119-report.json — 请先运行 npm run field:phase119');
  process.exit(1);
}

const { report, entries } = parseFieldReportJson(reportText);
const sum = summarizeCarryReport(report);
assert(entries.length >= 8, `可导入条目 ${entries.length}`);
assert(sum.maxMixedTicks >= 8192, `长时 mixedTicks ${sum.maxMixedTicks}`);
assert(sum.maxChainDepth >= 5, `链深度 ${sum.maxChainDepth}`);
assert(sum.turbo === true, 'turbo 报告可识别');

const groups = groupEntriesByRun(entries);
const longRun = groups.find((g) => g.treatmentId === 'ev119_long_8192' && g.seed === 0);
assert(longRun != null, 'ev119_long_8192 seed0 run 存在');

const batch = pickRunCarryBatch(longRun, MAX_CARRY_BATCH);
assert(batch.length >= 1, `批次 ${batch.length} carry`);

const chain = batch[0].snapshot.provenance?.chain ?? [];
const stages = chain.map((c) => c.stage);
assert(stages.includes('stress_echo'), 'provenance 含 stress_echo');
assert(stages.includes('soc'), 'provenance 含 soc');
assert(chain.length >= 5, `链长度 ${chain.length}`);

const naiveCount = 4;
const envId = suggestObserverEnvId(report, batch[0]);
const world = createWorld('M-00-LF');
applyEnvProfile(world, envId);
initEnvStackModules(world);
const recorder = new Recorder();

for (const spec of buildObserverNaiveSpecs(longRun.seed, naiveCount)) {
  spawnBeing(world, recorder, spec);
}
batch.forEach((entry, i) => {
  spawnCarriedBeing(world, recorder, entry.snapshot, {
    cohortTag: 'carry',
    fixedId: `01lf${longRun.seed}${String(i + 1).padStart(3, '0')}`,
  });
});

const carried = world.beings.filter((b) => b.cohortTag === 'carry');
assert(carried.length === batch.length, `carry 载入 ${carried.length}`);
assert(
  carried.every((b) => (b.carryProvenance?.chain?.length ?? 0) >= 5),
  '载入后 provenance 链保留'
);
assert((carried[0].generation ?? 0) > 0, `非 0 代（代${carried[0].generation}）`);

const summary = buildCarrySummary(world);
assert(summary.count === batch.length, 'carry 面板可读');

const importSrc = readFileSync(new URL('../src/ui/carry-import.js', import.meta.url), 'utf8');
assert(importSrc.includes('summarizeCarryReport'), '导入面板显示长时摘要');

if (failed) process.exit(1);
console.log(
  `\n✓ Phase 120 长时留置导入验证通过（8192 tick · 链${chain.length} · ${naiveCount} naive + ${batch.length} carry）`
);
