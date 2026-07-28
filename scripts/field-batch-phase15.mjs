#!/usr/bin/env node
/**
 * Phase 15 — GAP-05 世界节点（ACT 可指向标靶）
 * A. 观察者 solo 200 tick
 * B. 观察者 dual 200 tick（共享节点）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeNodeTargeting } from './lib/nodes-analyze.js';
import { compareExternalStats } from './lib/environment-analyze.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runSolo() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase15 solo] 节点 N0-N3 已生成');
  const { id } = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  runTicks(world, recorder, TICKS);
  return { id, entries: recorder.entries, ticks: TICKS, nodes: world.nodes };
}

function runDual() {
  const world = createWorld('01');
  const recorder = new Recorder();
  recorder.system(0, '[Phase15 dual] 共享节点');
  const obs = performBirthRitual(world, recorder, {
    name: '小狗',
    code: '001',
    dnaSequence: OBSERVER_DNA,
    id: OBSERVER_ID,
  });
  performBirthRitual(world, recorder, { name: '002-伴', code: '002' });
  runTicks(world, recorder, TICKS);
  return { entries: recorder.entries, ticks: TICKS, nodes: world.nodes };
}

const solo = runSolo();
const dual = runDual();

const soloNodes = analyzeNodeTargeting(solo.entries, solo.ticks);
const soloExt = compareExternalStats(solo.entries, solo.id, solo.ticks);
const dualNodes = analyzeNodeTargeting(dual.entries, dual.ticks);

const report = {
  runAt: new Date().toISOString(),
  phase: 15,
  extension: 'world_nodes_N0_N3',
  gap: 'GAP-05',
  nodeCount: 4,
  solo: { targeting: soloNodes, external: soloExt },
  dual: { targeting: dualNodes },
  codexCandidate: {
    name: '行动标靶',
    ready: soloNodes.pairingRate === 1 && dualNodes.pairingRate === 1,
    depObserved: soloNodes.depCount > 0 || dualNodes.depCount > 0,
  },
};

writeFileSync(
  new URL('../docs/field-phase15-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('Phase 15 世界节点完成');
console.log('\nsolo TGT/ACT:', soloNodes.tgtCount, '/', soloNodes.actCount,
  soloNodes.pairingRate === 1 ? '✓' : '');
console.log('DEP 事件:', soloNodes.depCount, '节点', soloNodes.depletedIds);
console.log('标靶分布:', soloNodes.targetDistribution);
console.log('末态:', soloNodes.finalLevels.map((n) => `${n.id}=${n.level.toFixed(3)}`).join(' '));
console.log('\ndual TGT:', dualNodes.tgtCount, 'DEP:', dualNodes.depCount);
