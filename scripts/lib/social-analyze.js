/** 社会位 / 社会迹 / 合作田野分析 — Phase 33 GAP-13 */

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = xs[i] - mx;
    const vy = ys[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  return den ? +(num / den).toFixed(4) : null;
}

function slotOf(beingId, slotMap) {
  return slotMap[beingId] ?? null;
}

function initSlotBuckets(slots = ['S0', 'S1', 'S2', 'S3']) {
  const bySlot = {};
  for (const s of slots) {
    bySlot[s] = {
      slot: s,
      endCount: 0,
      lineageAsParent: 0,
      drw: 0,
      low: 0,
      tx: 0,
      tgt: 0,
      rx: 0,
      contestJoins: 0,
      aliveAtEnd: 0,
      beingsEver: 0,
      meanStressAtEnd: null,
      tgtNodes: {},
    };
  }
  return bySlot;
}

export function analyzeSocial(entries, beings) {
  const slotMap = Object.fromEntries(beings.map((b) => [b.id, b.socialSlot]));
  const bySlot = initSlotBuckets([...new Set(Object.values(slotMap))].sort());

  const socials = entries.filter((e) => e.channel === 'social');
  const contests = socials.filter((e) => e.meta?.kind === 'CONTEST');
  const rxLinks = {};

  for (const s of socials) {
    if (s.meta?.kind === 'TX' && s.meta?.slot) bySlot[s.meta.slot].tx++;
    if (s.meta?.kind === 'TGT' && s.meta?.slot) {
      bySlot[s.meta.slot].tgt++;
      const n = s.meta.nodeId;
      bySlot[s.meta.slot].tgtNodes[n] = (bySlot[s.meta.slot].tgtNodes[n] || 0) + 1;
    }
    if (s.meta?.kind === 'RX' && s.meta?.recvSlot) {
      bySlot[s.meta.recvSlot].rx++;
      const emit = s.meta.emitSlot ?? '?';
      const key = `${emit}→${s.meta.recvSlot}`;
      rxLinks[key] = (rxLinks[key] || 0) + 1;
    }
    if (s.meta?.kind === 'CONTEST' && Array.isArray(s.meta?.slots)) {
      for (const sl of s.meta.slots) {
        if (bySlot[sl]) bySlot[sl].contestJoins++;
      }
    }
  }

  const slotSpread = Object.values(bySlot).map((v) => v.tx + v.tgt);
  const maxSpread = slotSpread.length ? Math.max(...slotSpread) : 0;
  const minSpread = slotSpread.length ? Math.min(...slotSpread) : 0;

  return {
    slotMap,
    bySlot,
    contestCount: contests.length,
    rxLinks,
    divisionSkew: maxSpread - minSpread,
    hasPersistentSlots: beings.every((b) => b.socialSlot?.startsWith('S')),
  };
}

export function analyzeSocialBySlot(entries, beings) {
  const social = analyzeSocial(entries, beings);
  const { slotMap, bySlot } = social;

  for (const b of beings) {
    const sl = b.socialSlot;
    if (!bySlot[sl]) continue;
    bySlot[sl].beingsEver++;
    if (b.alive) bySlot[sl].aliveAtEnd++;
  }

  for (const e of entries) {
    if (e.channel === 'viability' && e.meta?.kind === 'END' && e.beingId) {
      const sl = slotOf(e.beingId, slotMap);
      if (sl && bySlot[sl]) bySlot[sl].endCount++;
    }
    if (e.channel === 'system' && e.content?.includes('[LINEAGE]') && e.meta?.parentId) {
      const sl = slotOf(e.meta.parentId, slotMap);
      if (sl && bySlot[sl]) bySlot[sl].lineageAsParent++;
    }
    if (e.channel === 'metabolism' && e.beingId) {
      const sl = slotOf(e.beingId, slotMap);
      if (!sl || !bySlot[sl]) continue;
      if (e.meta?.kind === 'DRW') bySlot[sl].drw++;
      if (e.meta?.kind === 'LOW') bySlot[sl].low++;
    }
  }

  const endStresses = {};
  for (const e of entries) {
    if (e.channel === 'viability' && e.meta?.kind === 'END' && e.beingId) {
      const sl = slotOf(e.beingId, slotMap);
      if (!sl) continue;
      if (!endStresses[sl]) endStresses[sl] = [];
      if (e.meta?.stress != null) endStresses[sl].push(e.meta.stress);
    }
  }
  for (const sl of Object.keys(bySlot)) {
    const arr = endStresses[sl];
    if (arr?.length) {
      bySlot[sl].meanStressAtEnd = +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4);
    }
  }

  return { ...social, bySlot };
}

