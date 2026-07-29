#!/usr/bin/env node
/**
 * Phase 83 — L2/GAP-10 正式结案决策 + CODEX 立项验证
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';

function loadJson(relPath) {
  const url = new URL(relPath, import.meta.url);
  if (!existsSync(url)) return null;
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch {
    return null;
  }
}

const acceptance = loadJson('../docs/wisdom-acceptance-report.json');
const phase72 = loadJson('../docs/field-phase72-report.json');
const phase80 = loadJson('../docs/field-phase80-report.json');
const phase81 = loadJson('../docs/field-phase81-report.json');
const codex = readFileSync(new URL('../docs/CODEX.md', import.meta.url), 'utf8');

if (!acceptance || !phase72) {
  console.error('✗ 缺少验收或 Phase72 报告 — 请先运行 npm run wisdom:acceptance');
  process.exit(1);
}

const p72best = phase72.batchVerdict?.bestUnanimousBases ?? 0;
const p80best = phase80?.batchVerdict?.bestUnanimousBases ?? 0;
const p81best = phase81?.batchVerdict?.bestUnanimousBases ?? 0;
const acceptancePrepared = acceptance.verdict === 'prepared';
const hasCodexEntry = codex.includes('## 智慧演化物种验收');

const assaultFailed = p80best < p72best && p81best < p72best;
const decision =
  acceptancePrepared && p72best >= 3 && assaultFailed
    ? 'accepted_partial_ceiling'
    : p72best >= 3
      ? 'partial_open'
      : 'not_ready';

const closure = {
  runAt: new Date().toISOString(),
  phase: 83,
  extension: 'l2_gap10_closure',
  decision,
  evidence: {
    phase72BestUnanimous: p72best,
    phase80BestUnanimous: p80best,
    phase81BestUnanimous: p81best,
    acceptanceVerdict: acceptance.verdict,
    assaultFailed,
  },
  gap10: {
    status: decision === 'accepted_partial_ceiling' ? 'closed_partial' : 'open',
    ceiling: '3/4 unanimous (Phase 72)',
    openBase: '碱基 1',
    prohibition: '禁止脚本化选择压',
  },
  l2: {
    L2b_selection: { status: 'partial', note: 'SEL 信号弱；接受观测上限' },
    L2c_repeatable: { status: 'partial', gap: 'GAP-10', closure: decision },
  },
  codex: {
    entry: '智慧演化物种验收',
    ready: hasCodexEntry && decision === 'accepted_partial_ceiling',
  },
  obs: ['OBS-20260729-93', 'OBS-20260729-94'],
  roadmap: 'docs/PHASE83_L2_CODEX_CLOSURE.md',
};

writeFileSync(
  new URL('../docs/wisdom-l2-closure-report.json', import.meta.url),
  JSON.stringify(closure, null, 2)
);

console.log('L2/GAP-10 结案决策\n');
console.log(`Phase 72 最佳：${p72best}/4 unanimous`);
console.log(`Phase 80 最佳：${p80best}/4`);
console.log(`Phase 81 最佳：${p81best}/4`);
console.log(`物种验收：${acceptance.verdict}`);
console.log(`\n决策：${decision}`);
console.log(`GAP-10：${closure.gap10.status}`);
console.log(`CODEX 智慧演化物种验收：${hasCodexEntry ? '✓' : '✗'}`);

if (!closure.codex.ready) process.exit(1);
