/** Phase 111 — 从田野报告解析留置快照 */

export function isFieldCarryReport(obj) {
  return Boolean(
    obj &&
      typeof obj === 'object' &&
      typeof obj.phase === 'number' &&
      obj.aggregate &&
      Array.isArray(obj.treatmentIds)
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
  for (const tid of report.treatmentIds ?? Object.keys(report.aggregate ?? {})) {
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

export function parseFieldReportJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON 解析失败');
  }
  if (!isFieldCarryReport(data)) {
    throw new Error('不是有效的田野留置报告（需 phase + aggregate + treatmentIds）');
  }
  const entries = listCarryImportEntries(data);
  if (!entries.length) {
    throw new Error('报告中未找到可导入的 carrySnapshots（请使用 Phase 111+ 田野报告）');
  }
  return { report: data, entries };
}
