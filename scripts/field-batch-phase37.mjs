#!/usr/bin/env node
/**
 * Phase 37 — 复制配额 [RPL]：分裂次数上限与寿命顶
 * 四体 3000 tick × 4 种子 × 3 富足对照
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { runTicks } from './lib/analyze.js';
import { ENV_PROFILES, applyEnvProfile } from '../src/world/env-profile.js';
import { analyzeReplication, compareRplLimited } from './lib/rpl-analyze.js';
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
const PROFILE_IDS = ['fertile_field_open', 'fertile_field', 'fertile_field_strict'];

function runScenario(profileId, seed) {
  const world = createWorld(`01-p37-${profileId}-${seed}`);
  applyEnvProfile(world, profileId);
  world.envProfile.fieldLiteLog = true;
  const recorder = new Recorder();
  recorder.system(0, `[Phase37 ${profileId} seed${seed}]`);
  FOUR.forEach((b) => performBirthRitual(world, recorder, b));
  runTicks(world, recorder, TICKS);
  const metrics = analyzeReplication(recorder.entries, world.beings);
  return { profileId, seed, profile: ENV_PROFILES[profileId], metrics, entries: recorder.entries.length };
}

console.log(`Phase 37 复制配额：四体 ${TICKS} tick × ${SEEDS.length} 种子 × ${PROFILE_IDS.length} 环境\n`);

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
    meanAlive: meanProfile(runs, (r) => r.metrics.aliveTotal),
    meanExhausted: meanProfile(runs, (r) => r.metrics.exhaustedCount),
    meanRplEnds: meanProfile(runs, (r) => r.metrics.rplEndCount),
    meanRplRemaining: meanProfile(runs, (r) => r.metrics.meanRplRemaining),
    runs,
  };
}

const comparisons = byProfile.fertile_field.map((r) => ({
  seed: r.seed,
  vsOpen: compareRplLimited(
    byProfile.fertile_field_open.find((x) => x.seed === r.seed).metrics,
    r.metrics
  ),
}));

const report = {
  runAt: new Date().toISOString(),
  phase: 37,
  extension: 'rpl_replication_limit',
  gap: 'GAP-17',
  ticks: TICKS,
  seeds: SEEDS,
  profiles: Object.fromEntries(PROFILE_IDS.map((id) => [id, ENV_PROFILES[id]])),
  aggregate,
  comparisons,
  roadmap: 'docs/PHASE37_RPL.md',
};

writeFileSync(
  new URL('../docs/field-phase37-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n=== 环境均值 ===');
console.log('profile'.padEnd(24), 'FISS', '存活', '耗尽', 'RPL_END', '均剩余');
for (const pid of PROFILE_IDS) {
  const a = aggregate[pid];
  console.log(
    pid.padEnd(24),
    String(a.meanFiss ?? '—').padStart(5),
    String(a.meanAlive ?? '—').padStart(5),
    String(a.meanExhausted ?? '—').padStart(5),
    String(a.meanRplEnds ?? '—').padStart(8),
    String(a.meanRplRemaining ?? '—').padStart(8)
  );
}

console.log('\n报告已写入 docs/field-phase37-report.json');
await maybeUploadFieldReport({ phase: 37, report });
