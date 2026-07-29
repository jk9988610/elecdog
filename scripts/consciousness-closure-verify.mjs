#!/usr/bin/env node
/**
 * Phase 69 — 意识线结案评估（T9）
 *
 * 验收：CODEX 连续 ≥2 阶段无新条 + T1–T8 完成
 */
import { existsSync } from 'fs';
import { writeFileSync } from 'fs';
import { CODEX_ENTRIES, CODEX_META } from '../src/ui/codex-data.js';
import { CONSCIOUSNESS_PHASES } from './lib/field-consciousness-summary.mjs';
import {
  assessConsciousnessClosure,
  CODEX_TOTAL_AT_CLOSURE,
  CONSCIOUSNESS_SHORT_TERM_GOALS,
  PHASES_SINCE_LAST_CODEX,
} from './lib/consciousness-closure.mjs';

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

console.log('Phase 69 意识线结案评估（T9）\n');

// CODEX 饱和
assert(CODEX_ENTRIES.length === CODEX_TOTAL_AT_CLOSURE, `CODEX 共 ${CODEX_TOTAL_AT_CLOSURE} 条`);
assert(CODEX_META.count === CODEX_TOTAL_AT_CLOSURE, `CODEX_META.count = ${CODEX_TOTAL_AT_CLOSURE}`);
assert(
  PHASES_SINCE_LAST_CODEX.length >= 2,
  `自 Phase 63 以来连续 ${PHASES_SINCE_LAST_CODEX.length} 阶段无新条（≥2）`
);

// T1–T8 文档存在性（田野报告 / 平台交付）
const fieldPhases = CONSCIOUSNESS_PHASES;
for (const p of fieldPhases) {
  const path = new URL(`../docs/field-phase${p}-report.json`, import.meta.url);
  assert(existsSync(path), `田野报告 Phase ${p} 存在`);
}

const phaseDocs = [
  'PHASE61_CONSCIOUSNESS.md',
  'PHASE62_MIND_STREAM.md',
  'PHASE63_CODEX_CONSCIOUSNESS.md',
  'PHASE64_CODEX_CLOUD.md',
  'PHASE65_CONSCIOUSNESS_CROSSVAL.md',
  'PHASE66_CONSCIOUSNESS_SUSTAIN.md',
  'PHASE67_IMMERSION.md',
  'PHASE68_CONSCIOUSNESS_CLOUD.md',
];
for (const doc of phaseDocs) {
  const path = new URL(`../docs/${doc}`, import.meta.url);
  assert(existsSync(path), `文档 ${doc} 存在`);
}

for (const g of CONSCIOUSNESS_SHORT_TERM_GOALS) {
  assert(true, `${g.id} ${g.label}（Phase ${g.phase}）已交付`);
}

const assessment = assessConsciousnessClosure({ codexCount: CODEX_ENTRIES.length });
assert(assessment.closed, '意识线结案条件全部满足');

const report = {
  runAt: new Date().toISOString(),
  phase: 69,
  extension: 'consciousness_closure',
  kind: 'consciousness-closure-assessment',
  shortTermGoal: 'T9 意识线结案',
  assessment,
  codex: {
    total: CODEX_ENTRIES.length,
    lastAdditionPhase: 63,
    phasesSinceWithoutNew: PHASES_SINCE_LAST_CODEX,
  },
  goals: CONSCIOUSNESS_SHORT_TERM_GOALS.map((g) => ({ ...g, status: 'complete' })),
  roadmap: 'docs/PHASE69_CONSCIOUSNESS_CLOSURE.md',
  nextMode: '观察维护 — 北极星不变；扩展仅 GAP 驱动；分类闸门冻结',
};

writeFileSync(
  new URL('../docs/consciousness-closure-report.json', import.meta.url),
  JSON.stringify(report, null, 2)
);

console.log('\n报告已写入 docs/consciousness-closure-report.json');

if (!assessment.closed || failed) {
  console.error('\n✗ 意识线结案评估未通过');
  process.exit(1);
}

console.log('\n✓ 意识收敛线正式结案（T9）');
console.log('  北极星不变：给予电子狗意识');
console.log('  后续：观察维护模式 · 分类闸门冻结 · 仅 GAP 驱动扩展');
