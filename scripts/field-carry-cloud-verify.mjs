#!/usr/bin/env node
/**
 * Phase 122 — 留置链谱系本地校验（无需 Supabase）
 */
import { existsSync, readFileSync } from 'fs';
import {
  CARRY_CLOUD_PHASES,
  CARRY_MANIFEST_PHASE,
  buildCarryManifest,
  carryLineageHeadline,
  extractCarryLineage,
} from './lib/field-carry-cloud.mjs';

let failed = 0;

console.log('留置链谱系田野报告校验\n');

const uploads = [];

for (const phase of CARRY_CLOUD_PHASES) {
  const path = new URL(`../docs/field-phase${phase}-report.json`, import.meta.url);
  if (!existsSync(path)) {
    console.error(`✗ Phase ${phase}: 缺少 docs/field-phase${phase}-report.json`);
    failed += 1;
    continue;
  }
  const report = JSON.parse(readFileSync(path, 'utf8'));
  const lineage = extractCarryLineage(report);
  if (!lineage.snapshotCount) {
    console.error(`✗ Phase ${phase}: 无 carrySnapshots`);
    failed += 1;
    continue;
  }
  const headline = carryLineageHeadline(phase, report);
  const headlineText = headline ? `${headline.metric}=${headline.value}` : '—';
  console.log(
    `✓ Phase ${phase}: ${lineage.snapshotCount} 快照 · 链深≤${lineage.maxChainDepth} · ${headlineText}`
  );
  uploads.push({
    phase,
    summary: {
      extension: report.extension,
      headline,
      carryLineage: {
        entryCount: lineage.entryCount,
        runCount: lineage.runCount,
        maxMixedTicks: lineage.maxMixedTicks,
        maxChainDepth: lineage.maxChainDepth,
        turbo: lineage.turbo,
        snapshotCount: lineage.snapshotCount,
        uniqueStages: lineage.uniqueStages,
        chain: lineage.chain,
      },
      ticks: report.ticks ?? report.mixedTicks ?? null,
      cohort: report.cohort ?? null,
    },
    logPath: '(local)',
    publicUrl: null,
  });
}

const manifest = buildCarryManifest(uploads);
if (manifest.kind !== 'field-carry-manifest') {
  console.error('✗ 清单 kind 错误');
  failed += 1;
}
if (manifest.phase !== CARRY_MANIFEST_PHASE) {
  console.error(`✗ 清单 phase 应为 ${CARRY_MANIFEST_PHASE}`);
  failed += 1;
}
if (manifest.lineageRollup.maxChainDepth < 5) {
  console.error(`✗ 最大链深 ${manifest.lineageRollup.maxChainDepth} < 5`);
  failed += 1;
} else {
  console.log(
    `\n✓ 谱系清单: ${manifest.lineageRollup.totalSnapshots} 快照 · 最大链深 ${manifest.lineageRollup.maxChainDepth} · turbo ${manifest.lineageRollup.turboPhases.join(',')}`
  );
}

if (failed) process.exit(1);
console.log('\n留置链谱系报告校验通过');
