/** 种群层（L3）田野统计 — 资源压力、枯竭与存续 */

export function analyzePopulationPressure(entries, ticks) {
  const deps = entries.filter((e) => e.channel === 'environment' && e.meta?.kind === 'DEP');
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const cmps = entries.filter((e) => e.channel === 'population' && e.meta?.kind === 'CMP');
  const contests = entries.filter((e) => e.meta?.kind === 'CONTEST');
  const nodeLogs = entries.filter((e) => e.channel === 'nodes' && e.meta?.nodes);

  const window = 50;
  let endsAfterDep = 0;
  for (const dep of deps) {
    endsAfterDep += ends.filter((e) => e.tick >= dep.tick && e.tick <= dep.tick + window).length;
  }

  const structDepSeries = cmps.map((c) => {
    const depSoFar = deps.filter((d) => d.tick <= c.tick).length;
    const endSoFar = ends.filter((e) => e.tick <= c.tick).length;
    return {
      tick: c.tick,
      struct: c.meta.structIdx,
      depSoFar,
      endSoFar,
      pop: c.meta.pop,
      depPer100: +((depSoFar / c.tick) * 100).toFixed(4),
    };
  });

  const lowStruct = structDepSeries.filter((s) => s.struct <= 0.35);
  const highStruct = structDepSeries.filter((s) => s.struct >= 0.55);
  const mean = (arr, key) =>
    arr.length ? arr.reduce((a, x) => a + x[key], 0) / arr.length : null;

  const finalNodes = nodeLogs.filter((n) => n.tick === ticks)[0]?.meta?.nodes ?? [];
  const meanNodeLevel = finalNodes.length
    ? finalNodes.reduce((a, n) => a + n.level, 0) / finalNodes.length
    : null;

  return {
    depCount: deps.length,
    endCount: ends.length,
    depRate: +(deps.length / ticks).toFixed(4),
    endRate: +(ends.length / ticks).toFixed(4),
    endsAfterDep,
    avgEndsPerDep: deps.length ? +(endsAfterDep / deps.length).toFixed(4) : 0,
    contestCount: contests.length,
    structDepSeries,
    avgDepPer100LowStruct: mean(lowStruct, 'depPer100'),
    avgDepPer100HighStruct: mean(highStruct, 'depPer100'),
    avgEndPer100LowStruct: mean(lowStruct, 'endSoFar'),
    finalStruct: structDepSeries.at(-1)?.struct ?? null,
    structDrift:
      structDepSeries.length >= 2
        ? +(structDepSeries.at(-1).struct - structDepSeries[0].struct).toFixed(4)
        : null,
    meanNodeLevel: meanNodeLevel != null ? +meanNodeLevel.toFixed(4) : null,
    depletedNodeCount: finalNodes.filter((n) => n.level < 0.15).length,
  };
}

export function evaluatePopulationHypotheses(pop, viability, composition) {
  const h1 =
    pop.depCount >= 3 && pop.avgEndsPerDep >= 0.5
      ? 'support'
      : pop.depCount === 0
        ? 'pending'
        : 'unsupport';

  const h2 =
    pop.avgDepPer100LowStruct != null &&
    pop.avgDepPer100HighStruct != null &&
    pop.avgDepPer100LowStruct > pop.avgDepPer100HighStruct + 0.01
      ? 'support'
      : 'pending';

  const h3 =
    viability.endCount > 0 && viability.lineageCount > 0 && composition.finalPop === 4
      ? 'support'
      : composition.finalPop < 4
        ? 'unsupport'
        : 'pending';

  return {
    H1_depPrecedesEnd: {
      verdict: h1,
      depCount: pop.depCount,
      avgEndsPerDep: pop.avgEndsPerDep,
    },
    H2_meshMoreCompetition: {
      verdict: h2,
      lowStructDep: pop.avgDepPer100LowStruct,
      highStructDep: pop.avgDepPer100HighStruct,
    },
    H3_populationMaintained: {
      verdict: h3,
      finalPop: composition.finalPop,
      endCount: viability.endCount,
      lineageCount: viability.lineageCount,
    },
  };
}
