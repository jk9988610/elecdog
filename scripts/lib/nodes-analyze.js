/** 世界节点分析 */

export function analyzeNodeTargeting(entries, ticks) {
  const tgts = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'TGT');
  const deps = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'DEP');
  const acts = entries.filter((e) => e.channel === 'external' && e.content.startsWith('[ACT]'));
  const nodeLogs = entries.filter((e) => e.channel === 'nodes' && !e.meta?.afterAct);

  const targetIds = {};
  for (const t of tgts) {
    const id = t.meta?.nodeId;
    targetIds[id] = (targetIds[id] || 0) + 1;
  }

  const depletedIds = [...new Set(deps.map((d) => d.meta?.nodeId))];

  const lastNodes = nodeLogs.filter((n) => n.tick === ticks)[0]?.meta?.nodes ?? [];

  return {
    tgtCount: tgts.length,
    actCount: acts.length,
    pairingRate: acts.length ? tgts.length / acts.length : null,
    depCount: deps.length,
    depletedIds,
    targetDistribution: targetIds,
    finalLevels: lastNodes,
    nodeLogsPerTick: nodeLogs.length / ticks,
  };
}
