/** 田野多样本群体 — 六代号 × 双份，统计视角而非个体追踪 */

export const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';

export const FIELD_TICKS = 960;
export const FIELD_LONG_TICKS = 1920;
export const FIELD_XLONG_TICKS = 3840;
export const FIELD_SEEDS = [0, 1, 2, 3];

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
