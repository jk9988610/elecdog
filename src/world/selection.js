/** L4 环境筛选观察 — 记录 END 时平均场压，不作因果断言 */

export function trackStressSample(being, stress) {
  if (!being.alive) return;
  being.stressSum = (being.stressSum || 0) + stress;
  being.stressSamples = (being.stressSamples || 0) + 1;
}

export function meanStress(being) {
  if (!being.stressSamples) return 0;
  return being.stressSum / being.stressSamples;
}

export function recordSelection(recorder, world, being, terminalStress) {
  const mean = meanStress(being);
  const lived = being.bornAtTick != null ? world.tick - being.bornAtTick : being.tickCount;
  recorder.evolution(
    world.tick,
    being.id,
    `[SEL] gen ${being.generation} meanStress ${mean.toFixed(3)} lived ${lived}`,
    {
      kind: 'SEL',
      generation: being.generation,
      meanStress: mean,
      terminalStress,
      tickLived: lived,
      parentId: being.lineageParent,
    }
  );
}
