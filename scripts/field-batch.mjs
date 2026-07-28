#!/usr/bin/env node
/**
 * 田野批次运行 — 协作者代跑
 * 1. 复现观察者个体 DNA（OBS-02）跑满 200 tick
 * 2. 新诞生第二只 001 跑满 200 tick
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { analyzeRun, runTicks } from './lib/analyze.js';

const TICKS = 200;

// OBS-20260729-02 观察者个体的 DNA 与身份证
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runExperiment(label, birthOpts, worldName = '01') {
  const world = createWorld(worldName);
  const recorder = new Recorder();
  recorder.system(0, `世界创建 ${world.name} [${label}]`);

  const { being, id, dna } = performBirthRitual(world, recorder, birthOpts);
  runTicks(world, recorder, TICKS);

  const analysis = analyzeRun({
    entries: recorder.entries,
    beingId: id,
    ticks: TICKS,
  });

  return {
    label,
    meta: {
      world: world.name,
      name: being.name,
      code: being.code,
      id,
      dna: dna.sequence,
      mutations: dna.mutationCount,
      ticks: TICKS,
    },
    analysis,
    entryCount: recorder.entries.length,
  };
}

const expA = runExperiment('复现观察者个体', {
  name: '小狗',
  code: '001',
  dnaSequence: OBSERVER_DNA,
  id: OBSERVER_ID,
});

const expB = runExperiment('第二只001', {
  name: '小狗二',
  code: '001',
});

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  experiments: [expA, expB],
};

const outPath = new URL('../docs/field-batch-report.json', import.meta.url);
writeFileSync(outPath, JSON.stringify(report, null, 2));

function printExp(exp) {
  const a = exp.analysis;
  console.log(`\n=== ${exp.label} ===`);
  console.log(`ID: ${exp.meta.id}`);
  console.log(`意识脉冲: ${a.pulse} (${a.pulseMatch ? 'CODEX✓' : '异常'})`);
  console.log(`对内: 空tick=${a.emptyInternalTicks.length} 均值=${a.avgInternal.toFixed(2)}/tick`);
  console.log(`对外: ${a.txCount} TX + ${a.actCount} ACT, 总率 ${(a.externalTickRate * 100).toFixed(1)}%`);
  console.log(`首次对外: t${a.firstExternalTick} ${a.firstExternalKind}`);
  console.log(`t2-7: ${a.earlyExtT2to7} | t1-20: ${(a.extRateT1to20 * 100).toFixed(1)}% | t21-100: ${((a.extRateT21to100 ?? 0) * 100).toFixed(1)}% | t101-200: ${((a.extRateT101toEnd ?? 0) * 100).toFixed(1)}%`);
  const r4 = a.regTrends.r4;
  const r5 = a.regTrends.r5;
  console.log(`r4: ${r4.t1?.toFixed(4)} → ${r4.tEnd?.toFixed(4)} (${r4.trend})`);
  console.log(`r5: ${r5.t1?.toFixed(4)} → ${r5.tEnd?.toFixed(4)} (${r5.trend}) range [${r5.min.toFixed(3)}, ${r5.max.toFixed(3)}]`);
}

console.log('田野批次运行完成');
printExp(expA);
printExp(expB);

const r4both = expA.analysis.regTrends.r4.trend === 'rising' && expB.analysis.regTrends.r4.trend === 'rising';
console.log(`\n--- 交叉结论 ---`);
console.log(`两只 001 的 r4 均上升: ${r4both ? '是' : '否'}`);
console.log(`报告: docs/field-batch-report.json`);
