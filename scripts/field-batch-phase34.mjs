#!/usr/bin/env node
/**
 * Phase 34 — 环境选择压验证（GAP-14 前置田野）
 * 四体 3000 tick × 4 种子 × 5 环境配置
 * 检验：高压是否系统性削弱 LINEAGE 幼体存续
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { analyzeViability } from './lib/viability-analyze.js';
import { ENV_PROFILES, applyEnvProfile } from '../src/world/env-profile.js';
import {
  analyzeLineagePressure,
  evaluateSelectionPressure,
} from './lib/lineage-pressure-analyze.js';
import { maybeUploadFieldReport } from './lib/field-cloud-upload.mjs';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

const FOUR = [
  { name: '观察者', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002', code: '002' },
  { name: '003', code: '003' },
  { name: '001-乙', code: '001' },
];

const SEEDS = [0, 1, 2, 3];
const TICKS = 3000;
const PROFILE_IDS = Object.keys(ENV_PROFILES);

function runScenario(profileId, seed) {
  const world = createWorld(`01-p34-${profileId}-${seed}`);
  applyEnvProfile(world, profileId);
  const recorder = new Recorder();
  recorder.system(0, `[Phase34 ${profileId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const juvenileWindow = world.envProfile?.juvenileTicks ?? 80;
  const viability = analyzeViability(recorder.entries, TICKS);
  const lineage = analyzeLineagePressure(recorder.entries, world.beings, { juvenileWindow });
  return {
    profileId,
    seed,
    profile: ENV_PROFILES[profileId],
    viability,
    lineage,
    entries: recorder.entries.length,
  };
}

console.log(`Phase 34 环境选择压：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${PROFILE_IDS.length} 环境\n`);

const byProfile = {};
for (const profileId of PROFILE_IDS) {
  byProfile[profileId] = [];
  for (const seed of SEEDS) {
    process.stdout.write(`  ${profileId} seed${seed}…\n`);
    byProfile[profileId].push(runScenario(profileId, seed));
  }
}

function meanProfile(runs, pick) {
  const vals = runs.map(pick).filter((v) => v != null);
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4) : null;
}

const aggregate = {};
for (const [pid, runs] of Object.entries(byProfile)) {
  aggregate[pid] = {
    label: ENV_PROFILES[pid].label,
    meanLineageSpawn: meanProfile(runs, (r) => r.lineage.lineageSpawn),
    meanJuvenileEndRate: meanProfile(runs, (r) => r.lineage.juvenileEndRate),
    meanNetLineage: meanProfile(runs, (r) => r.lineage.netLineage),
    meanAliveLineage: meanProfile(runs, (r) => r.lineage.aliveLineage),
    meanShk: meanProfile(runs, (r) => r.lineage.shkCount),
    meanLow: meanProfile(runs, (r) => r.lineage.lowCount),
    runs,
  };
}

const baselineAgg = aggregate.baseline;
const comparisons = {};
for (const pid of PROFILE_IDS) {
  if (pid === 'baseline') continue;
  const runs = byProfile[pid];
  comparisons[pid] = runs.map((r) => {
    const baseRun = byProfile.baseline.find((b) => b.seed === r.seed);
    return {
      seed: r.seed,
      hypotheses: evaluateSelectionPressure(baseRun.lineage, pid, r.lineage),
    };
  });
}

const report = {
  runAt: new Date().toISOString(),
  phase: 34,
  extension: 'gap14_env_selection_pressure',
  gap: 'GAP-14',
  ticks: TICKS,
  seeds: SEEDS,
  profiles: ENV_PROFILES,
  aggregate,
  comparisons,
  roadmap: 'docs/PHASE32_WORLD_COMPLETENESS.md',
};

writeFileSync(
  new URL('../docs/field-phase34-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 环境均值（四种子）===');
console.log(
  'profile'.padEnd(18),
  'LINEAGE',
  '幼体END率',
  '净谱系',
  '存活谱系',
  'SHK',
  'LOW'
);
for (const pid of PROFILE_IDS) {
  const a = aggregate[pid];
  console.log(
    pid.padEnd(18),
    String(a.meanLineageSpawn ?? '—').padStart(7),
    String(a.meanJuvenileEndRate ?? '—').padStart(10),
    String(a.meanNetLineage ?? '—').padStart(7),
    String(a.meanAliveLineage ?? '—').padStart(10),
    String(a.meanShk ?? '—').padStart(5),
    String(a.meanLow ?? '—').padStart(6)
  );
}

console.log('\n=== 相对基线假说（四种子合计 verdict 计数）===');
for (const pid of PROFILE_IDS) {
  if (pid === 'baseline') continue;
  const comps = comparisons[pid];
  const tally = (key) => comps.map((c) => c.hypotheses[key].verdict).join('/');
  console.log(`${pid}: H1 ${tally('H1_juvenileEndRateRises')} | H2 ${tally('H2_lineageNetDeclines')} | H3 ${tally('H3_survivingLineageFalls')}`);
}

console.log('\n报告已写入 docs/field-phase34-report.json');

await maybeUploadFieldReport({ phase: 34, report });
