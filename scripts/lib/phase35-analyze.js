/** Phase 35 — 多细胞 / 延迟独立 / 种群区分 */

export function analyzePhase35(entries, beings, { juvenileWindow = 80 } = {}) {
  const lineageEvents = entries.filter((e) => e.channel === 'system' && e.content?.includes('[LINEAGE]'));
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const nur = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'NUR');
  const intra = entries.filter((e) => e.channel === 'cell' && e.meta?.kind === 'INTRA');
  const org = entries.filter((e) => e.channel === 'cell' && e.meta?.kind === 'ORG');

  const beingById = Object.fromEntries(beings.map((b) => [b.id, b]));

  const juvenileEnds = [];
  const lineageEnds = [];
  for (const e of ends) {
    const b = beingById[e.beingId];
    const age = b?.tickCount ?? null;
    const gen = e.meta?.generation ?? b?.generation ?? 0;
    if (gen >= 1) {
      lineageEnds.push({ beingId: e.beingId, age, gen });
      if (age != null && age <= juvenileWindow) juvenileEnds.push({ beingId: e.beingId, age, gen });
    }
  }

  const alive = beings.filter((b) => b.alive);
  const aliveLineage = alive.filter((b) => (b.generation ?? 0) >= 1);
  const unicellAlive = alive.filter((b) => b.organismType !== 'multicell');
  const multicellAlive = alive.filter((b) => b.organismType === 'multicell');
  const dependentAlive = alive.filter((b) => b.independent === false);

  const lineageSpawn = lineageEvents.length;
  const juvenileEndRate = lineageEnds.length
    ? +(juvenileEnds.length / lineageEnds.length).toFixed(4)
    : null;

  const intraByRole = {};
  for (const e of intra) {
    const role = e.meta?.subRole ?? e.meta?.toRole ?? e.meta?.phase ?? 'other';
    intraByRole[role] = (intraByRole[role] ?? 0) + 1;
  }

  const nurSeed = nur.filter((e) => e.meta?.phase === 'seed').length;
  const nurTick = nur.filter((e) => e.meta?.phase === 'tick').length;
  const nurIndependent = nur.filter((e) => e.meta?.phase === 'independent').length;

  return {
    lineageSpawn,
    lineageEndCount: lineageEnds.length,
    juvenileEndCount: juvenileEnds.length,
    juvenileEndRate,
    netLineage: lineageSpawn - lineageEnds.length,
    aliveTotal: alive.length,
    aliveLineage: aliveLineage.length,
    unicellAlive: unicellAlive.length,
    multicellAlive: multicellAlive.length,
    dependentAlive: dependentAlive.length,
    populationBeings: alive.length,
    organismMulticell: multicellAlive.length,
    organismUnicell: unicellAlive.length,
    nurCount: nur.length,
    nurSeed,
    nurTick,
    nurIndependent,
    intraCount: intra.length,
    intraByRole,
    orgUnicell: org.filter((e) => e.meta?.organismType === 'unicell').length,
    orgMulticell: org.filter((e) => e.meta?.organismType === 'multicell').length,
    shkCount: entries.filter((e) => e.meta?.kind === 'SHK').length,
    lowCount: entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW').length,
  };
}

export function compareNursedVsInstant(instantMetrics, nursedMetrics) {
  const jDelta = (nursedMetrics.juvenileEndRate ?? 0) - (instantMetrics.juvenileEndRate ?? 0);
  const netDelta = nursedMetrics.netLineage - instantMetrics.netLineage;
  const aliveDelta = nursedMetrics.aliveLineage - instantMetrics.aliveLineage;

  return {
    juvenileEndRate: {
      instant: instantMetrics.juvenileEndRate,
      nursed: nursedMetrics.juvenileEndRate,
      delta: +jDelta.toFixed(4),
      verdict:
        jDelta <= -0.08 ? 'nursed_better' : jDelta >= 0.05 ? 'nursed_worse' : 'pending',
    },
    netLineage: {
      instant: instantMetrics.netLineage,
      nursed: nursedMetrics.netLineage,
      delta: netDelta,
      verdict: netDelta >= 5 ? 'nursed_better' : netDelta <= -3 ? 'nursed_worse' : 'pending',
    },
    aliveLineage: {
      instant: instantMetrics.aliveLineage,
      nursed: nursedMetrics.aliveLineage,
      delta: aliveDelta,
      verdict: aliveDelta >= 1 ? 'nursed_better' : aliveDelta <= -1 ? 'nursed_worse' : 'pending',
    },
  };
}

export function distinguishOrganismVsPopulation(metrics, beings) {
  const alive = beings.filter((b) => b.alive);
  const uniqueIds = new Set(alive.map((b) => b.id)).size;
  const multicellOrganisms = alive.filter((b) => b.organismType === 'multicell');
  const subCellUnits = multicellOrganisms.reduce((s, b) => s + (b.subCells?.length ?? 0), 0);

  return {
    populationCount: uniqueIds,
    multicellOrganismCount: multicellOrganisms.length,
    subCellUnitCount: subCellUnits,
    distinction:
      uniqueIds > multicellOrganisms.length || subCellUnits > multicellOrganisms.length
        ? 'population_ids_gt_subunits'
        : 'pending',
    note:
      '种群 = 独立身份证 being 数；多细胞个体 = 1 being 含多 subCell，一次 END 终止整 organism',
  };
}
