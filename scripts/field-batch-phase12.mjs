#!/usr/bin/env node
/**
 * Phase 12 — GAP-03 事件记忆迹（最小扩展，不改变 being 行为）
 * A. 观察者 solo 200 tick — MEM 仅 TX+ACT
 * B. 观察者 dual 200 tick — MEM 含 RX
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeMemoryTrace } from './lib/memory-analyze.js';
import { analyzeActResPairing, compareExternalStats } from './lib/environment-analyze.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase12 solo]');
  const { id } = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, TICKS);
  return { id, entries: recorder.entries, ticks: TICKS };
}

function runDual() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase12 dual]');
  const obs = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, TICKS);
  return { observerId: obs.id, entries: recorder.entries, ticks: TICKS };
}

const solo = runSolo();
const dual = runDual();

const soloMem = analyzeMemoryTrace(solo.entries, solo.id, solo.ticks);
const dualMem = analyzeMemoryTrace(dual.entries, dual.observerId, dual.ticks);
const soloExt = compareExternalStats(solo.entries, solo.id, solo.ticks);
const soloRes = analyzeActResPairing(solo.entries, solo.id, solo.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 12,
  extension: 'memory_trace_on_RX_TX_ACT',
  gap: 'GAP-03',
  solo: {
    memory: soloMem,
    external: soloExt,
    actRes: soloRes,
    noRxMem: soloMem.memRx === 0,
  },
  dual: {
    observerMemory: dualMem,
    hasRxMem: dualMem.memRx > 0,
    rxMemEqualsRx: dualMem.rxPaired,
  },
  codexCandidate: {
    name: '事件记忆迹',
    definition:
      'RX/TX/ACT 发生时，memory 通道记录 [MEM] 跨 tick 引用；不改变个体内在或对外统计',
    ready:
      soloMem.pairingRate === 1 &&
      dualMem.pairingRate === 1 &&
      soloMem.memRx === 0 &&
      dualMem.memRx > 0,
  },
  behaviorUnchanged: {
    soloExternalRate: soloExt.externalRate,
    obs04ExternalRate: 0.545,
    match: Math.abs(soloExt.externalRate - 0.545) < 0.001,
  },
};

writeFileSync(
  new URL('../docs/field-phase12-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 12 事件记忆迹完成');
console.log('\nsolo MEM:', soloMem.memTotal, '期望', soloMem.expected,
  soloMem.pairingRate === 1 ? '✓' : '');
console.log('  RX/TX/ACT:', soloMem.memRx, soloMem.memTx, soloMem.memAct, '(无 RX)');
console.log('dual 观察者 MEM:', dualMem.memTotal, 'RX', dualMem.memRx, dualMem.rxPaired ? '✓' : '');
console.log('对外率不变:', report.behaviorUnchanged.match ? '✓ 54.5%' : soloExt.externalRate);
console.log('CODEX 候选:', report.codexCandidate.ready ? '可立项' : '待复核');
