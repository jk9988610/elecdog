#!/usr/bin/env node
/**
 * Phase 111 — 观察台留置快照导入验证
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnCarriedBeing } from '../src/birth/spawn.js';
import {
  listCarryImportEntries,
  parseFieldReportJson,
  suggestObserverEnvId,
  validateCarrySnapshot,
} from '../src/carry/import-report.js';
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

const reportPath = new URL('../docs/field-phase110-report.json', import.meta.url);
let reportText;
try {
  reportText = readFileSync(reportPath, 'utf8');
} catch {
  console.error('✗ 缺少 docs/field-phase110-report.json — 请先运行 npm run field:phase110');
  process.exit(1);
}

const { report, entries } = parseFieldReportJson(reportText);
assert(entries.length > 0, `报告含可导入条目（${entries.length}）`);

const entry = entries[0];
assert(!validateCarrySnapshot(entry.snapshot), '首条快照校验通过');
const envId = suggestObserverEnvId(report, entry);
assert(envId === 'fertile_field', `推断环境为 fertile_field（${envId}）`);

const world = createWorld('M-00-I');
applyEnvProfile(world, envId);
initEnvStackModules(world);
const recorder = new Recorder();
spawnCarriedBeing(world, recorder, entry.snapshot, { cohortTag: 'carry', fixedId: '01imp001' });

const summary = buildCarrySummary(world);
assert(summary.count >= 1, '导入后留置个体可读');
assert(summary.withProvenance >= 1, 'provenance 保留');
assert((entry.snapshot.generation ?? 0) > 0, `非 0 代（代${entry.snapshot.generation}）`);

const flat = listCarryImportEntries(report);
assert(flat.length === entries.length, 'listCarryImportEntries 与 parse 一致');

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('bootstrapWithCarries'), '观察台已挂载导入载入');
const carryImportSrc = readFileSync(new URL('../src/ui/carry-import.js', import.meta.url), 'utf8');
assert(carryImportSrc.includes('carry-import-panel'), '导入面板 HTML 已定义');

const importSrc = readFileSync(new URL('../src/carry/import-report.js', import.meta.url), 'utf8');
assert(importSrc.includes('carrySnapshots'), '解析器识别 carrySnapshots');

if (failed) process.exit(1);
console.log(`\n✓ Phase 111 留置导入验证通过（${entry.treatmentLabel} · 代${entry.snapshot.generation}）`);
