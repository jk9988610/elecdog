/** Phase 34 — LINEAGE 幼体与种群存续（环境选择压） */

export function analyzeLineagePressure(entries, beings, { juvenileWindow = 80 } = {}) {
  const lineageEvents = entries.filter((e) => e.channel === 'system' && e.content?.includes('[LINEAGE]'));
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const births = entries.filter((e) => e.channel === 'ritual' && e.content === '[RITUAL] 完成');

  const beingById = Object.fromEntries(beings.map((b) => [b.id, b]));

  const endAges = [];
  const juvenileEnds = [];
  const lineageEnds = [];
  const gen0Ends = [];

  for (const e of ends) {
    const b = beingById[e.beingId];
    const age = b?.tickCount ?? e.meta?.age ?? null;
    const gen = e.meta?.generation ?? b?.generation ?? 0;
    if (age != null) endAges.push(age);
    if (gen >= 1) {
      lineageEnds.push({ beingId: e.beingId, age, gen, reason: e.meta?.reason });
      if (age != null && age <= juvenileWindow) juvenileEnds.push({ beingId: e.beingId, age, gen });
    } else {
      gen0Ends.push({ beingId: e.beingId, age, reason: e.meta?.reason });
    }
  }

  const alive = beings.filter((b) => b.alive);
  const aliveLineage = alive.filter((b) => (b.generation ?? 0) >= 1);

  const lineageSpawn = lineageEvents.length;
  const endCount = ends.length;
  const juvenileEndRate = lineageEnds.length
    ? +(juvenileEnds.length / lineageEnds.length).toFixed(4)
    : null;
  const lineageEndShare = endCount ? +(lineageEnds.length / endCount).toFixed(4) : null;
  const netLineage = lineageSpawn - lineageEnds.length;

  const meanEndAge =
    endAges.length ? +(endAges.reduce((a, b) => a + b, 0) / endAges.length).toFixed(1) : null;
  const meanJuvenileEndAge = juvenileEnds.length
    ? +(juvenileEnds.reduce((s, x) => s + x.age, 0) / juvenileEnds.length).toFixed(1)
    : null;

  return {
    lineageSpawn,
    endCount,
    lineageEndCount: lineageEnds.length,
    gen0EndCount: gen0Ends.length,
    juvenileEndCount: juvenileEnds.length,
    juvenileEndRate,
    lineageEndShare,
    netLineage,
    aliveTotal: alive.length,
    aliveLineage: aliveLineage.length,
    meanEndAge,
    meanJuvenileEndAge,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
    shkCount: entries.filter((e) => e.meta?.kind === 'SHK').length,
    lowCount: entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW').length,
  };
}

export function evaluateSelectionPressure(baseline, profile, metrics) {
  const bJuvenile = baseline.juvenileEndRate ?? 0;
  const pJuvenile = metrics.juvenileEndRate ?? 0;
  const juvenileDelta = pJuvenile - bJuvenile;

  const bNet = baseline.netLineage;
  const pNet = metrics.netLineage;
  const netDelta = pNet - bNet;

  const h1 =
    juvenileDelta >= 0.12
      ? 'support'
      : juvenileDelta >= 0.05
        ? 'weak'
        : juvenileDelta <= -0.05
          ? 'unsupport'
          : 'pending';

  const h2 =
    netDelta <= -8
      ? 'support'
      : netDelta <= -3
        ? 'weak'
        : netDelta >= 3
          ? 'unsupport'
          : 'pending';

  const h3 =
    metrics.aliveLineage < baseline.aliveLineage - 1
      ? 'support'
      : metrics.aliveLineage <= baseline.aliveLineage
        ? 'weak'
        : 'pending';

  return {
    H1_juvenileEndRateRises: {
      verdict: h1,
      baseline: bJuvenile,
      profile: pJuvenile,
      delta: +juvenileDelta.toFixed(4),
    },
    H2_lineageNetDeclines: {
      verdict: h2,
      baselineNet: bNet,
      profileNet: pNet,
      delta: netDelta,
    },
    H3_survivingLineageFalls: {
      verdict: h3,
      baselineAlive: baseline.aliveLineage,
      profileAlive: metrics.aliveLineage,
    },
  };
}
