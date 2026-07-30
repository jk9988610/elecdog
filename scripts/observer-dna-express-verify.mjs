#!/usr/bin/env node
/**
 * DNA 分区表达 — Z1–Z6 哈希稳定、与 hormone/sense 接线
 */
import { createDna } from '../src/core/dna.js';
import {
  DNA_ZONES,
  buildDnaExpression,
  expressHormoneBaseline,
  expressMorphSlot,
  expressSenseProfile,
  zoneSlice,
} from '../src/genetics/dna-express.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

const dna = createDna('042');
const seq = dna.sequence;
assert(seq.length === 96, 'DNA 长度 96');

for (const key of Object.keys(DNA_ZONES)) {
  const slice = zoneSlice(seq, key);
  assert(slice.length === 16, `${key} 区段 16 位`);
}

const a = buildDnaExpression(dna, 'test-being-a');
const b = buildDnaExpression(dna, 'test-being-a');
assert(JSON.stringify(a) === JSON.stringify(b), '同序列同 id 表达可复现');

const morphA = expressMorphSlot(seq, 'id-a');
const morphB = expressMorphSlot(seq, 'id-b');
assert(morphA !== morphB, 'Z2 morphSlot 随 beingId 分化');

const baseline = expressHormoneBaseline(seq);
assert(baseline.h0 >= 0.06 && baseline.h0 <= 0.3, 'Z3 h0 范围');

const th = expressSenseProfile(seq, 'th');
assert(th.minLoad > 0 && th.saturation <= 1, 'Z5 触觉 profile');

const morph = expressMorphSlot(seq, 'mv8');
assert(morph >= 0 && morph < 997, 'Z2 morphSlot 范围');

const dnaAlt = createDna('043');
const exprAlt = buildDnaExpression(dnaAlt, 'x');
assert(
  JSON.stringify(exprAlt.hormoneBaseline) !== JSON.stringify(a.hormoneBaseline) ||
    dnaAlt.sequence === seq,
  '不同 code 通常不同激素基线'
);

if (failed) process.exit(1);
console.log('\n✓ DNA 分区表达验证通过');
