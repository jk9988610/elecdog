#!/usr/bin/env node
/**
 * Phase 7 — 实验体 004 / 005 / 006 各 3 只单世界 200 tick
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { analyzeRun, runTicks } from './lib/analyze.js';
import { generateTemplate } from '../src/core/dna.js';
import { diffDna } from './lib/cross.js';

const TICKS = 200;
const CODES = ['004', '005', '006'];

function runSolo(code, name) {
  const world = createWorld('01');
  const recorder = new Recorder();
  const { id, being, dna } = performBirthRitual(world, recorder, { name, code });
  runTicks(world, recorder, TICKS);
  const analysis = analyzeRun({ entries: recorder.entries, beingId: id, ticks: TICKS });
  const exts = recorder.entries.filter((e) => e.channel === 'external' && e.beingId === id);
  const tx = exts.filter((e) => e.content.startsWith('[TX]')).length;
  const act = exts.filter((e) => e.content.startsWith('[ACT]')).length;
  return {
    code,
    name,
    id: id.slice(-8),
    pulse: analysis.pulse,
    externalRate: analysis.externalTickRate,
    r4: analysis.regTrends.r4.trend,
    r4range: [analysis.regTrends.r4.t1, analysis.regTrends.r4.tEnd],
    txRatio: tx / (tx + act),
    mutations: dna.mutationCount,
  };
}

function stats(rows) {
  const rates = rows.map((r) => r.externalRate);
  const r4up = rows.filter((r) => r.r4 === 'rising').length;
  const r4down = rows.filter((r) => r.r4 === 'falling').length;
  const r4stable = rows.filter((r) => r.r4 === 'stable').length;
  return {
    n: rows.length,
    avgExternal: rates.reduce((a, b) => a + b, 0) / rates.length,
    minExternal: Math.min(...rates),
    maxExternal: Math.max(...rates),
    r4: { rising: r4up, falling: r4down, stable: r4stable },
    avgTxRatio: rows.reduce((a, r) => a + r.txRatio, 0) / rows.length,
  };
}

const all = [];
const byCode = {};

for (const code of CODES) {
  byCode[code] = [];
  for (let i = 0; i < 3; i++) {
    const names = { '004': '丁', '005': '戊', '006': '己' };
    const n = ['甲', '乙', '丙'][i];
    const row = runSolo(code, `${code}-${n}`);
    byCode[code].push(row);
    all.push(row);
  }
}

const templates = {};
for (const code of CODES) {
  templates[code] = generateTemplate(code).slice(0, 16) + '…';
}

const templateStats = {};
for (const code of CODES) {
  templateStats[code] = stats(byCode[code]);
}

// 与已知 001/002/003 均值对照（来自既往报告）
const baseline = {
  '001': { avgExternal: 0.545, source: 'OBS-01~05 综合' },
  '002': { avgExternal: 0.571, source: 'OBS-06~12 五只均值' },
  '003': { avgExternal: 0.541, source: 'OBS Phase4-5 五只' },
};

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  individuals: all,
  byCode,
  templateStats,
  templates,
  templateDiffs: {
    '004_001': diffDna(generateTemplate('004'), generateTemplate('001')).diffCount,
    '005_001': diffDna(generateTemplate('005'), generateTemplate('001')).diffCount,
    '006_001': diffDna(generateTemplate('006'), generateTemplate('001')).diffCount,
  },
  baselineComparison: { ...baseline, '004': templateStats['004'], '005': templateStats['005'], '006': templateStats['006'] },
};

writeFileSync(new URL('../docs/field-phase7-report.json', import.meta.url), JSON.stringify(report, null, 2));

console.log('Phase 7 完成\n');
for (const code of CODES) {
  const s = templateStats[code];
  console.log(`--- ${code} (n=${s.n}) ---`);
  console.log(`  对外率: 均${(s.avgExternal * 100).toFixed(1)}% [${(s.minExternal * 100).toFixed(0)}-${(s.maxExternal * 100).toFixed(0)}%]`);
  console.log(`  r4: 升${s.r4.rising} 降${s.r4.falling} 稳${s.r4.stable}`);
  console.log(`  TX占外部: ${(s.avgTxRatio * 100).toFixed(0)}%`);
}
console.log('\n对照 001~003 均值:');
for (const [c, v] of Object.entries(baseline)) {
  console.log(`  ${c}: ${(v.avgExternal * 100).toFixed(1)}%`);
}
