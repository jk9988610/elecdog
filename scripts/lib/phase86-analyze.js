/** Phase 86 — GAP-ENV terrain L/O + [PCP] 田野分析 */

import { OCEAN_CHANNEL } from '../../src/world/place.js';

export function analyzePcpField(recorder, beings, world, { ticks } = {}) {
  const entries = recorder.entries ?? [];
  const ends = entries.filter((e) => e.channel === 'viability' && e.meta?.kind === 'END');
  const lows = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'LOW');
  const drws = entries.filter((e) => e.channel === 'metabolism' && e.meta?.kind === 'DRW');
  const pcpLogs = entries.filter((e) => e.meta?.kind === 'PCP');

  const ps = world.pcpStats ?? {};
  const pcp = world.pcp ?? {};
  const terrain = world.place?.terrain ?? world.envProfile?.placeTerrain ?? null;
  const ch = world.substrate?.channels ?? [];
  const alive = beings.filter((b) => b.alive);

  const oceanLow = lows.filter((e) => e.meta?.idx === OCEAN_CHANNEL).length;
  const landLow = lows.length - oceanLow;
  const oceanDrw = drws.filter((e) => e.meta?.idx === OCEAN_CHANNEL).length;
  const landDrw = drws.length - oceanDrw;

  return {
    ticks: ticks ?? null,
    terrain,
    birthPlace: world.birthPlace,
    pcpEnabled: world.envProfile?.pcpEnabled === true,
    endCount: ends.length,
    aliveCount: alive.length,
    lowCount: lows.length,
    landLow,
    oceanLow,
    landDrw,
    oceanDrw,
    pcpEvents: pcp.events ?? ps.events ?? 0,
    pcpInject: +(pcp.totalInject ?? ps.totalInject ?? 0).toFixed(4),
    atmoStore: +(pcp.atmoStore ?? 0).toFixed(4),
    e1Final: ch[OCEAN_CHANNEL] != null ? +ch[OCEAN_CHANNEL].toFixed(4) : null,
    e2Final: ch[2] != null ? +ch[2].toFixed(4) : null,
    pcpLogCount: pcpLogs.length,
    maxGeneration: Math.max(0, ...beings.map((b) => b.generation ?? 0)),
  };
}

export function comparePcpOnOff(offMetrics, onMetrics) {
  const pcpActive = onMetrics.pcpEvents > 0 || onMetrics.pcpInject > 0;
  const injectDelta = onMetrics.pcpInject - offMetrics.pcpInject;
  const lowDelta = offMetrics.lowCount - onMetrics.lowCount;

  let verdict = 'pending';
  if (pcpActive && injectDelta > 0.05) verdict = 'support';
  else if (pcpActive && injectDelta > 0) verdict = 'weak';
  else if (!pcpActive) verdict = 'no_pcp';
  else verdict = 'unsupport';

  return {
    offLow: offMetrics.lowCount,
    onLow: onMetrics.lowCount,
    lowDelta,
    offInject: offMetrics.pcpInject,
    onInject: onMetrics.pcpInject,
    injectDelta,
    pcpEvents: onMetrics.pcpEvents,
    verdict,
  };
}

export function compareTerrainLvsO(landMetrics, oceanMetrics) {
  const e1Delta = (oceanMetrics.e1Final ?? 0) - (landMetrics.e1Final ?? 0);
  const oceanLowDelta = oceanMetrics.oceanLow - landMetrics.oceanLow;
  const drwOceanDelta = oceanMetrics.oceanDrw - landMetrics.oceanDrw;

  let verdict = 'pending';
  if (e1Delta >= 0.02 && drwOceanDelta >= 3) verdict = 'support';
  else if (e1Delta > 0 || oceanLowDelta < 0) verdict = 'weak';
  else verdict = 'unsupport';

  return {
    e1Land: landMetrics.e1Final,
    e1Ocean: oceanMetrics.e1Final,
    e1Delta: +e1Delta.toFixed(4),
    oceanLowLand: landMetrics.oceanLow,
    oceanLowOcean: oceanMetrics.oceanLow,
    drwOceanDelta,
    verdict,
  };
}

export function verifyPhase86Batch(runsByTreatment) {
  const seeds = runsByTreatment.pcp_off_L?.length ?? 0;
  const pcpComparisons = [];
  let pcpSupport = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.pcp_off_L[i]?.metrics;
    const on = runsByTreatment.pcp_on_L[i]?.metrics;
    if (!off || !on) continue;
    const cmp = comparePcpOnOff(off, on);
    pcpComparisons.push({ seed: i, terrain: 'L', ...cmp });
    if (cmp.verdict === 'support') pcpSupport++;
  }

  const terrainComparisons = [];
  let terrainSupport = 0;
  for (let i = 0; i < seeds; i++) {
    const land = runsByTreatment.pcp_on_L[i]?.metrics;
    const ocean = runsByTreatment.pcp_on_O[i]?.metrics;
    if (!land || !ocean) continue;
    const cmp = compareTerrainLvsO(land, ocean);
    terrainComparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') terrainSupport++;
  }

  const pcpObserved = pcpComparisons.some((c) => c.verdict !== 'no_pcp');
  let verdict = 'unsupport';
  if (pcpSupport >= 2 && terrainSupport >= 1) verdict = 'support';
  else if ((pcpSupport >= 1 || pcpComparisons.some((c) => c.verdict === 'weak')) && pcpObserved)
    verdict = 'weak';
  else if (!pcpObserved) verdict = 'no_pcp_observed';

  return {
    seedsCompared: pcpComparisons.length,
    pcpSupport,
    terrainSupport,
    pcpComparisons,
    terrainComparisons,
    pcpObserved,
    verdict,
    gapEnvStatus: verdict === 'support' ? 'pcp_terrain_support' : 'pcp_record_layer',
  };
}
