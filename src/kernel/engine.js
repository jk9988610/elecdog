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
      recorder.memory(world.tick, being.id, `[MEM] RX t${sig.emittedAt} ${sig.fromId}`, {
        kind: 'RX',
        refTick: sig.emittedAt,
        fromId: sig.fromId,
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
          recorder.memory(world.tick, being.id, `[MEM] TX t${world.tick}`, {
            kind: 'TX',
            refTick: world.tick,
          });
        } else if (line.startsWith('[ACT]')) {
          const payload = line.slice(5);
          recorder.environment(world.tick, `[RES] ${world.birthPlace} ${being.id} ${payload}`, {
            fromId: being.id,
            act: line,
            place: world.birthPlace,
          });
          recorder.memory(world.tick, being.id, `[MEM] ACT t${world.tick}`, {
            kind: 'ACT',
            refTick: world.tick,
          });
        }
      }
    }
    recorder.state(world.tick, being.id, result.registers);
  }

  world.signalBus = world.signalBus.filter((s) => s.deliverAt > world.tick);

  return world.tick;
}
