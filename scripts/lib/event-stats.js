/** 从 Recorder 或 StatsRecorder 读取事件计数 */

export function evoCount(recorder, kind) {
  if (recorder.evo) return recorder.evo(kind);
  if (recorder.counts) return recorder.counts[`evolution:${kind}`] ?? 0;
  return recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === kind).length;
}

export function viaCount(recorder, kind) {
  if (!recorder.entries?.length) return 0;
  return recorder.entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === kind).length;
}

export function endCount(recorder, reason = null) {
  if (recorder.endReasons) {
    if (reason) return recorder.endReasons[reason] ?? 0;
    return Object.values(recorder.endReasons).reduce((a, b) => a + b, 0);
  }
  const ends = recorder.entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  if (!reason) return ends.length;
  return ends.filter((e) => e.meta?.reason === reason).length;
}

export function evoWithMeta(recorder, kind, pred) {
  return recorder.entries.filter(
    (e) => e.channel === 'evolution' && e.meta?.kind === kind && (!pred || pred(e.meta))
  ).length;
}
