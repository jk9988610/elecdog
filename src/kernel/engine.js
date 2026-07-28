// 公理: A9 — 时钟与 tick；观察驱动：TX 信号次 tick 投递他者

export function stepWorld(world, recorder) {
  world.tick++;

  const delivered = world.signalBus.filter((s) => s.deliverAt === world.tick);

  for (const being of world.beings) {
    const heard = delivered.filter((s) => s.fromId !== being.id);
    const result = being.tick(world.tick, { heardSignals: heard });

    for (const sig of heard) {
      recorder.log({
        tick: world.tick,
        channel: 'signal',
        beingId: being.id,
        content: `[RX] ${sig.fromId} ${sig.content}`,
        meta: { fromId: sig.fromId, emittedAt: sig.emittedAt },
      });
    }

    recorder.internal(world.tick, being.id, result.internal);
    if (result.external.length > 0) {
      recorder.external(world.tick, being.id, result.external);
      for (const line of result.external) {
        if (line.startsWith('[TX]')) {
          world.signalBus.push({
            fromId: being.id,
            content: line,
            emittedAt: world.tick,
            deliverAt: world.tick + 1,
          });
        }
      }
    }
    recorder.state(world.tick, being.id, result.registers);
  }

  world.signalBus = world.signalBus.filter((s) => s.deliverAt > world.tick);

  return world.tick;
}
