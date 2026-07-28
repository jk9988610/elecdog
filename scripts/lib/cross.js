/** 多个体 / 碰撞 / 模板级统计 */

export function countSameTickExternal(entries, beingIds, ticks) {
  let collisions = 0;
  const collisionTicks = [];
  for (let t = 1; t <= ticks; t++) {
    const emitters = beingIds.filter((id) =>
      entries.some((e) => e.tick === t && e.beingId === id && e.channel === 'external')
    );
    if (emitters.length >= 2) {
      collisions++;
      collisionTicks.push({ tick: t, emitters });
    }
  }
  return {
    count: collisions,
    rate: collisions / ticks,
    expectedIndependent: beingIds.length > 1 ? null : null,
    samples: collisionTicks.slice(0, 5),
  };
}

export function expectedCollisionRate(individualRates) {
  return individualRates.reduce((p, r) => p * r, 1);
}

export function diffDna(a, b) {
  const len = Math.max(a.length, b.length);
  const positions = [];
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) positions.push({ i, a: a[i] ?? '-', b: b[i] ?? '-' });
  }
  return { diffCount: positions.length, positions: positions.slice(0, 20), total: len };
}

export function templatePrefix(code, len = 12) {
  return `${code}模板前${len}位需从 generateTemplate 获取`;
}
