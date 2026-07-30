#!/usr/bin/env node
/**
 * Phase 114 — 观察台留置混编批次导入验证
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnBeing, spawnCarriedBeing } from '../src/birth/spawn.js';
import { parseFieldReportJson, suggestObserverEnvId } from '../src/carry/import-report.js';
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

const reportText = readFileSync(new URL('../docs/field-phase110-report.json', import.meta.url), 'utf8');
const { report, entries } = parseFieldReportJson(reportText);
const groups = groupEntriesByRun(entries);
assert(groups.length > 0, `run 分组（${groups.length}）`);

const run = groups.find((g) => g.entries.length >= 2) ?? groups[0];
const batch = pickRunCarryBatch(run, MAX_CARRY_BATCH);
assert(batch.length >= 1 && batch.length <= MAX_CARRY_BATCH, `批次 ${batch.length} carry`);

const naiveCount = 4;
const envId = suggestObserverEnvId(report, batch[0]);
const world = createWorld('M-00-B');
applyEnvProfile(world, envId);
initEnvStackModules(world);
const recorder = new Recorder();

for (const spec of buildObserverNaiveSpecs(run.seed, naiveCount)) {
  spawnBeing(world, recorder, spec);
}
batch.forEach((entry, i) => {
  spawnCarriedBeing(world, recorder, entry.snapshot, {
    cohortTag: 'carry',
    fixedId: `01carry${run.seed}${String(i + 1).padStart(3, '0')}`,
  });
});

const naive = world.beings.filter((b) => b.cohortTag === 'naive');
const carried = world.beings.filter((b) => b.cohortTag === 'carry');
assert(naive.length === naiveCount, `naive ${naive.length}/${naiveCount}`);
assert(carried.length === batch.length, `carry ${carried.length}/${batch.length}`);

const summary = buildCarrySummary(world);
assert(summary.count === batch.length, 'carry 面板可读');

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('bootstrapMixedImport'), '观察台混编载入');
const importSrc = readFileSync(new URL('../src/ui/carry-import.js', import.meta.url), 'utf8');
assert(importSrc.includes('btn-carry-import-mixed'), '混编按钮已定义');

if (failed) process.exit(1);
console.log(`\n✓ Phase 114 混编导入验证通过（${naiveCount} naive + ${batch.length} carry）`);
