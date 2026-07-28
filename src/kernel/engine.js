// 公理: A9 — 时钟与 tick 推进

export function stepWorld(world, recorder) {
  world.tick++;

  for (const being of world.beings) {
    const result = being.tick(world.tick);
    recorder.internal(world.tick, being.id, result.internal);
    if (result.external.length > 0) {
      recorder.external(world.tick, being.id, result.external);
    }
    recorder.state(world.tick, being.id, result.registers);
  }

  return world.tick;
}
