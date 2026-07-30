// 种群结构快照 — 只输出可观测数值，不预制「人类/蘑菇」等地球类比标签

import { populationLayerEnabled } from './multicell-v2.js';
import { SLOT_COUNT } from './social.js';

export const COMPOSITION_INTERVAL = 100;

function lineageRoot(being, byId) {
  let id = being.lineageParent;
  let hops = 0;
  while (id && byId.has(id) && hops < 64) {
    const parent = byId.get(id);
    if (!parent.lineageParent) return id;
    id = parent.lineageParent;
    hops++;
  }
  return being.lineageParent || being.id;
}

function dominantShare(counts, total) {
  if (!total) return 0;
  return Math.max(...Object.values(counts), 0) / total;
}

/** 结构指数：高=谱系/代号趋同（簇状），低=谱系分散+社会位覆盖广（网状） */
export function compositionSnapshot(world) {
  const alive = world.beings.filter((b) => b.alive);
  const n = alive.length;
  if (n === 0) return null;

  const byId = new Map(world.beings.map((b) => [b.id, b]));
  const codeCounts = {};
  const rootCounts = {};
  const slots = new Set();
  const centroids = [];

  for (const b of alive) {
    codeCounts[b.code] = (codeCounts[b.code] || 0) + 1;
    const root = lineageRoot(b, byId);
    rootCounts[root] = (rootCounts[root] || 0) + 1;
    slots.add(b.socialSlot);
    centroids.push(b.registers.reduce((s, v) => s + v, 0) / b.registers.length);
  }

  const meanC = centroids.reduce((a, x) => a + x, 0) / n;
  const spread = Math.sqrt(centroids.reduce((a, x) => a + (x - meanC) ** 2, 0) / n);
  const codeHom = dominantShare(codeCounts, n);
  const lineageHom = dominantShare(rootCounts, n);
  const slotSpan = slots.size / SLOT_COUNT;
  const lineageDisp = Object.keys(rootCounts).length / n;

  const clusterScore = codeHom * 0.4 + lineageHom * 0.35 + spread * 0.25;
  const meshScore = lineageDisp * 0.35 + slotSpan * 0.35 + (1 - codeHom) * 0.3;
  const structIdx = Math.max(0, Math.min(1, clusterScore / (clusterScore + meshScore + 0.001)));

  return {
    pop: n,
    codes: Object.keys(codeCounts).length,
    lineageRoots: Object.keys(rootCounts).length,
    maxGen: Math.max(...alive.map((b) => b.generation || 0)),
    spread: +spread.toFixed(4),
    codeHom: +codeHom.toFixed(4),
    lineageHom: +lineageHom.toFixed(4),
    slotSpan: +slotSpan.toFixed(4),
    structIdx: +structIdx.toFixed(4),
    clusterScore: +clusterScore.toFixed(4),
    meshScore: +meshScore.toFixed(4),
  };
}

export function shouldRecordComposition(world) {
  if (!populationLayerEnabled(world.envProfile)) return false;
  return world.tick > 0 && world.tick % COMPOSITION_INTERVAL === 0;
}
