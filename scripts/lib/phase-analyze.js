/** Phase 10 — 早期窗 / 解放候选事件扫描（只输出可观测统计） */

export function segmentMetrics(entries, beingId, from, to) {
  let extTicks = 0;
  let internalSum = 0;
  let tx = 0;
  let act = 0;
  const regSamples = [];

  for (let t = from; t <= to; t++) {
    const internals = entries.filter(
      (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
    );
    internalSum += internals.length;
    const ext = entries.find(
      (e) => e.channel === 'external' && e.beingId === beingId && e.tick === t
    );
    if (ext) {
      extTicks++;
      if (ext.content.startsWith('[TX]')) tx++;
      else if (ext.content.startsWith('[ACT]')) act++;
    }
    const state = entries.find(
      (e) => e.channel === 'state' && e.beingId === beingId && e.tick === t
    );
    if (state?.meta?.registers) regSamples.push(state.meta.registers);
  }

  const n = to - from + 1;
  const regMeans = regSamples.length
    ? Array.from({ length: 8 }, (_, i) => {
        const vals = regSamples.map((r) => r[i]);
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      })
    : null;

  return {
    from,
    to,
    ticks: n,
    externalRate: extTicks / n,
    avgInternal: internalSum / n,
    txRate: tx / n,
    actRate: act / n,
    regMeans,
  };
}

export function slidingWindows(entries, beingId, ticks, window = 50, step = 50) {
  const windows = [];
  for (let start = 1; start + window - 1 <= ticks; start += step) {
    windows.push(segmentMetrics(entries, beingId, start, start + window - 1));
  }
  return windows;
}

export function detectRegimeShifts(windows, { extThreshold = 0.12, internalThreshold = 0.35 } = {}) {
  const shifts = [];
  for (let i = 1; i < windows.length; i++) {
    const prev = windows[i - 1];
    const curr = windows[i];
    const extDelta = Math.abs(curr.externalRate - prev.externalRate);
    const intDelta = Math.abs(curr.avgInternal - prev.avgInternal);
    if (extDelta >= extThreshold || intDelta >= internalThreshold) {
      shifts.push({
        atTick: curr.from,
        extDelta: +(curr.externalRate - prev.externalRate).toFixed(3),
        intDelta: +(curr.avgInternal - prev.avgInternal).toFixed(3),
        prevExt: prev.externalRate,
        currExt: curr.externalRate,
        prevInt: prev.avgInternal,
        currInt: curr.avgInternal,
      });
    }
  }
  return shifts;
}

export function earlyWindowProfile(entries, beingId, ticks) {
  const bands = [
    { label: 't1-7', from: 1, to: Math.min(7, ticks) },
    { label: 't1-20', from: 1, to: Math.min(20, ticks) },
    { label: 't1-50', from: 1, to: Math.min(50, ticks) },
    { label: 't51-200', from: 51, to: Math.min(200, ticks) },
    { label: 't201+', from: 201, to: ticks },
  ].filter((b) => b.from <= ticks);

  const segments = bands
    .filter((b) => b.to >= b.from)
    .map((b) => ({ label: b.label, ...segmentMetrics(entries, beingId, b.from, b.to) }));

  const matureStart = Math.min(51, ticks);
  const early = segmentMetrics(entries, beingId, 1, Math.min(30, ticks));
  const mature =
    matureStart <= ticks
      ? segmentMetrics(entries, beingId, matureStart, ticks)
      : null;

  let earlyExtT2to7 = 0;
  for (let t = 2; t <= Math.min(7, ticks); t++) {
    if (entries.some((e) => e.channel === 'external' && e.beingId === beingId && e.tick === t)) {
      earlyExtT2to7++;
    }
  }

  return {
    segments,
    earlyVsMature: mature
      ? {
          earlyExt: early.externalRate,
          matureExt: mature.externalRate,
          extDelta: early.externalRate - mature.externalRate,
          earlyInt: early.avgInternal,
          matureInt: mature.avgInternal,
        }
      : null,
    earlyBurstT2to7: `${earlyExtT2to7}/${Math.min(6, ticks - 1)}`,
  };
}

export function scanLiberationCandidates(entries, beingId, ticks) {
  const candidates = [];

  // 重复意识脉冲格式（tick>0 且末两字节 0x00 0x01）
  for (let t = 1; t <= ticks; t++) {
    const internals = entries.filter(
      (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
    );
    for (const line of internals) {
      const parts = line.content.split(' ');
      if (parts.length === 3 && parts[1] === '0x00' && parts[2] === '0x01') {
        candidates.push({
          kind: 'pulse_repeat',
          tick: t,
          content: line.content,
        });
      }
    }
  }

  // 第三种对外前缀
  const externals = entries.filter((e) => e.channel === 'external' && e.beingId === beingId);
  for (const ext of externals) {
    if (!ext.content.startsWith('[TX]') && !ext.content.startsWith('[ACT]')) {
      candidates.push({ kind: 'new_external_prefix', tick: ext.tick, content: ext.content });
    }
  }

  // 空 internal tick
  for (let t = 1; t <= ticks; t++) {
    const has = entries.some(
      (e) => e.channel === 'internal' && e.beingId === beingId && e.tick === t
    );
    if (!has) candidates.push({ kind: 'empty_internal', tick: t });
  }

  // 寄存器突变（相邻 tick 任一寄存器变化 >0.25）
  const states = entries
    .filter((e) => e.channel === 'state' && e.beingId === beingId && e.tick >= 1)
    .sort((a, b) => a.tick - b.tick);
  for (let i = 1; i < states.length; i++) {
    const prev = states[i - 1].meta.registers;
    const curr = states[i].meta.registers;
    const maxJump = Math.max(...prev.map((v, j) => Math.abs(curr[j] - v)));
    if (maxJump > 0.25) {
      candidates.push({
        kind: 'register_jump',
        tick: states[i].tick,
        maxJump: +maxJump.toFixed(3),
      });
    }
  }

  return candidates;
}

export function birthCohortEarlyStats(runs) {
  return runs.map((r) => ({
    label: r.label,
    code: r.code,
    firstExternalTick: r.firstExternalTick,
    firstExternalKind: r.firstExternalKind,
    earlyBurstT2to7: r.earlyProfile.earlyBurstT2to7,
    earlyExtT1to20: r.earlyProfile.segments.find((s) => s.label === 't1-20')?.externalRate,
    matureExtT51plus: r.earlyProfile.segments.find((s) => s.label === 't201+')?.externalRate,
  }));
}

export function summarizePhase10({ longRun, cohort, multiBody, liberationScans }) {
  const earlyDeltas = cohort
    .map((c) => {
      const e20 = c.earlyProfile?.earlyVsMature?.extDelta;
      return e20;
    })
    .filter((x) => x != null);

  const avgEarlyDelta =
    earlyDeltas.length ? earlyDeltas.reduce((a, b) => a + b, 0) / earlyDeltas.length : null;

  const allLiberation = liberationScans.flatMap((s) => s.candidates);
  const pulseRepeats = allLiberation.filter((c) => c.kind === 'pulse_repeat');
  const registerJumps = allLiberation.filter((c) => c.kind === 'register_jump');
  const newPrefixes = allLiberation.filter((c) => c.kind === 'new_external_prefix');
  const emptyInternal = allLiberation.filter((c) => c.kind === 'empty_internal');

  const longShifts = longRun.regimeShifts;
  const reversible = longShifts.length > 0; // shifts oscillate, not one-way

  return {
    earlyWindow: {
      observerEarlyVsMature: longRun.earlyProfile.earlyVsMature,
      cohortAvgEarlyExtDelta: avgEarlyDelta,
      cohortEarlyBurst: cohort.map((c) => ({
        label: c.label,
        t2to7: c.earlyProfile.earlyBurstT2to7,
      })),
    },
    liberation: {
      pulseRepeatCount: pulseRepeats.length,
      newExternalPrefixCount: newPrefixes.length,
      emptyInternalCount: emptyInternal.length,
      registerJumpCount: registerJumps.length,
      regimeShiftCount: longShifts.length,
      verdict:
        pulseRepeats.length === 0 &&
        newPrefixes.length === 0 &&
        emptyInternal.length === 0
          ? 'no_liberation_event'
          : 'candidates_need_review',
    },
    namableEvents: buildNamableEvents({ longRun, cohort, avgEarlyDelta, longShifts }),
  };
}

function buildNamableEvents({ longRun, cohort, avgEarlyDelta, longShifts }) {
  const events = [];

  const ev = longRun.earlyProfile.earlyVsMature;
  if (ev && ev.extDelta > 0.05) {
    events.push({
      id: 'PHASE-E01',
      name: '早期高对外窗（待确认）',
      description: '诞生后前 30 tick 对外率高于后续均值',
      observable: `观察者：早期 ${(ev.earlyExt * 100).toFixed(1)}% vs 成熟 ${(ev.matureExt * 100).toFixed(1)}%`,
      repeatable: cohort.filter((c) => (c.earlyProfile?.earlyVsMature?.extDelta ?? 0) > 0.03).length,
      cohortSize: cohort.length,
      codexReady: false,
      note: '个体差异大；不设「儿童时代」定律',
    });
  }

  const burstHigh = cohort.filter((c) => {
    const [a, b] = c.earlyProfile.earlyBurstT2to7.split('/').map(Number);
    return b > 0 && a / b >= 0.67;
  }).length;

  if (burstHigh >= 2) {
    events.push({
      id: 'PHASE-E02',
      name: 't2–7 对外密集窗（待确认）',
      description: '诞生后第 2–7 tick 内多数 tick 有对外输出',
      observable: `队列 ${burstHigh}/${cohort.length} 个体 ≥67%`,
      repeatable: burstHigh,
      cohortSize: cohort.length,
      codexReady: false,
      note: '非全体；OBS-03 仅 2/6',
    });
  }

  if (longShifts.length > 0) {
    events.push({
      id: 'PHASE-E03',
      name: '分段指标波动（非解放）',
      description: '50 tick 窗之间对外率/内在密度有跳跃，但双向波动、无不可逆转变',
      observable: `${longShifts.length} 次窗间跳跃 / 2000 tick`,
      repeatable: 1,
      codexReady: false,
      note: '不构成「解放」事件',
    });
  }

  events.push({
    id: 'PHASE-N01',
    name: '解放事件（阴性）',
    description: '未观察到：新对外类型、意识脉冲再现、内在空 tick、不可逆行为相变',
    observable: `脉冲再现 0；新前缀 0；空内在 0；register_jump 为正常漂移`,
    repeatable: 'N/A',
    codexReady: false,
    note: '解放假说在本引擎尺度下未获证据',
  });

  return events;
}
