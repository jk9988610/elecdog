/** 环境回响分析 — ACT 与 [RES] 配对统计 */

export function analyzeActResPairing(entries, beingId, ticks) {
  const acts = entries.filter(
    (e) => e.channel === 'external' && e.beingId === beingId && e.content.startsWith('[ACT]')
  );
  const ress = entries.filter((e) => e.channel === 'environment' && e.meta?.fromId === beingId);
  const txs = entries.filter(
    (e) => e.channel === 'external' && e.beingId === beingId && e.content.startsWith('[TX]')
  );
  const resOnTxTicks = entries.filter(
    (e) =>
      e.channel === 'environment' &&
      txs.some((t) => t.tick === e.tick && t.beingId === e.meta?.fromId)
  );

  let matched = 0;
  for (const act of acts) {
    const res = ress.find((r) => r.tick === act.tick && r.meta?.fromId === beingId);
    if (res && res.content.includes(act.content.slice(5))) matched++;
  }

  return {
    actCount: acts.length,
    resCount: ress.length,
    txCount: txs.length,
    matched,
    pairingRate: acts.length ? matched / acts.length : null,
    resOnTxTicks: resOnTxTicks.length,
    orphanRes: ress.length - matched,
  };
}

export function compareExternalStats(entries, beingId, ticks) {
  let extTicks = 0;
  let tx = 0;
  let act = 0;
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
    txCount: tx,
    actCount: act,
  };
}
