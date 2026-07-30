/** 跨种子一致性（Phase 118/123 共用） */

export function seedConsistency(runs, pick, { minPositive = 3, sameSign = false } = {}) {
  const vals = runs.map(pick).filter((v) => v != null);
  if (!vals.length) return { count: 0, total: runs.length, rate: 0 };
  if (sameSign) {
    const signs = vals.map((v) => Math.sign(v)).filter((s) => s !== 0);
    const dominant = signs.length ? signs.reduce((a, b) => a + b, 0) : 0;
    const consistent = signs.filter((s) => s === Math.sign(dominant)).length;
    return { count: consistent, total: runs.length, rate: +(consistent / runs.length).toFixed(2) };
  }
  const positive = vals.filter((v) => v > 0).length;
  return {
    count: positive,
    total: runs.length,
    rate: +(positive / runs.length).toFixed(2),
    pass: positive >= minPositive,
  };
}
