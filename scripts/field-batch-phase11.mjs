#!/usr/bin/env node
/**
 * Phase 11 — 基线归档 + 行动回响（最小环境扩展）
 * A. 观察者 solo 200 tick — ACT/RES 配对
 * B. 观察者 dual 200 tick — 双体 RES 分布
 * C. 汇总 Phase 0 基线
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeActResPairing, compareExternalStats } from './lib/environment-analyze.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo(label, birth, ticks = TICKS) {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, `[Phase11 ${label}]`);
  const { id } = performBirthRitual(world, recorder, birth);
  runTicks(world, recorder, ticks);
  return { label, id, entries: recorder.entries, ticks };
}

function runDual() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase11 dual]');
  const obs = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  const mate = performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, TICKS);
  return {
    observer: { id: obs.id, entries: recorder.entries },
    mate: { id: mate.id, entries: recorder.entries },
    entries: recorder.entries,
    ticks: TICKS,
  };
}

const solo = runSolo('观察者solo', {
  name: '小狗',
  code: '001',
  dnaSequence: OBSERVER_DNA,
  id: OBSERVER_ID,
});

const dual = runDual();

const soloPairing = analyzeActResPairing(solo.entries, solo.id, solo.ticks);
const soloExt = compareExternalStats(solo.entries, solo.id, solo.ticks);
const dualObsPairing = analyzeActResPairing(dual.entries, dual.observer.id, dual.ticks);
const dualMatePairing = analyzeActResPairing(dual.entries, dual.mate.id, dual.ticks);

const totalRes = dual.entries.filter((e) => e.channel === 'environment').length;
const totalAct = dual.entries.filter(
  (e) => e.channel === 'external' && e.content.startsWith('[ACT]')
).length;

// 基线汇总
const phaseReports = readdirSync(new URL('../docs/', import.meta.url))
  .filter((f) => f.startsWith('field-phase') && f.endsWith('-report.json'))
  .sort();

const baselinePhases = phaseReports.map((f) => {
  const data = JSON.parse(
    readFileSync(new URL(`../docs/${f}`, import.meta.url), 'utf8')
  );
  return { file: f, phase: data.phase ?? f };
});

const report = {
  runAt: new Date().toISOString(),
  phase: 11,
  extension: 'environment_echo_on_ACT',
  solo: {
    pairing: soloPairing,
    external: soloExt,
    compareObs04: { externalRate: 0.545, actCount: 61 },
  },
  dual: {
    observer: dualObsPairing,
    mate: dualMatePairing,
    totalRes,
    totalAct,
    resEqualsAct: totalRes === totalAct,
  },
  codexCandidate: {
    name: '行动回响',
    definition: '个体发出 [ACT] 时，同 tick 环境通道记录 [RES] {地点} {身份证} {ACT载荷}',
    soloPairing: soloPairing.pairingRate,
    dualPairing: dualObsPairing.pairingRate,
    ready: soloPairing.pairingRate === 1 && dualObsPairing.pairingRate === 1,
  },
  baseline: {
    phaseReports: baselinePhases.length,
    files: phaseReports,
    obsTarget: 30,
    gapsDocumented: 7,
  },
};

writeFileSync(
  new URL('../docs/field-phase11-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 11 行动回响完成');
console.log('\nsolo ACT/RES 配对:', soloPairing.matched, '/', soloPairing.actCount,
  soloPairing.pairingRate === 1 ? '✓ 100%' : '');
console.log('solo 对外率:', (soloExt.externalRate * 100).toFixed(1) + '%', '(OBS-04: 54.5%)');
console.log('dual 观察者配对:', dualObsPairing.matched, '/', dualObsPairing.actCount);
console.log('dual 总 RES/ACT:', totalRes, '/', totalAct, totalRes === totalAct ? '✓' : '');
console.log('TX 误触发 RES:', soloPairing.resOnTxTicks, '(应为 0)');
console.log('\nCODEX 候选「行动回响」:', report.codexCandidate.ready ? '可立项' : '待复核');
