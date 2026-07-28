/** 细胞边界 [MBR]/[CEL] 统计 */

export function analyzeCell(entries, beings) {
  const mbr = entries.filter((e) => e.channel === 'cell' && e.meta?.kind === 'MBR');
  const cel = entries.filter((e) => e.channel === 'cell' && e.meta?.kind === 'CEL');
  const alive = beings.filter((b) => b.alive);

  const boundarySets = alive.map((b) => b.cellBoundary?.join(',') ?? '');
  const uniqueBoundaries = new Set(boundarySets).size;

  const integrities = cel.map((e) => e.meta.integrity).filter((v) => v != null);
  const avgIntegrity = integrities.length
    ? integrities.reduce((a, b) => a + b, 0) / integrities.length
    : null;

  const lowIntegrity = cel.filter((e) => e.meta.integrity < 0.48).length;

  return {
    mbrCount: mbr.length,
    celCount: cel.length,
    lowIntegrityCount: lowIntegrity,
    avgIntegrity: avgIntegrity != null ? +avgIntegrity.toFixed(4) : null,
    uniqueBoundaries,
    aliveWithBoundary: alive.filter((b) => b.cellBoundary?.length === 4).length,
  };
}
