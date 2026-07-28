/** 多体信号链分析 */

export function analyzeNBodyChains(entries, beingIds, ticks, maxHop = 4) {
  const txAt = (t, id) =>
    entries.find(
      (e) => e.tick === t && e.beingId === id && e.channel === 'external' && e.content.startsWith('[TX]')
    );

  const rxFrom = (t, recvId, senderId) =>
    entries.find(
      (e) =>
        e.tick === t &&
        e.beingId === recvId &&
        e.channel === 'signal' &&
        e.content.includes(senderId)
    );

  const hopDist = {};
  const samples = [];

  for (let start = 1; start < ticks - maxHop; start++) {
    for (const a of beingIds) {
      if (!txAt(start, a)) continue;

      for (const b of beingIds) {
        if (b === a || !rxFrom(start + 1, b, a)) continue;

        let path = [a.slice(-4), b.slice(-4)];
        let hops = 1;
        let cur = b;
        let t = start + 1;

        for (let hop = 2; hop <= maxHop; hop++) {
          if (!txAt(t, cur)) break;
          let next = null;
          for (const c of beingIds) {
            if (c === cur) continue;
            if (rxFrom(t + 1, c, cur)) {
              next = c;
              break;
            }
          }
          if (!next) break;
          path.push(next.slice(-4));
          hops = hop;
          cur = next;
          t += 1;
        }

        hopDist[hops] = (hopDist[hops] || 0) + 1;
        if (hops >= 3 && samples.length < 3) {
          samples.push({ start, hops, path });
        }
      }
    }
  }

  const total = Object.values(hopDist).reduce((a, b) => a + b, 0);
  return { hopDistribution: hopDist, total, maxHopObserved: Math.max(...Object.keys(hopDist).map(Number), 0), samples };
}

/** 多 RX 同 tick：记录条数分布 */
export function multiRxDistribution(entries, beingId) {
  const byTick = {};
  for (const e of entries.filter((x) => x.channel === 'signal' && x.beingId === beingId)) {
    byTick[e.tick] = (byTick[e.tick] || 0) + 1;
  }
  const dist = { 0: 0, 1: 0, 2: 0, '3+': 0 };
  for (let t = 1; t <= 200; t++) {
    const n = byTick[t] || 0;
    if (n === 0) dist[0]++;
    else if (n === 1) dist[1]++;
    else if (n === 2) dist[2]++;
    else dist['3+']++;
  }
  return dist;
}
