/**
 * Phase 110–121 留置链谱系云归档摘要
 */
import {
  listCarryImportEntries,
  summarizeCarryReport,
} from '../../src/carry/import-report.js';

/** 本地含 carrySnapshots 的田野阶段 */
export const CARRY_CLOUD_PHASES = [110, 112, 113, 115, 116, 117, 118, 119, 121];

export const CARRY_MANIFEST_PHASE = 122;

/** @type {Record<number, { id: string, key: string, label: string }>} */
export const CARRY_HEADLINE_TREATMENT = {
  110: { id: 'ev110_coop_on', key: 'meanCarryCoopAdv', label: 'COOP_adv' },
  112: { id: 'ev112_quad_chain', key: 'meanChainDepth', label: '链深' },
  113: { id: 'ev113_coop_long', key: 'meanChainDepth', label: '链深' },
  115: { id: 'ev115_penta_chain', key: 'meanChainDepth', label: '链深' },
  116: { id: 'ev116_sculpt_long', key: 'meanChainDepth', label: '链深' },
  117: { id: 'ev117_hexa_chain', key: 'meanChainDepth', label: '链深' },
  118: { id: 'ev118_coop_hexa', key: 'meanCarryCoopAdv', label: 'COOP_adv' },
  119: { id: 'ev119_long_8192', key: 'meanChainDepth', label: '链深' },
  121: { id: 'ev121_coop_long', key: 'meanCarryCoopAdv', label: 'COOP_adv' },
};

/**
 * @param {object} report
 */
export function extractCarryLineage(report) {
  const summary = summarizeCarryReport(report);
  const entries = listCarryImportEntries(report);
  const snapshots = entries.map((e) => {
    const chain = e.snapshot?.provenance?.chain ?? [];
    return {
      key: e.key,
      treatmentId: e.treatmentId,
      seed: e.seed,
      code: e.snapshot?.code ?? null,
      generation: e.snapshot?.generation ?? 0,
      envId: e.snapshot?.provenance?.envId ?? null,
      chainStage: e.snapshot?.provenance?.chainStage ?? null,
      chainDepth: chain.length,
      chainStages: chain.map((c) => c.stage).filter(Boolean),
      chainEnvs: chain.map((c) => c.envId).filter(Boolean),
    };
  });
  const stageSet = new Set();
  for (const snap of snapshots) {
    for (const stage of snap.chainStages) stageSet.add(stage);
  }
  return {
    phase: report.phase,
    extension: report.extension ?? null,
    chain: report.chain ?? null,
    ...summary,
    snapshotCount: snapshots.length,
    uniqueStages: [...stageSet],
    snapshots,
  };
}

/**
 * @param {number} phase
 * @param {object} report
 */
export function carryLineageHeadline(phase, report) {
  const def = CARRY_HEADLINE_TREATMENT[phase];
  if (!def || !report?.aggregate) return null;
  const row = report.aggregate[def.id];
  if (!row || row[def.key] == null) return null;
  return {
    treatmentId: def.id,
    treatmentLabel: row.label ?? def.id,
    metric: def.label,
    value: row[def.key],
  };
}

/**
 * @param {object} report
 */
export function enrichCarrySummary(report) {
  const lineage = extractCarryLineage(report);
  const headline = carryLineageHeadline(report.phase, report);
  return {
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
    headline,
    cohort: report.cohort ?? null,
    seedCount: report.seeds?.length ?? 0,
  };
}

/**
 * @param {Array<{ phase: number, summary?: object, logPath?: string, publicUrl?: string }>} uploads
 */
export function buildCarryManifest(uploads) {
  const phases = uploads.map((u) => ({
    phase: u.phase,
    extension: u.summary?.extension ?? null,
    logPath: u.logPath ?? null,
    publicUrl: u.publicUrl ?? null,
    headline: u.summary?.headline ?? null,
    carryLineage: u.summary?.carryLineage ?? null,
    ticks: u.summary?.ticks ?? null,
    cohort: u.summary?.cohort ?? null,
  }));

  const headlines = phases
    .filter((p) => p.headline?.value != null)
    .map((p) => ({
      phase: p.phase,
      metric: p.headline.metric,
      value: p.headline.value,
      treatment: p.headline.treatmentLabel,
    }));

  const lineageRollup = {
    phases: uploads.map((u) => u.phase),
    totalSnapshots: phases.reduce((s, p) => s + (p.carryLineage?.snapshotCount ?? 0), 0),
    maxChainDepth: Math.max(0, ...phases.map((p) => p.carryLineage?.maxChainDepth ?? 0)),
    maxMixedTicks: Math.max(0, ...phases.map((p) => p.carryLineage?.maxMixedTicks ?? 0)),
    stages: [...new Set(phases.flatMap((p) => p.carryLineage?.uniqueStages ?? []))],
    turboPhases: phases.filter((p) => p.carryLineage?.turbo).map((p) => p.phase),
  };

  return {
    runAt: new Date().toISOString(),
    phase: CARRY_MANIFEST_PHASE,
    extension: 'field_carry_cloud_archive',
    kind: 'field-carry-manifest',
    shortTermGoal: '留置链谱系云归档',
    stackPhases: uploads.map((u) => u.phase),
    phases,
    headlines,
    lineageRollup,
    design: {
      scope: '留置进化链 Phase 110–121 含 carrySnapshots 的田野报告',
      source: 'docs/field-phase{N}-report.json',
      provenance: 'carrySnapshots[].provenance.chain',
    },
    roadmap: 'docs/PHASE122_CARRY_CLOUD.md',
  };
}