export function analyzeCooperation(entries, beings) {
  const social = analyzeSocialBySlot(entries, beings);
  const slots = Object.keys(social.bySlot).sort();
  const crossRx = {};
  const withinRx = {};
  for (const [key, n] of Object.entries(social.rxLinks)) {
    const [from, to] = key.split('→');
    if (from === to) withinRx[key] = n;
    else crossRx[key] = n;
  }
  const crossTotal = Object.values(crossRx).reduce((a, b) => a + b, 0);
  const withinTotal = Object.values(withinRx).reduce((a, b) => a + b, 0);

  return {
    ...social,
    crossRx,
    withinRx,
    crossRxTotal: crossTotal,
    withinRxTotal: withinTotal,
    crossRxShare: crossTotal + withinTotal ? +(crossTotal / (crossTotal + withinTotal)).toFixed(4) : null,
  };
}

export function evaluateCooperationHypotheses(cooperation, viability) {
  const slots = Object.values(cooperation.bySlot);
  const endRates = slots.map((s) => (s.beingsEver ? s.endCount / s.beingsEver : 0));
  const endSpread = endRates.length ? Math.max(...endRates) - Math.min(...endRates) : 0;

  const rxCounts = slots.map((s) => s.rx);
  const aliveCounts = slots.map((s) => s.aliveAtEnd);
  const rxAliveCorr = pearson(rxCounts, aliveCounts);

  const contestJoins = slots.map((s) => s.contestJoins);
  const endCounts = slots.map((s) => s.endCount);
  const contestEndCorr = pearson(contestJoins, endCounts);

  const tgtSpread = slots.map((s) => s.tgt);
  const tgtSkew = tgtSpread.length ? Math.max(...tgtSpread) - Math.min(...tgtSpread) : 0;

  const h1 =
    endSpread >= 0.15 ? 'support' : endSpread >= 0.05 ? 'weak' : 'unsupport';
  const h2 =
    rxAliveCorr != null && Math.abs(rxAliveCorr) >= 0.5
      ? rxAliveCorr > 0
        ? 'support'
        : 'unsupport'
      : 'pending';
  const h3 =
    contestEndCorr != null && Math.abs(contestEndCorr) >= 0.5
      ? contestEndCorr > 0
        ? 'support'
        : 'unsupport'
      : 'pending';
  const h4 = cooperation.divisionSkew >= 20 ? 'support' : cooperation.divisionSkew >= 8 ? 'weak' : 'pending';

  return {
    H1_slotEndRateSpread: { verdict: h1, endSpread: +endSpread.toFixed(4), endRates },
    H2_rxCorrelatesAlive: { verdict: h2, corr: rxAliveCorr, rxCounts, aliveCounts },
    H3_contestCorrelatesEnd: { verdict: h3, corr: contestEndCorr },
    H4_socialDivisionSkew: {
      verdict: h4,
      divisionSkew: cooperation.divisionSkew,
      tgtSkew,
    },
    summary: {
      contestCount: cooperation.contestCount,
      crossRxShare: cooperation.crossRxShare,
      maxGeneration: viability.maxGeneration,
      endCount: viability.endCount,
      lineageCount: viability.lineageCount,
    },
  };
}
