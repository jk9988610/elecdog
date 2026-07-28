#!/usr/bin/env node
/**
 * Phase 9 — 感受映射：从观察归纳第一批映射句
 * A. 观察者 solo 200 tick tick 级模式
 * B. 观察者 dual(001+002) 200 tick RX 模式
 * C. 观察者 1000 tick 长时稳态
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import {
  analyzeTickPatterns,
  analyzeBirthPulse,
  compareRxInternalDelta,
  buildMappingCandidates,
} from './lib/mapping-analyze.js';

const TICKS = 200;
const LONG_TICKS = 1000;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(ticks = TICKS) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase9 solo]');
  const { id } = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, ticks);
  const entries = recorder.entries;
  return {
    label: ticks === LONG_TICKS ? 'long' : 'solo',
    ticks,
    id,
    entries,
    patterns: analyzeTickPatterns(entries, id, ticks),
    birth: analyzeBirthPulse(entries, id),
    rxDelta: compareRxInternalDelta(entries, id, ticks),
  };
}

function runDual() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase9 dual]');
  const obs = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, TICKS);
  const entries = recorder.entries;
  const id = obs.id;
  return {
    label: 'dual',
    ticks: TICKS,
    id,
    entries,
    patterns: analyzeTickPatterns(entries, id, TICKS),
    birth: analyzeBirthPulse(entries, id),
    rxDelta: compareRxInternalDelta(entries, id, TICKS),
  };
}

function extRate(entries, id, from, to) {
  let n = 0;
  for (let t = from; t <= to; t++) {
    if (entries.some((e) => e.channel === 'external' && e.beingId === id && e.tick === t)) n++;
  }
  return n / (to - from + 1);
}

const solo = runSolo(TICKS);
const dual = runDual();
const long = runSolo(LONG_TICKS);

const segments = [
  { label: 't1-200', from: 1, to: 200 },
  { label: 't201-400', from: 201, to: 400 },
  { label: 't401-600', from: 401, to: 600 },
  { label: 't601-800', from: 601, to: 800 },
  { label: 't801-1000', from: 801, to: 1000 },
].map((s) => ({ ...s, rate: extRate(long.entries, long.id, s.from, s.to) }));

long.segments = segments;

const candidates = buildMappingCandidates([solo, dual, long]);

const report = {
  runAt: new Date().toISOString(),
  phase: 9,
  solo: {
    patterns: solo.patterns,
    birth: solo.birth,
  },
  dual: {
    patterns: dual.patterns,
    rxDelta: dual.rxDelta,
  },
  long: {
    patterns: long.patterns,
    segments,
    totalExternalRate: long.patterns.withExternalRate,
  },
  mappingCandidates: candidates,
  summary: {
    mapCount: candidates.length,
    internalOnlyPct: (solo.patterns.internalOnlyRate * 100).toFixed(1),
    externalPct: (solo.patterns.withExternalRate * 100).toFixed(1),
    rxInternalDelta: dual.rxDelta.delta?.toFixed(2),
    longStable: segments.every((s) => s.rate >= 0.54 && s.rate <= 0.58),
  },
};

writeFileSync(
  new URL('../docs/field-phase9-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 9 感受映射归纳完成');
console.log('映射候选:', candidates.length, '条');
console.log('solo 仅内在:', report.summary.internalOnlyPct + '%');
console.log('solo 有对外:', report.summary.externalPct + '%');
console.log('dual RX 内在差:', report.summary.rxInternalDelta, '条/tick');
console.log('长时分段稳态:', report.summary.longStable ? '✓' : '✗');
console.log('\n映射句:');
for (const m of candidates) {
  console.log(`  ${m.id}: ${m.sentence}`);
}
