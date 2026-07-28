/** RX 衍生 hex 与信号链分析 */

import { hashString, mulberry32 } from '../../src/core/hash.js';

function toHexByte(n) {
  return Math.floor((n * 255) % 256)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export function predictSignalInternal(signalContent, beingId) {
  const mix = hashString(signalContent + beingId);
  const local = mulberry32(mix);
  return `0x${toHexByte(local())} 0x${toHexByte(local())} 0x${toHexByte(local())}`;
}

export function extractTxFromRx(rxContent) {
  const idx = rxContent.indexOf('[TX]');
  return idx >= 0 ? rxContent.substring(idx) : null;
}

export function analyzeRxHexPredictability(entries, beingId) {
  const rxEntries = entries.filter((e) => e.channel === 'signal' && e.beingId === beingId);
  const rxByTick = {};

  for (const rx of rxEntries) {
    const txPart = extractTxFromRx(rx.content);
    if (!txPart) continue;
    if (!rxByTick[rx.tick]) rxByTick[rx.tick] = [];
    rxByTick[rx.tick].push(txPart);
  }

  let match = 0;
  let mismatch = 0;
  const mismatchSamples = [];

  for (const [tick, txs] of Object.entries(rxByTick)) {
    const signalContent = txs.join('|');
    const predicted = predictSignalInternal(signalContent, beingId);
    const internals = entries
      .filter((e) => e.channel === 'internal' && e.beingId === beingId && e.tick === Number(tick))
      .map((e) => e.content);
    const found = internals.includes(predicted);
    if (found) match++;
    else {
      mismatch++;
      if (mismatchSamples.length < 2) {
        mismatchSamples.push({ tick: Number(tick), signalContent, predicted, internals });
      }
    }
  }

  return {
    rxTickCount: Object.keys(rxByTick).length,
    match,
    mismatch,
    fullyPredictable: mismatch === 0 && match > 0,
    mismatchSamples,
  };
}

export function analyzeSignalChains(entries, beingIds, ticks) {
  const chains = [];

  for (let t = 1; t < ticks; t++) {
    for (const senderId of beingIds) {
      const tx = entries.find(
        (e) =>
          e.tick === t &&
          e.beingId === senderId &&
          e.channel === 'external' &&
          e.content.startsWith('[TX]')
      );
      if (!tx) continue;

      for (const recvId of beingIds) {
        if (recvId === senderId) continue;
        const rx = entries.find(
          (e) =>
            e.tick === t + 1 &&
            e.beingId === recvId &&
            e.channel === 'signal' &&
            e.content.includes(senderId)
        );
        if (!rx) continue;

        const tx2 = entries.find(
          (e) =>
            e.tick === t + 1 &&
            e.beingId === recvId &&
            e.channel === 'external' &&
            e.content.startsWith('[TX]')
        );
        let hop3Id = null;
        if (tx2) {
          for (const thirdId of beingIds) {
            if (thirdId === recvId) continue;
            const rx2 = entries.find(
              (e) =>
                e.tick === t + 2 &&
                e.beingId === thirdId &&
                e.channel === 'signal' &&
                e.content.includes(recvId)
            );
            if (rx2) {
              hop3Id = thirdId;
              break;
            }
          }
        }

        chains.push({
          startTick: t,
          path: [senderId.slice(-4), recvId.slice(-4), hop3Id?.slice(-4)].filter(Boolean),
          hops: hop3Id ? 3 : tx2 ? 2 : 1,
        });
      }
    }
  }

  const hopDist = { 1: 0, 2: 0, 3: 0 };
  for (const c of chains) hopDist[c.hops] = (hopDist[c.hops] || 0) + 1;

  return {
    totalLinks: chains.length,
    hopDistribution: hopDist,
    threeHopCount: hopDist[3] || 0,
    samples: chains.filter((c) => c.hops >= 2).slice(0, 5),
  };
}
