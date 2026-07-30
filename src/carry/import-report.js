/** Phase 111 — 从田野报告解析留置快照 */

import { groupEntriesByRun } from './mixed-cohort.js';

export function resolveTreatmentIds(report) {
  if (Array.isArray(report?.treatmentIds) && report.treatmentIds.length) {
    return report.treatmentIds;
  }
  return Object.keys(report?.aggregate ?? {});
}

export function isFieldCarryReport(obj) {
  return Boolean(
    obj &&
      typeof obj === 'object' &&
      typeof obj.phase === 'number' &&
      obj.aggregate &&
      typeof obj.aggregate === 'object' &&
      resolveTreatmentIds(obj).length > 0
  );
}

export function validateCarrySnapshot(snap) {
  if (!snap || typeof snap !== 'object') return '快照无效';
  if (!snap.dnaSequence || typeof snap.dnaSequence !== 'string') return '缺少 dnaSequence';
  if (!snap.dnaSequence.length) return 'dnaSequence 为空';
  return null;
}

/** 扁平化报告中所有可导入留置条目 */
export function listCarryImportEntries(report) {
  if (!isFieldCarryReport(report)) return [];
  const entries = [];
  for (const tid of resolveTreatmentIds(report)) {
    const agg = report.aggregate?.[tid];
    if (!agg) continue;
    for (const run of agg.runs ?? []) {
      const snaps = run.carrySnapshots ?? [];
      snaps.forEach((snapshot, index) => {
        const err = validateCarrySnapshot(snapshot);
        if (err) return;
        entries.push({
          key: `${tid}:seed${run.seed}:c${index}`,
          treatmentId: tid,
          treatmentLabel: agg.label ?? tid,
          seed: run.seed,
          index,
          phase: run.phase ?? report.phase,
          snapshot,
          summary: run.carries?.[index] ?? null,
        });
      });
    }
  }
  return entries;
}

/** 从报告元数据推断观察台环境 */
export function suggestObserverEnvId(report, entry) {
  const mixed = report.mixedEnvId;
  if (mixed) return mixed;
  const chain = entry?.snapshot?.provenance?.chain ?? [];
  const last = chain[chain.length - 1]?.envId;
  if (last) return last;
  return entry?.snapshot?.provenance?.envId ?? 'observer_wl_stack';
}

export { groupEntriesByRun, pickRunCarryBatch } from './mixed-cohort.js';

/** 报告摘要 — 观察台导入面板元数据 */
export function summarizeCarryReport(report) {
  const entries = listCarryImportEntries(report);
  const runGroups = groupEntriesByRun(entries);
  let maxMixedTicks = 0;
  for (const tid of resolveTreatmentIds(report)) {
    const agg = report.aggregate?.[tid];
    const aggTicks = agg?.mixedTicks ?? 0;
    for (const run of agg?.runs ?? []) {
      maxMixedTicks = Math.max(maxMixedTicks, run.mixedTicks ?? aggTicks);
    }
  }
  const maxChainDepth = entries.reduce(
    (m, e) => Math.max(m, e.snapshot?.provenance?.chain?.length ?? 0),
    0
  );
  const turbo = Boolean(
    report.turbo?.fieldTurboMode ||
      Object.values(report.aggregate ?? {}).some((a) => a?.fieldTurboMode === true)
  );
  return {
    phase: report.phase,
    entryCount: entries.length,
    runCount: runGroups.length,
    maxMixedTicks,
    maxChainDepth,
    turbo,
    extension: report.extension ?? null,
  };
}

export function parseFieldReportJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON 解析失败');
  }
  if (!isFieldCarryReport(data)) {
    throw new Error('不是有效的田野留置报告（需 phase + aggregate）');
  }
  const entries = listCarryImportEntries(data);
  if (!entries.length) {
    throw new Error('报告中未找到可导入的 carrySnapshots（请使用 Phase 111+ 田野报告）');
  }
  return { report: data, entries };
}
