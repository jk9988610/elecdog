#!/usr/bin/env node
/**
 * 田野批次 Phase 2
 * C. 双个体同世界（观察者 001 + 新 001）
 * D. 实验体 002 单个体
 * E. 实验体 002 第二只（对照模板内差异）
 * F. 双体 001+002 同世界
 */

import { writeFileSync } from 'fs';
import { createWorld } from '../src/world/world.js';
import { performBirthRitual } from '../src/birth/ritual.js';
import { Recorder } from '../src/recorder/logger.js';
import { generateTemplate } from '../src/core/dna.js';
import { analyzeRun, runTicks } from './lib/analyze.js';
import { countSameTickExternal, expectedCollisionRate, diffDna } from './lib/cross.js';

const TICKS = 200;
const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const OBSERVER_ID = '0120260729010001';

function runWorld(label, births, worldName = '01') {
  const world = createWorld(worldName);
  const recorder = new Recorder();
  recorder.system(0, `世界创建 ${world.name} [${label}]`);

  const born = [];
  for (const b of births) {
    born.push(performBirthRitual(world, recorder, b));
  }

  runTicks(world, recorder, TICKS);

  const analyses = born.map(({ id, being, dna }) => ({
    id,
    name: being.name,
    code: being.code,
    dna: dna.sequence,
    mutations: dna.mutationCount,
    analysis: analyzeRun({ entries: recorder.entries, beingId: id, ticks: TICKS }),
  }));

  const beingIds = born.map((b) => b.id);
  const collision =
    beingIds.length >= 2
      ? countSameTickExternal(recorder.entries, beingIds, TICKS)
      : null;

  if (collision && beingIds.length === 2) {
    const r0 = analyses[0].analysis.externalTickRate;
    const r1 = analyses[1].analysis.externalTickRate;
    collision.expectedIndependent = expectedCollisionRate([r0, r1]);
  }

  return { label, world: worldName, beingCount: born.length, analyses, collision, entryCount: recorder.entries.length };
}

const expC = runWorld('双体同世界 001+001', [
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '小狗乙', code: '001' },
]);

const expD = runWorld('实验体002 ①', [{ name: '002-甲', code: '002' }]);
const expE = runWorld('实验体002 ②', [{ name: '002-乙', code: '002' }]);

const expF = runWorld('双体同世界 001+002', [
  { name: '小狗', code: '001', dnaSequence: OBSERVER_DNA, id: OBSERVER_ID },
  { name: '002-丙', code: '002' },
]);

const template001 = generateTemplate('001');
const template002 = generateTemplate('002');
const templateDiff = diffDna(template001, template002);

const avg = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0) / arr.length;

const report = {
  runAt: new Date().toISOString(),
  ticks: TICKS,
  templates: {
    '001': template001.slice(0, 24) + '…',
    '002': template002.slice(0, 24) + '…',
    diffPositions: templateDiff.diffCount,
  },
  experiments: { C: expC, D: expD, E: expE, F: expF },
  templateStats: {
    '001': {
      samples: [expC.analyses[0], expC.analyses[1]].map((a) => ({
        externalRate: a.analysis.externalTickRate,
        r4trend: a.analysis.regTrends.r4.trend,
      })),
    },
    '002': {
      samples: [expD.analyses[0], expE.analyses[0]].map((a) => ({
        externalRate: a.analysis.externalTickRate,
        r4trend: a.analysis.regTrends.r4.trend,
        pulse: a.analysis.pulse,
      })),
      avgExternalRate: avg([expD, expE], (e) => e.analyses[0].analysis.externalTickRate),
    },
  },
};

writeFileSync(new URL('../docs/field-phase2-report.json', import.meta.url), JSON.stringify(report, null, 2));

function brief(exp) {
  console.log(`\n## ${exp.label} (${exp.beingCount}体)`);
  for (const a of exp.analyses) {
    const x = a.analysis;
    console.log(
      `  ${a.name}(${a.code}) 对外${(x.externalTickRate * 100).toFixed(1)}% r4:${x.regTrends.r4.trend} 脉冲:${x.pulse}`
    );
  }
  if (exp.collision) {
    console.log(
      `  同tick双对外: ${exp.collision.count}/${TICKS} (${(exp.collision.rate * 100).toFixed(1)}%) 独立期望:${((exp.collision.expectedIndependent ?? 0) * 100).toFixed(1)}%`
    );
  }
}

console.log('Phase 2 田野完成');
console.log('模板 001 vs 002 差异位:', templateDiff.diffCount, '/ 96');
brief(expC);
brief(expD);
brief(expE);
brief(expF);
