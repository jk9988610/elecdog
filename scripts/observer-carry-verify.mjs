#!/usr/bin/env node
/**
 * Phase 109 — 观察台留置链 provenance 面板验证
 */
import { readFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnCarriedBeing } from '../src/birth/spawn.js';
import { mergeCarryProvenance } from '../src/carry/being-snapshot.js';
import { buildCarrySummary, renderCarryPanel } from '../src/ui/carry-panel.js';
import { buildDashboardStats } from '../src/ui/stats.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const snap = mergeCarryProvenance(
  {
    version: 1,
    code: '007',
    name: '留置甲',
    dnaSequence: '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303',
    generation: 1,
    ecoRepro: true,
    semTrace: [{ tx: 'A', rx: 'B', count: 3 }],
    semTraceWeight: 0.42,
    provenance: { envId: 'harsh_combined', tick: 640 },
  },
  'incubate',
  { envId: 'wisdom_evolution', tick: 384, priorEnv: 'harsh_combined' }
);

const world = createWorld('M-00-C');
applyEnvProfile(world, 'observer_wl_stack');
initEnvStackModules(world);
const recorder = new Recorder();

spawnCarriedBeing(world, recorder, snap, { cohortTag: 'carry', fixedId: '01carry001' });

const summary = buildCarrySummary(world);
assert(summary.count >= 1, `留置个体可读（${summary.count}）`);
assert(summary.withProvenance >= 1, 'provenance 已挂载');
assert(summary.maxChainDepth >= 1, `链深 ≥ 1（${summary.maxChainDepth}）`);

const html = renderCarryPanel(summary, { label: (k) => k });
assert(html.includes('carry-panel'), '面板 HTML 已渲染');
assert(html.includes('wisdom_evolution'), '链环境可见');

const stats = buildDashboardStats(world, recorder);
assert(stats.carry?.count >= 1, 'buildDashboardStats 含 carry 摘要');
assert(summary.chains[0]?.coopMode != null, 'coopMode 字段可读');

const observerSrc = readFileSync(new URL('../src/ui/observer.js', import.meta.url), 'utf8');
assert(observerSrc.includes('renderCarryPanel'), '观察台已挂载留置面板');

const analogySrc = readFileSync(new URL('../src/ui/analogy.js', import.meta.url), 'utf8');
assert(analogySrc.includes('carryPanel'), '类比标签已定义');

if (failed) process.exit(1);
console.log('\n✓ Phase 109 留置链观察台 UI 验证通过');
