#!/usr/bin/env node
/**
 * Phase 105 — GAP-W06 [SEM] 载荷共现迹 CODEX 立项就绪验证
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';

const field100Path = new URL('../docs/field-phase100-report.json', import.meta.url);
const field103Path = new URL('../docs/field-phase103-report.json', import.meta.url);
const codexPath = new URL('../docs/CODEX.md', import.meta.url);
const obsPath = new URL('../docs/OBSERVATION_LOG.md', import.meta.url);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

for (const p of [field100Path, field103Path]) {
  if (!existsSync(p)) {
    console.error(`✗ 缺少 ${p.pathname} — 请先运行对应 field 批次`);
    process.exit(1);
  }
}

const field100 = JSON.parse(readFileSync(field100Path, 'utf8'));
const field103 = JSON.parse(readFileSync(field103Path, 'utf8'));
const codex = readFileSync(codexPath, 'utf8');
const obsLog = readFileSync(obsPath, 'utf8');

const v100 = field100.batchVerdict?.verdict ?? 'unknown';
const v103 = field103.batchVerdict?.verdict ?? 'unknown';
const hasCodexEntry = codex.includes('## 载荷共现迹');
const forbidden = ['智慧语言', '## 语言', '## 对话'].some((t) => codex.includes(t));

const obsIds = ['OBS-20260729-99', 'OBS-20260729-100', 'OBS-20260729-101'];
for (const id of obsIds) {
  assert(obsLog.includes(`## ${id}`), `观察日志含 ${id}`);
}

assert(v100 === 'support', `Phase 100 田野 support（${v100}）`);
assert(v103 === 'weak' || v103 === 'support', `Phase 103 田野 weak/support（${v103}）`);
assert(!forbidden, 'CODEX 无禁止地球式语言条名');
assert(!hasCodexEntry, 'CODEX 尚未写入载荷共现迹（待确认）');

const review = {
  runAt: new Date().toISOString(),
  phase: 105,
  extension: 'gap_w06_sem_codex',
  fieldPhases: [100, 103],
  fieldVerdicts: { phase100: v100, phase103: v103 },
  codexEntry: hasCodexEntry ? '载荷共现迹' : null,
  prerequisitesMet: v100 === 'support' && (v103 === 'weak' || v103 === 'support') && obsIds.every((id) => obsLog.includes(id)),
  codexReady: hasCodexEntry && v100 === 'support',
  awaitingUserConfirm: !hasCodexEntry,
  gapW06Status: 'partial_ready',
  obs: obsIds,
  roadmap: 'docs/PHASE105_SEM_CODEX.md',
};

writeFileSync(
  new URL('../docs/gap-w06-sem-codex-report.json', import.meta.url),
  JSON.stringify(review, null, 2)
);

console.log('\nGAP-W06 载荷共现迹 CODEX 立项就绪\n');
console.log(`Phase 100：${v100} · Phase 103：${v103}`);
console.log(`CODEX 新条：${hasCodexEntry ? '载荷共现迹 ✓' : '待确认写入'}`);
console.log(`立项前提：${review.prerequisitesMet ? '✓ 达标' : '✗ 未通过'}`);
console.log('\n报告已写入 docs/gap-w06-sem-codex-report.json');

if (!review.prerequisitesMet || failed) process.exit(1);
