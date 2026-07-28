#!/usr/bin/env node
/**
 * Phase 13 — 数字基底场（世界环境）
 * A. 观察者 solo 200 tick
 * B. 观察者 dual 200 tick（共享基底）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeSubstrate, analyzeCoupling } from './lib/substrate-analyze.js';
import { compareExternalStats } from './lib/environment-analyze.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase13 solo] 基底场已初始化');
  const { id } = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, TICKS);
  return { id, entries: recorder.entries, ticks: TICKS, world };
}

function runDual() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase13 dual] 共享基底场');
  const obs = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, TICKS);
  return { observerId: obs.id, entries: recorder.entries, ticks: TICKS, world };
}

const solo = runSolo();
const dual = runDual();

const soloSub = analyzeSubstrate(solo.entries, solo.ticks);
const soloExt = compareExternalStats(solo.entries, solo.id, solo.ticks);
const soloCoupling = analyzeCoupling(solo.entries, solo.id, solo.ticks);
const dualSub = analyzeSubstrate(dual.entries, dual.ticks);
const dualCoupling = analyzeCoupling(dual.entries, dual.observerId, dual.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 13,
  extension: 'digital_substrate_field',
  proposal: 'docs/ENVIRONMENT.md',
  solo: {
    substrate: soloSub,
    external: soloExt,
    coupling: soloCoupling,
    e0atBirth: solo.world.substrate.channels[0],
  },
  dual: {
    substrate: dualSub,
    observerCoupling: dualCoupling,
    sharedSubstrate: true,
  },
  baselineCompare: {
    obs04ExternalRate: 0.545,
    soloExternalRate: soloExt.externalRate,
    delta: +(soloExt.externalRate - 0.545).toFixed(3),
  },
  codexCandidates: [
    {
      name: '基底脉搏',
      check: soloSub.ambPerTick === 1,
      detail: `${soloSub.ambCount}/${solo.ticks} tick 有 [AMB]`,
    },
    {
      name: '基底漂移',
      check: soloSub.maxDrift > 0.05,
      detail: `e0 漂移 ${soloSub.e0drift}, max ${soloSub.maxDrift}`,
    },
    {
      name: '行动扰动',
      check: soloSub.ptbActPairing === 1,
      detail: `PTB ${soloSub.ptbCount} / ACT ${soloSub.actCount}`,
    },
    {
      name: '基底耦合',
      check: soloCoupling.avgChannelGap != null,
      detail: `avg |e-r| gap ${soloCoupling.avgChannelGap?.toFixed(4)}`,
    },
  ],
};

writeFileSync(
  new URL('../docs/field-phase13-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 13 数字基底场完成');
console.log('\n[AMB] 每 tick:', soloSub.ambPerTick === 1 ? '✓' : soloSub.ambPerTick);
console.log('[PTB]/[ACT]:', soloSub.ptbCount, '/', soloSub.actCount, soloSub.ptbActPairing === 1 ? '✓' : '');
console.log('基底漂移 max:', soloSub.maxDrift);
console.log('对外率:', (soloExt.externalRate * 100).toFixed(1) + '%', 'Δ baseline', report.baselineCompare.delta);
console.log('耦合 avg |e-r|:', soloCoupling.avgChannelGap?.toFixed(4));
console.log('dual PTB 合计:', dualSub.ptbCount, '(两体共享场)');
