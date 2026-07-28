/** 种群结构 [CMP] 统计 — 观察簇状 vs 网状倾向，不贴地球生物标签 */

export function analyzeComposition(entries) {
  const cmps = entries.filter((e) => e.channel === 'population' && e.meta?.kind === 'CMP');
  if (!cmps.length) {
    return {
      cmpCount: 0,
      structSeries: [],
      avgStruct: null,
      clusterDominant: null,
      meshDominant: null,
    };
  }

  const structSeries = cmps.map((c) => ({
    tick: c.tick,
    struct: c.meta.structIdx,
    pop: c.meta.pop,
    codeHom: c.meta.codeHom,
    lineageHom: c.meta.lineageHom,
    spread: c.meta.spread,
    clusterScore: c.meta.clusterScore,
    meshScore: c.meta.meshScore,
  }));

  const avgStruct =
    structSeries.reduce((s, x) => s + x.struct, 0) / structSeries.length;
  const clusterDominant = structSeries.filter((x) => x.struct >= 0.55).length;
  const meshDominant = structSeries.filter((x) => x.struct <= 0.45).length;

  const first = structSeries[0];
  const last = structSeries[structSeries.length - 1];
  const structDrift = last.struct - first.struct;

  return {
    cmpCount: cmps.length,
    structSeries,
    avgStruct: +avgStruct.toFixed(4),
    structDrift: +structDrift.toFixed(4),
    clusterDominant,
    meshDominant,
    finalPop: last.pop,
    finalCodeHom: last.codeHom,
    finalLineageHom: last.lineageHom,
  };
}

export function compareComposition(soloCmp, multiCmp) {
  return {
    soloAvgStruct: soloCmp.avgStruct,
    multiAvgStruct: multiCmp.avgStruct,
    structGap: multiCmp.avgStruct != null && soloCmp.avgStruct != null
      ? +(multiCmp.avgStruct - soloCmp.avgStruct).toFixed(4)
      : null,
    multiMoreCluster: multiCmp.avgStruct > soloCmp.avgStruct + 0.05,
    multiMoreMesh: multiCmp.avgStruct < soloCmp.avgStruct - 0.05,
  };
}
