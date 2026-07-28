/** 事件记忆迹分析 — MEM 与 RX/TX/ACT 配对 */

export function analyzeMemoryTrace(entries, beingId, ticks) {
  const mems = entries.filter((e) => e.channel === 'memory' && e.beingId === beingId);
  const rxs = entries.filter((e) => e.channel === 'signal' && e.beingId === beingId);
  const txs = entries.filter(
    (e) => e.channel === 'external' && e.beingId === beingId && e.content.startsWith('[TX]')
  );
  const acts = entries.filter(
    (e) => e.channel === 'external' && e.beingId === beingId && e.content.startsWith('[ACT]')
  );

  const memRx = mems.filter((m) => m.meta?.kind === 'RX');
  const memTx = mems.filter((m) => m.meta?.kind === 'TX');
  const memAct = mems.filter((m) => m.meta?.kind === 'ACT');

  const expected = rxs.length + txs.length + acts.length;

  return {
    memTotal: mems.length,
    memRx: memRx.length,
    memTx: memTx.length,
    memAct: memAct.length,
    rxCount: rxs.length,
    txCount: txs.length,
    actCount: acts.length,
    expected,
    pairingRate: expected ? mems.length / expected : null,
    rxPaired: memRx.length === rxs.length,
    txPaired: memTx.length === txs.length,
    actPaired: memAct.length === acts.length,
    uniqueRefTicks: new Set(mems.map((m) => m.meta?.refTick)).size,
  };
}

export function compareSoloDualMemory(soloEntries, soloId, dualEntries, dualId, ticks) {
  return {
    solo: analyzeMemoryTrace(soloEntries, soloId, ticks),
    dual: analyzeMemoryTrace(dualEntries, dualId, ticks),
  };
}
