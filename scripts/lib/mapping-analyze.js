/** 感受映射归纳 — 只统计可观测 tick 级模式，供映射句起草 */

export function analyzeTickPatterns(entries, beingId, ticks) {
  const patterns = {
    internalOnly: 0,
    withExternal: 0,
    txOnly: 0,
    actOnly: 0,
    internalSingle: 0,
    internalDouble: 0,
    internalTriplePlus: 0,
    withRx: 0,
    withoutRx: 0,
    rxWithExtraInternal: 0,
    extAfterRxPrev: 0,
    noExtAfterRxPrev: 0,
  };

  const rxTicks = new Set(
    entries.filter((e) => e.channel === 'signal' && e.beingId === beingId).map((e) => e.tick)
  );

  for (let t = 1; t <= ticks; t++) {
    const internals = entries.filter(
      (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
    );
    const ext = entries.find(
      (e) => e.channel === 'external' && e.beingId === beingId && e.tick === t
    );
    const hadRxPrev = rxTicks.has(t - 1);

    if (internals.length === 1) patterns.internalSingle++;
    else if (internals.length === 2) patterns.internalDouble++;
    else if (internals.length >= 3) patterns.internalTriplePlus++;

    if (ext) {
      patterns.withExternal++;
      if (ext.content.startsWith('[TX]')) patterns.txOnly++;
      else if (ext.content.startsWith('[ACT]')) patterns.actOnly++;
    } else {
      patterns.internalOnly++;
    }

    if (rxTicks.has(t)) {
      patterns.withRx++;
      if (internals.length >= 2) patterns.rxWithExtraInternal++;
    } else {
      patterns.withoutRx++;
    }

    if (hadRxPrev) {
      if (ext) patterns.extAfterRxPrev++;
      else patterns.noExtAfterRxPrev++;
    }
  }

  const tickCount = ticks;
  return {
    tickCount,
    internalOnlyRate: patterns.internalOnly / tickCount,
    withExternalRate: patterns.withExternal / tickCount,
    txRate: patterns.txOnly / tickCount,
    actRate: patterns.actOnly / tickCount,
    internalSingleRate: patterns.internalSingle / tickCount,
    internalDoubleRate: patterns.internalDouble / tickCount,
    internalTriplePlusRate: patterns.internalTriplePlus / tickCount,
    withRxRate: patterns.withRx / tickCount,
    rxExtraInternalRate: patterns.withRx
      ? patterns.rxWithExtraInternal / patterns.withRx
      : null,
    extAfterRxPrevRate: patterns.extAfterRxPrev + patterns.noExtAfterRxPrev
      ? patterns.extAfterRxPrev / (patterns.extAfterRxPrev + patterns.noExtAfterRxPrev)
      : null,
    raw: patterns,
  };
}

export function analyzeBirthPulse(entries, beingId) {
  const pulse = entries.find(
    (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === 0
  );
  const ritual = entries.find(
    (e) => e.channel === 'ritual' && e.beingId === beingId && e.tick === 0
  );
  return {
    pulse: pulse?.content ?? null,
    pulseMatch: pulse?.content?.endsWith('0x00 0x01') ?? false,
    hasRitual: Boolean(ritual),
    firstExternalTick: entries.find(
      (e) => e.channel === 'external' && e.beingId === beingId
    )?.tick,
    firstExternalKind: entries
      .find((e) => e.channel === 'external' && e.beingId === beingId)
      ?.content?.split(' ')[0],
  };
}

export function compareRxInternalDelta(entries, beingId, ticks) {
  const rxTicks = new Set(
    entries.filter((e) => e.channel === 'signal' && e.beingId === beingId).map((e) => e.tick)
  );

  function avgInternal(predicate) {
    let sum = 0;
    let n = 0;
    for (let t = 1; t <= ticks; t++) {
      if (!predicate(t)) continue;
      n++;
      sum += entries.filter(
        (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
      ).length;
    }
    return n ? sum / n : null;
  }

  const withRx = avgInternal((t) => rxTicks.has(t));
  const withoutRx = avgInternal((t) => !rxTicks.has(t));
  return {
    withRxAvg: withRx,
    withoutRxAvg: withoutRx,
    delta: withRx != null && withoutRx != null ? withRx - withoutRx : null,
    rxTickCount: rxTicks.size,
  };
}

export function buildMappingCandidates(runs) {
  const candidates = [];

  const solo = runs.find((r) => r.label === 'solo');
  const dual = runs.find((r) => r.label === 'dual');

  if (solo) {
    const p = solo.patterns;
    candidates.push({
      id: 'MAP-01',
      condition: 'tick ≥ 1，有 internal、无 external',
      sentence: '这一拍内在仍在运转，但没有对外输出。',
      stats: { rate: p.internalOnlyRate, n: solo.ticks },
      obs: ['OBS-20260728-01', 'OBS-20260729-04'],
    });
    candidates.push({
      id: 'MAP-02',
      condition: 'tick 出现 [TX]',
      sentence: '这一拍向外界发送了信号；同世界他者可在次 tick 收到。',
      stats: { rate: p.txRate, n: solo.ticks },
      obs: ['OBS-20260729-13', 'OBS-20260729-15'],
    });
    candidates.push({
      id: 'MAP-03',
      condition: 'tick 出现 [ACT]（无 [TX]）',
      sentence: '这一拍有对外行动，但不发送可被接收的信号。',
      stats: { rate: p.actRate, n: solo.ticks },
      obs: ['OBS-20260728-01', 'OBS-20260729-02'],
    });
    candidates.push({
      id: 'MAP-04',
      condition: 'tick 0 首条 internal',
      sentence: '诞生后的意识脉冲；个体开始产生内在处理流。',
      stats: { pulse: solo.birth.pulse },
      obs: ['OBS-20260728-01', 'OBS-20260729-02'],
    });
    candidates.push({
      id: 'MAP-05',
      condition: 'tick 有 2 条 internal、无 RX',
      sentence: '这一拍内在处理较密（两行 hex），仍属常见节律。',
      stats: { rate: p.internalDoubleRate, n: solo.ticks },
      obs: ['OBS-20260728-01', 'OBS-20260729-03'],
    });
  }

  if (dual) {
    const rx = dual.rxDelta;
    const p = dual.patterns;
    candidates.push({
      id: 'MAP-06',
      condition: 'tick 收到 signal [RX]',
      sentence: '这一拍收到他者信号；内在思考流通常多出一行 hex。',
      stats: {
        rxRate: p.withRxRate,
        avgInternalWithRx: rx.withRxAvg,
        avgInternalWithoutRx: rx.withoutRx,
        delta: rx.delta,
      },
      obs: ['OBS-20260729-15', 'OBS-20260729-16'],
    });
    candidates.push({
      id: 'MAP-07',
      condition: '上一 tick 收到 RX，本 tick 对外',
      sentence: '收到信号后的下一拍，对外输出略更常见（仍非必然）。',
      stats: { rate: p.extAfterRxPrevRate, n: dual.ticks },
      obs: ['OBS-20260729-15'],
    });
  }

  if (solo && dual) {
    const sameExt =
      Math.abs(solo.patterns.withExternalRate - dual.patterns.withExternalRate) < 0.001;
    candidates.push({
      id: 'MAP-08',
      condition: '同 DNA+ID，solo 与 dual 200 tick',
      sentence: '有无他者在场，对外节奏统计相同；差异主要在收到信号时的内在。',
      stats: {
        soloExt: solo.patterns.withExternalRate,
        dualExt: dual.patterns.withExternalRate,
        same: sameExt,
      },
      obs: ['OBS-20260729-15'],
    });
  }

  const long = runs.find((r) => r.label === 'long');
  if (long) {
    candidates.push({
      id: 'MAP-09',
      condition: '长时运行（200–1000 tick）',
      sentence: '约半数以上的 tick 有对外输出；长时内对外比例在窄带内波动，不持续漂移。',
      stats: {
        rate: long.patterns.withExternalRate,
        segments: long.segments,
      },
      obs: ['OBS-20260729-04', 'OBS-20260729-19'],
    });
  }

  return candidates;
}
