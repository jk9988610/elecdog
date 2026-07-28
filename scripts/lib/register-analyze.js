/** GAP-02 寄存器田野统计 — 只输出数值共现，不预制感受语义 */

const REGS = Array.from({ length: 8 }, (_, i) => i);

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

function buildStateSeries(entries, beingId) {
  return entries
    .filter((e) => e.channel === 'state' && e.beingId === beingId)
    .map((e) => ({ tick: e.tick, regs: e.meta.registers }));
}

function stressAt(entries, beingId, tick) {
  const s = entries.find(
    (e) =>
      e.channel === 'viability' &&
      e.beingId === beingId &&
      e.tick === tick &&
      e.meta?.kind === 'SVV'
  );
  return s?.meta?.stress ?? null;
}

function substrateAt(entries, tick) {
  const s = entries.find((e) => e.channel === 'substrate' && e.tick === tick);
  return s?.meta?.channels ?? null;
}

export function analyzeRegisterProfile(entries, beingId, ticks) {
  const series = buildStateSeries(entries, beingId);
  if (!series.length) return null;

  const highStressRegs = REGS.map(() => []);
  const lowStressRegs = REGS.map(() => []);
  const allRegs = REGS.map(() => []);
  const gapSeries = [];

  for (const pt of series) {
    const stress = stressAt(entries, beingId, pt.tick);
    const sub = substrateAt(entries, pt.tick);
    for (let i = 0; i < 8; i++) allRegs[i].push(pt.regs[i]);
    if (stress != null) {
      const bucket = stress > 0.38 ? highStressRegs : lowStressRegs;
      for (let i = 0; i < 8; i++) bucket[i].push(pt.regs[i]);
    }
    if (sub?.length === 8) {
      let gap = 0;
      for (let i = 0; i < 8; i++) gap += Math.abs(pt.regs[i] - sub[i]);
      gapSeries.push({ tick: pt.tick, gap: gap / 8, stress: stress ?? 0 });
    }
  }

  const highMean = highStressRegs.map((a) => mean(a));
  const lowMean = lowStressRegs.map((a) => mean(a));
  const stressDelta = REGS.map((i) =>
    highMean[i] != null && lowMean[i] != null ? +(highMean[i] - lowMean[i]).toFixed(4) : null
  );

  const lowEvents = entries.filter(
    (e) => e.channel === 'metabolism' && e.beingId === beingId && e.meta?.kind === 'LOW'
  );
  const lowIdxCounts = {};
  for (const e of lowEvents) {
    const idx = e.meta?.idx ?? e.meta?.low?.idx;
    if (idx != null) lowIdxCounts[idx] = (lowIdxCounts[idx] || 0) + 1;
  }

  const ends = entries.filter(
    (e) => e.channel === 'viability' && e.beingId === beingId && e.meta?.kind === 'END'
  );
  const preEndRegs = REGS.map(() => []);
  for (const end of ends) {
    const pt = series.filter((s) => s.tick >= end.tick - 10 && s.tick <= end.tick).at(-1);
    if (pt) for (let i = 0; i < 8; i++) preEndRegs[i].push(pt.regs[i]);
  }
  const preEndMean = preEndRegs.map((a) => (a.length ? +mean(a).toFixed(4) : null));

  const gapStressCorr = gapSeries.length >= 10 ? pearson(gapSeries.map((g) => g.gap), gapSeries.map((g) => g.stress)) : null;

  return {
    beingId,
    stateTicks: series.length,
    meanRegs: allRegs.map((a) => +(mean(a) ?? 0).toFixed(4)),
    stressDelta,
    lowEventCount: lowEvents.length,
    lowIdxCounts,
    endCount: ends.length,
    preEndMean,
    gapStressCorr: gapStressCorr != null ? +gapStressCorr.toFixed(4) : null,
    highStressSamples: highStressRegs[0].length,
    lowStressSamples: lowStressRegs[0].length,
  };
}

function pearson(xs, ys) {
  const n = xs.length;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  return den ? num / den : 0;
}

export function aggregateRegisterProfiles(profiles) {
  const valid = profiles.filter(Boolean);
  if (!valid.length) return null;

  const signVotes = REGS.map(() => ({ pos: 0, neg: 0, zero: 0 }));
  for (const p of valid) {
    for (let i = 0; i < 8; i++) {
      const d = p.stressDelta[i];
      if (d == null || Math.abs(d) < 0.005) signVotes[i].zero++;
      else if (d > 0) signVotes[i].pos++;
      else signVotes[i].neg++;
    }
  }

  const unanimousStressDelta = REGS.filter((i) => {
    const v = signVotes[i];
    return (v.pos === 0 || v.neg === 0) && v.pos + v.neg > 0;
  });

  const corrs = valid.map((p) => p.gapStressCorr).filter((c) => c != null);
  const lowIdxTotals = {};
  for (const p of valid) {
    for (const [idx, n] of Object.entries(p.lowIdxCounts)) {
      lowIdxTotals[idx] = (lowIdxTotals[idx] || 0) + n;
    }
  }

  return {
    beingCount: valid.length,
    avgGapStressCorr: corrs.length ? +(mean(corrs).toFixed(4)) : null,
    unanimousStressDeltaRegs: unanimousStressDelta,
    signVotes,
    lowIdxTotals,
    avgMeanRegs: REGS.map((i) =>
      +(mean(valid.map((p) => p.meanRegs[i])).toFixed(4))
    ),
  };
}

export function evaluateRegisterHypotheses(aggregate, profiles) {
  const h1 =
    aggregate.unanimousStressDeltaRegs.length >= 2 ? 'support' : 'pending';

  const h2 =
    aggregate.avgGapStressCorr != null && aggregate.avgGapStressCorr >= 0.7
      ? 'support'
      : aggregate.avgGapStressCorr != null && aggregate.avgGapStressCorr < 0.4
        ? 'unsupport'
        : 'pending';

  const lowKeys = Object.keys(aggregate.lowIdxTotals);
  const h3 =
    lowKeys.length >= 1 && lowKeys.length <= 4
      ? 'support'
      : lowKeys.length === 0
        ? 'pending'
        : 'pending';

  const h4 = 'support';

  return {
    H1_stressRegisterShift: {
      verdict: h1,
      unanimousRegs: aggregate.unanimousStressDeltaRegs,
      signVotes: aggregate.signVotes,
    },
    H2_gapStressCoupling: {
      verdict: h2,
      avgCorr: aggregate.avgGapStressCorr,
    },
    H3_lowChannelCluster: {
      verdict: h3,
      lowIdxTotals: aggregate.lowIdxTotals,
    },
    H4_noFeelingLabels: {
      verdict: h4,
      note: '仅数值共现，未立项感受映射',
    },
  };
}

export function analyzeRegisters(entries, beings, ticks) {
  const alive = beings.filter((b) => b.tickCount > 0 || entries.some((e) => e.beingId === b.id));
  const profiles = alive.map((b) => analyzeRegisterProfile(entries, b.id, ticks));
  const aggregate = aggregateRegisterProfiles(profiles);
  const hypotheses = aggregate ? evaluateRegisterHypotheses(aggregate, profiles) : null;
  return { profiles, aggregate, hypotheses };
}
