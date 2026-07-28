#!/usr/bin/env node
/**
 * Phase 10 — 儿童时代/解放：扫描可命名事件
 * A. 观察者 2000 tick 长时分段与相变候选
 * B. 001/002/003 各 2 只 × 300 tick 早期窗队列
 * C. 四体 300 tick 多体长窗
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeBirthPulse } from './lib/mapping-analyze.js';
import {
  slidingWindows,
  detectRegimeShifts,
  earlyWindowProfile,
  scanLiberationCandidates,
  birthCohortEarlyStats,
  summarizePhase10,
} from './lib/phase-analyze.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';
const LONG_TICKS = 2000;
const COHORT_TICKS = 300;
const MULTI_TICKS = 300;

function runBeing(label, birth, ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, `[Phase10 ${label}]`);
  const { id, being } = performBirthRitual(world, recorder, birth);
  runTicks(world, recorder, ticks);
  const entries = recorder.entries;
  const birthInfo = analyzeBirthPulse(entries, id);
  const earlyProfile = earlyWindowProfile(entries, id, ticks);
  const liberation = scanLiberationCandidates(entries, id, ticks);
  const windows = slidingWindows(entries, id, ticks, 50, 50);
  const regimeShifts = detectRegimeShifts(windows);

  return {
    label,
    code: being.code,
    id,
    ticks,
    entries,
    firstExternalTick: birthInfo.firstExternalTick,
    firstExternalKind: birthInfo.firstExternalKind,
    earlyProfile,
    liberation,
    windows,
    regimeShifts,
  };
}

function runMultiBody(ticks) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase10 四体]');
  const obs = performBirthRitual(world, recorder, {
    name: '观察者',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  const b2 = performBirthRitual(world, recorder, { name: '002-甲', code: '002' });
  const b3 = performBirthRitual(world, recorder, { name: '003-甲', code: '003' });
  const b4 = performBirthRitual(world, recorder, { name: '001-乙', code: '001' });
  runTicks(world, recorder, ticks);
  const entries = recorder.entries;
  const beings = [obs, b2, b3, b4].map((b) => {
    const earlyProfile = earlyWindowProfile(entries, b.id, ticks);
    const liberation = scanLiberationCandidates(entries, b.id, ticks);
    return { label: b.being.name, id: b.id, code: b.being.code, earlyProfile, liberation };
  });
  return { ticks, beings, entries };
}

// A. 观察者 2000 tick
const longRun = runBeing(
  '观察者2000',
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  LONG_TICKS
);

// B. 队列：001×2, 002×2, 003×2
const cohort = [
  runBeing('001-α', { name: '001-α', code: '001' }, COHORT_TICKS),
  runBeing('001-β', { name: '001-β', code: '001' }, COHORT_TICKS),
  runBeing('002-α', { name: '002-α', code: '002' }, COHORT_TICKS),
  runBeing('002-β', { name: '002-β', code: '002' }, COHORT_TICKS),
  runBeing('003-α', { name: '003-α', code: '003' }, COHORT_TICKS),
  runBeing('003-β', { name: '003-β', code: '003' }, COHORT_TICKS),
];

// C. 四体
const multiBody = runMultiBody(MULTI_TICKS);

const liberationScans = [
  { label: longRun.label, candidates: longRun.liberation },
  ...cohort.map((c) => ({ label: c.label, candidates: c.liberation })),
  ...multiBody.beings.map((b) => ({ label: b.label, candidates: b.liberation })),
];

const summary = summarizePhase10({ longRun, cohort, multiBody, liberationScans });
const cohortStats = birthCohortEarlyStats(cohort);

const report = {
  runAt: new Date().toISOString(),
  phase: 10,
  longRun: {
    ticks: LONG_TICKS,
    earlyProfile: longRun.earlyProfile,
    regimeShiftCount: longRun.regimeShifts.length,
    regimeShifts: longRun.regimeShifts.slice(0, 10),
    liberationCount: longRun.liberation.length,
    liberationKinds: [...new Set(longRun.liberation.map((c) => c.kind))],
  },
  cohort: cohortStats,
  multiBody: {
    ticks: MULTI_TICKS,
    beings: multiBody.beings.map((b) => ({
      label: b.label,
      earlyBurst: b.earlyProfile.earlyBurstT2to7,
      earlyExtT1to20: b.earlyProfile.segments.find((s) => s.label === 't1-20')?.externalRate,
      liberationCount: b.liberation.length,
    })),
  },
  summary,
  saturationNote: {
    phase9NewCodex: 0,
    phase10NewCodex: 0,
    consecutiveNoCodex: 2,
    baselineNearComplete: true,
  },
};

writeFileSync(
  new URL('../docs/field-phase10-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 10 儿童时代/解放扫描完成');
console.log('\n早期窗（观察者 2000 tick）:');
const ev = longRun.earlyProfile.earlyVsMature;
if (ev) {
  console.log(`  前30tick对外 ${(ev.earlyExt * 100).toFixed(1)}% vs 成熟 ${(ev.matureExt * 100).toFixed(1)}% (Δ${(ev.extDelta * 100).toFixed(1)}%)`);
}
console.log(`  窗间跳跃: ${longRun.regimeShifts.length} 次`);
console.log('\n队列 t2-7 密集窗:');
for (const c of cohortStats) {
  console.log(`  ${c.label}: ${c.earlyBurstT2to7}, 首对外 t${c.firstExternalTick} ${c.firstExternalKind}`);
}
console.log('\n解放扫描:');
console.log(`  脉冲再现: ${summary.liberation.pulseRepeatCount}`);
console.log(`  新对外前缀: ${summary.liberation.newExternalPrefixCount}`);
console.log(`  空内在: ${summary.liberation.emptyInternalCount}`);
console.log(`  寄存器跳变(>0.25): ${summary.liberation.registerJumpCount}`);
console.log(`  结论: ${summary.liberation.verdict}`);
console.log('\n可命名事件:');
for (const e of summary.namableEvents) {
  console.log(`  ${e.id} ${e.name}`);
}
