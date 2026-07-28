/** 自助求生 / 谱系统计 */

export function analyzeViability(entries, ticks) {
  const svv = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'SVV');
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const lineages = entries.filter((e) => e.channel === 'system' && e.content.includes('[LINEAGE]'));
  const acts = entries.filter((e) => e.channel === 'external' && e.content.startsWith('[ACT]'));

  const highStressActs = [];
  for (const act of acts) {
    const t = act.tick;
    const s = svv.find((v) => v.tick === t && v.beingId === act.beingId);
    if (s && s.meta.stress > 0.28) highStressActs.push(act);
  }

  const generations = lineages.map((l) => l.meta?.generation).filter((g) => g != null);
  const mutations = lineages.map((l) => l.meta?.mutationCount).filter((m) => m != null);

  return {
    svvCount: svv.length,
    endCount: ends.length,
    lineageCount: lineages.length,
    endReasons: ends.map((e) => e.meta?.reason),
    maxGeneration: generations.length ? Math.max(...generations) : 0,
    avgMutation: mutations.length
      ? mutations.reduce((a, b) => a + b, 0) / mutations.length
      : null,
    actCount: acts.length,
    highStressActCount: highStressActs.length,
    highStressActRate: acts.length ? highStressActs.length / acts.length : null,
  };
}

export function populationTimeline(entries, ticks) {
  const births = entries.filter((e) => e.channel === 'ritual' && e.content === '[RITUAL] 完成');
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  return { births: births.length, ends: ends.length, net: births.length - ends.length };
}
