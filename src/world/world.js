// 公理: A1 A9 — 世界：平地、地点、时钟、数字基底场

import { initSubstrate } from './substrate.js';
import { initNodes } from './nodes.js';

export function createWorld(name) {
  const world = {
    name: name.trim() || '未命名世界',
    birthPlace: '01',
    tick: 0,
    running: false,
    beings: [],
    signalBus: [],
    createdAt: new Date().toISOString(),
  };
  initSubstrate(world);
  initNodes(world);
  return world;
}

export function getWorldSnapshot(world) {
  return {
    name: world.name,
    birthPlace: world.birthPlace,
    tick: world.tick,
    beingCount: world.beings.length,
  };
}
