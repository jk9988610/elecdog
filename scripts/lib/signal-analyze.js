/** 信号相关统计 — 只输出可观测数据 */

export function analyzeSignalImpact(entries, beingId, ticks) {
  const ticksWithRx = new Set(
    entries.filter((e) => e.channel === 'signal' && e.beingId === beingId).map((e) => e.tick)
  );

  const ticksWithRxPrev = new Set([...ticksWithRx].map((t) => t - 1).filter((t) => t >= 1));

  function tickStats(predicate) {
    let internalCount = 0;
    let tickCount = 0;
    let tx = 0;
    let act = 0;
    let extTicks = 0;

    for (let t = 1; t <= ticks; t++) {
      if (!predicate(t)) continue;
      tickCount++;
      const internals = entries.filter(
        (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
      );
      internalCount += internals.length;
      const ext = entries.find(
        (e) => e.channel === 'external' && e.beingId === beingId && e.tick === t
      );
      if (ext) {
        extTicks++;
        if (ext.content.startsWith('[TX]')) tx++;
        else if (ext.content.startsWith('[ACT]')) act++;
      }
    }

    return {
      ticks: tickCount,
      avgInternal: tickCount ? internalCount / tickCount : 0,
      externalRate: tickCount ? extTicks / tickCount : 0,
      txRate: tickCount ? tx / tickCount : 0,
      actRate: tickCount ? act / tickCount : 0,
      txOfExternal: tx + act ? tx / (tx + act) : null,
    };
  }

  return {
    rxTicks: ticksWithRx.size,
    withRx: tickStats((t) => ticksWithRx.has(t)),
    withoutRx: tickStats((t) => !ticksWithRx.has(t) && t >= 1),
  };
}

export function compareSoloVsDual(soloEntries, soloId, dualEntries, dualId, ticks) {
  const solo = analyzeRunLite(soloEntries, soloId, ticks);
  const dual = analyzeRunLite(dualEntries, dualId, ticks);
  const signal = analyzeSignalImpact(dualEntries, dualId, ticks);
  return { solo, dual, signal };
}

function analyzeRunLite(entries, beingId, ticks) {
  let tx = 0;
  let act = 0;
  let extTicks = 0;
  for (let t = 1; t <= ticks; t++) {
    const ext = entries.find(
      (e) => e.channel === 'external' && e.beingId === beingId && e.tick === t
    );
    if (ext) {
      extTicks++;
      if (ext.content.startsWith('[TX]')) tx++;
      else if (ext.content.startsWith('[ACT]')) act++;
    }
  }
  return {
    externalRate: extTicks / ticks,
    txOfExternal: tx + act ? tx / (tx + act) : null,
    txCount: tx,
    actCount: act,
  };
}
