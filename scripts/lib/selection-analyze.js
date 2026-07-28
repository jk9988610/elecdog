/** Phase 26 — L4 环境筛选田野统计 */

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

export function analyzeSelection(entries, beings) {
  const sel = entries.filter((e) => e.channel === 'evolution' && e.meta?.kind === 'SEL');
  const byGen = {};
  for (const e of sel) {
    const g = e.meta.generation ?? 0;
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(e.meta.meanStress);
  }

  const genBuckets = Object.entries(byGen)
    .map(([g, stresses]) => ({
      generation: Number(g),
      count: stresses.length,
      meanStress: +(stresses.reduce((a, b) => a + b, 0) / stresses.length).toFixed(4),
    }))
    .sort((a, b) => a.generation - b.generation);

  const gens = sel.map((e) => e.meta.generation ?? 0);
  const stresses = sel.map((e) => e.meta.meanStress ?? 0);
  const genStressCorr = pearson(gens, stresses);

  const alive = beings.filter((b) => b.alive);
  const aliveGen = alive.length
    ? +(alive.reduce((s, b) => s + (b.generation || 0), 0) / alive.length).toFixed(4)
    : null;

  const endedGen0 = sel.filter((e) => (e.meta.generation ?? 0) === 0);
  const endedHigh = sel.filter((e) => (e.meta.generation ?? 0) >= 5);
  const meanEndedGen0 =
    endedGen0.length
      ? +(endedGen0.reduce((s, e) => s + e.meta.meanStress, 0) / endedGen0.length).toFixed(4)
      : null;
  const meanEndedHigh =
    endedHigh.length
      ? +(endedHigh.reduce((s, e) => s + e.meta.meanStress, 0) / endedHigh.length).toFixed(4)
      : null;

  return {
    selCount: sel.length,
    genBuckets,
    genStressCorr,
    aliveCount: alive.length,
    aliveMeanGen: aliveGen,
    meanEndedGen0,
    meanEndedHigh,
    endedHighCount: endedHigh.length,
  };
}

export function evaluateSelectionHypotheses(selection, viability) {
  const h1 =
    selection.genStressCorr != null && Math.abs(selection.genStressCorr) >= 0.15
      ? selection.genStressCorr > 0
        ? 'support'
        : 'unsupport'
      : 'pending';

  const h2 =
    selection.meanEndedGen0 != null &&
    selection.meanEndedHigh != null &&
    selection.endedHighCount >= 3
      ? selection.meanEndedHigh < selection.meanEndedGen0
        ? 'support'
        : selection.meanEndedHigh > selection.meanEndedGen0
          ? 'unsupport'
          : 'pending'
      : 'pending';

  const h3 =
    viability.maxGeneration >= 8 && selection.selCount >= viability.endCount * 0.9
      ? 'support'
      : 'pending';

  return {
    H1_genStressCorrelation: {
      verdict: h1,
      corr: selection.genStressCorr,
    },
    H2_highGenLowerStressAtEnd: {
      verdict: h2,
      meanGen0: selection.meanEndedGen0,
      meanGen5plus: selection.meanEndedHigh,
      highGenEnds: selection.endedHighCount,
    },
    H3_selectionChannelComplete: {
      verdict: h3,
      selCount: selection.selCount,
      endCount: viability.endCount,
      maxGen: viability.maxGeneration,
    },
  };
}
