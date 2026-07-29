/** 田野多样本群体 — 六代号 × 双份，统计视角而非个体追踪 */

export const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';

export const FIELD_TICKS = 960;
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
export function buildFieldCohort(seed = 0) {
  const codes = ['001', '002', '003', '004', '005', '006'];
  return codes.flatMap((code, i) => [
    {
      name: code === '001' ? '观察者' : code,
      code,
      dnaSequence: code === '001' ? OBSERVER_DNA : null,
      id: code === '001' ? `012026072901000${seed}` : null,
    },
    { name: `${code}-乙`, code },
  ]);
}
