// 公理: A1 — 世界节点；ACT 可指向的独立标靶（不预制猎物语义）

import { hashString, mulberry32 } from '../core/hash.js';
import { terrainNodeRegenMult } from './place.js';

export const NODE_COUNT = 4;
export const NODE_REGEN = 0.002;
export const NODE_HIT_BASE = 0.025;
export const NODE_DEP_THRESHOLD = 0.05;

export function initNodes(world) {
  const rng = mulberry32(hashString(`${world.name}:${world.birthPlace}:nodes`));
  world.nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
    id: `N${i}`,
    place: world.birthPlace,
    level: 0.4 + rng() * 0.5,
  }));
}

export function advanceNodes(world) {
  const regen = NODE_REGEN * terrainNodeRegenMult(world, world.envProfile ?? {});
  for (const node of world.nodes) {
    if (node.level < 1) {
      node.level = Math.min(1, node.level + regen);
    }
  }
}

export function selectActTarget(world, actLine, beingId, { stress = 0 } = {}) {
  if (stress > 0.28 && world.nodes?.length) {
    return world.nodes.reduce((best, n) => (n.level > best.level ? n : best));
  }
  const h = hashString(`${actLine}|${beingId}|${world.tick}`);
  const idx = h % world.nodes.length;
  return world.nodes[idx];
}

export function applyActToNode(node, actLine, beingId, tick, { hitMult = 1 } = {}) {
  const h = hashString(`${actLine}|${beingId}|${tick}|hit`);
  const delta = (NODE_HIT_BASE + ((h >>> 8) % 20) / 1000) * hitMult;
  const before = node.level;
  node.level = Math.max(0, node.level - delta);
  const depleted = before >= NODE_DEP_THRESHOLD && node.level < NODE_DEP_THRESHOLD;
  return { nodeId: node.id, delta, before, after: node.level, depleted };
}

export function formatNodesState(nodes) {
  return nodes.map((n) => `${n.id}=${n.level.toFixed(4)}`).join(' ');
}

export function nodesSnapshot(world) {
  return world.nodes.map((n) => ({ id: n.id, place: n.place, level: n.level }));
}
