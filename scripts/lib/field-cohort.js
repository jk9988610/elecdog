/** 田野多样本群体 — 六代号 × 双份，统计视角而非个体追踪 */

export const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';

export const FIELD_TICKS = 960;
export const FIELD_MED_TICKS = 640;
export const FIELD_SHORT_TICKS = 384;
export const FIELD_LONG_TICKS = 1920;
export const FIELD_XLONG_TICKS = 3840;
export const FIELD_W2_TICKS = 3000;
export const FIELD_WISDOM_OPEN_TICKS = 8192;
export const FIELD_SEEDS = [0, 1, 2, 3];

/** 单次田野实验时长上限：见 scripts/lib/field-budget.js（默认 3 分钟，超时即不通过） */

/** 四体信号链田野 — 001–004（每种子固定 16 位身份证，不依赖全局序号） */
export function buildQuadChainCohort(seed = 0) {
  const dateStr = '20260729';
  return ['001', '002', '003', '004'].map((code, i) => {
    const breed = code.slice(-2);
    const seq = String(seed * 4 + i + 1).padStart(4, '0');
    return {
      name: code === '001' ? '观察者' : code,
      code,
      dnaSequence: code === '001' ? OBSERVER_DNA : null,
      id: `01${dateStr}${breed}${seq}`,
    };
  });
}

/** 12 体：001–006 各 2（模板多样性） */
export function buildFieldCohort(seed = 0, { count = 12 } = {}) {
  const codes = ['001', '002', '003', '004', '005', '006'];
  const specs = codes.flatMap((code) => [
    {
      name: code === '001' ? '观察者' : code,
      code,
      dnaSequence: code === '001' ? OBSERVER_DNA : null,
      id: code === '001' ? `012026072901000${seed}` : null,
      cohortTag: 'naive',
    },
    { name: `${code}-乙`, code, cohortTag: 'naive' },
  ]);
  return specs.slice(0, count);
}

/** 4 体：2×形态A + 2×形态B（GAP-PAIR-0） */
export function buildPairCohort(seed = 0) {
  const dateStr = '20260730';
  const bases = [
    { name: '形态A1', code: '007', pairMorph: 'A', breed: '07' },
    { name: '形态B1', code: '008', pairMorph: 'B', breed: '08' },
    { name: '形态A2', code: '009', pairMorph: 'A', breed: '09' },
    { name: '形态B2', code: '010', pairMorph: 'B', breed: '10' },
  ];
  return bases.map((b, i) => ({
    name: b.name,
    code: b.code,
    pairMorph: b.pairMorph,
    id: `01${dateStr}${b.breed}${String(seed * 4 + i + 1).padStart(4, '0')}`,
    cohortTag: 'naive',
  }));
}

/** Phase 106 — naive + 留置混合队列 */
export function buildMixedCohort(seed = 0, carrySnapshots = [], profile = {}) {
  const naiveCount = profile.carryNaiveCount ?? 10;
  const naive = buildFieldCohort(seed, { count: naiveCount });
  const carries = (carrySnapshots ?? []).map((snap, i) => ({
    name: snap.name ?? `留置${i + 1}`,
    code: snap.code ?? '007',
    dnaSequence: snap.dnaSequence,
    id: `01carry${seed}${String(i + 1).padStart(3, '0')}`,
    cohortTag: 'carry',
    _carrySnapshot: snap,
  }));
  return [...naive, ...carries];
}

/** Phase 129 — 4 体 PAIR naive + ≤2 留置（形态 A/B 指派） */
export function buildMixedPairCohort(seed = 0, carrySnapshots = [], profile = {}) {
  const naive = buildPairCohort(seed);
  const morphAssign = profile.carryPairMorphAssign ?? ['A', 'B'];
  const carries = (carrySnapshots ?? []).slice(0, morphAssign.length).map((snap, i) => {
    const pairMorph = morphAssign[i] ?? 'A';
    const enriched = { ...snap, pairMorph };
    return {
      name: snap.name ?? `留置${pairMorph}${i + 1}`,
      code: snap.code ?? (pairMorph === 'A' ? '007' : '008'),
      dnaSequence: snap.dnaSequence,
      pairMorph,
      id: `01pcarry${seed}${String(i + 1).padStart(3, '0')}`,
      cohortTag: 'carry',
      _carrySnapshot: enriched,
    };
  });
  return [...naive, ...carries];
}

export function buildFinalCarryCohort(seed, carries, profile) {
  const carryMode = profile.carryMode ?? 'none';
  const isPair = profile.cohort === 'pair';
  if (carryMode === 'none') {
    return isPair ? buildPairCohort(seed) : buildFieldCohort(seed);
  }
  return isPair ? buildMixedPairCohort(seed, carries, profile) : buildMixedCohort(seed, carries, profile);
}
