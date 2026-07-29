#!/usr/bin/env node
/**
 * Phase 36 — 富足分裂场：DNA 存活分裂倾向
 * 四体 3000 tick × 4 种子 × 4 环境（baseline / fertile_field / fertile_inert / harsh）
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { ENV_PROFILES, applyEnvProfile } from '../src/world/env-profile.js';
import { analyzeFission, evaluateFertileField } from './lib/fission-analyze.js';
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
const PROFILE_IDS = ['baseline', 'fertile_field', 'fertile_inert', 'harsh_combined'];

function runScenario(profileId, seed) {
  const world = createWorld(`01-p36-${profileId}-${seed}`);
  applyEnvProfile(world, profileId);
  world.envProfile.fieldLiteLog = true;
  const recorder = new Recorder();
  recorder.system(0, `[Phase36 ${profileId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const metrics = analyzeFission(recorder.entries, world.beings);
  return { profileId, seed, profile: ENV_PROFILES[profileId], metrics, entries: recorder.entries.length };
}

console.log(`Phase 36 富足分裂场：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${PROFILE_IDS.length} 环境\n`);

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
  return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
}

const aggregate = {};
for (const [pid, runs] of Object.entries(byProfile)) {
  aggregate[pid] = {
    label: ENV_PROFILES[pid].label,
    meanFiss: meanProfile(runs, (r) => r.metrics.fissCount),
    meanLineage: meanProfile(runs, (r) => r.metrics.lineageCount),
    meanAlive: meanProfile(runs, (r) => r.metrics.aliveTotal),
    meanPopGrowth: meanProfile(runs, (r) => r.metrics.popGrowth),
    meanFissSubstrate: meanProfile(runs, (r) => r.metrics.meanFissSubstrate),
    runs,
  };
}

const comparisons = {};
for (const pid of PROFILE_IDS) {
  if (pid === 'baseline') continue;
  comparisons[pid] = byProfile[pid].map((r) => {
    const baseRun = byProfile.baseline.find((b) => b.seed === r.seed);
    return {
      seed: r.seed,
      hypotheses: evaluateFertileField(baseRun.metrics, pid, r.metrics),
    };
  });
}

const report = {
  runAt: new Date().toISOString(),
  phase: 36,
  extension: 'fertile_field_fission',
  gap: 'GAP-16',
  ticks: TICKS,
  seeds: SEEDS,
  profiles: Object.fromEntries(PROFILE_IDS.map((id) => [id, ENV_PROFILES[id]])),
  aggregate,
  comparisons,
  design: {
    fertile_field: '富足基底 + fissionEnabled + DNA 偏置门控',
    fertile_inert: '同等富足基底但关闭分裂门（对照）',
    analogy: '地球式旺盛分裂 ≈ 资源充裕 + 低胁迫 + DNA 复制程序被执行',
  },
  roadmap: 'docs/PHASE36_FISSION.md',
};

writeFileSync(
  new URL('../docs/field-phase36-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 环境均值（四种子）===');
console.log('profile'.padEnd(18), 'FISS', 'LINEAGE', '存活', '增长');
for (const pid of PROFILE_IDS) {
  const a = aggregate[pid];
  console.log(
    pid.padEnd(18),
    String(a.meanFiss ?? '—').padStart(6),
    String(a.meanLineage ?? '—').padStart(8),
    String(a.meanAlive ?? '—').padStart(6),
    String(a.meanPopGrowth ?? '—').padStart(6)
  );
}

console.log('\n=== 相对 baseline（verdict 计数）===');
for (const pid of PROFILE_IDS) {
  if (pid === 'baseline') continue;
  const comps = comparisons[pid];
  const tally = (key) => comps.map((c) => c.hypotheses[key].verdict).join('/');
  console.log(`${pid}: H1 ${tally('H1_fissRises')} | H2 ${tally('H2_populationGrows')} | H3 ${tally('H3_lineageNotRequired')}`);
}

console.log('\n报告已写入 docs/field-phase36-report.json');

await maybeUploadFieldReport({ phase: 36, report });
