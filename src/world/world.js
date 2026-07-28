// 公理: A1 A9 — 世界：平地、地点、时钟

export function createWorld(name) {
  return {
    name: name.trim() || '未命名世界',
    birthPlace: '01',
    tick: 0,
    running: false,
    beings: [],
    createdAt: new Date().toISOString(),
  };
}

export function getWorldSnapshot(world) {
  return {
    name: world.name,
    birthPlace: world.birthPlace,
    tick: world.tick,
    beingCount: world.beings.length,
  };
}
