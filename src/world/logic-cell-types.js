// 多细胞 v2 — 逻辑细胞类型表（机制层标签，非地球器官 CODEX）

export const LOGIC_CELL_MAX_PER_TYPE = 8;

/** 外膜不计入 8 上限 */
export const SKIN_CELL_CODE = 'MBR-SKN';

/** 未分化干细胞池（受精卵发育起点） */
export const STEM_CELL_CODE = 'STEM';
export const STEM_CELL_MAX = 12;

export const LIFE_STAGE_GEST = 'GEST';
export const LIFE_STAGE_JUV = 'JUV';
export const LIFE_STAGE_ADT = 'ADT';

export const LOGIC_CELL_TYPES = [
  {
    code: 'LOG-BRN',
    analogy: '脑细胞',
    roles: ['memory', 'consciousness', 'internal'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-GON',
    analogy: '生殖细胞',
    roles: ['repro', 'half-state'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_ADT],
  },
  {
    code: 'LOG-DIG',
    analogy: '消化细胞',
    roles: ['draw', 'metabolism'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_GEST, LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-NRV',
    analogy: '神经细胞',
    roles: ['intra', 'signal-internal'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_GEST, LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-LNG',
    analogy: '语言细胞',
    roles: ['tx', 'speech'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-MOT',
    analogy: '运动细胞',
    roles: ['act', 'motor'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-NTR',
    analogy: '营养运输细胞',
    roles: ['intra', 'nutrient-route'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_GEST, LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-RES',
    analogy: '呼吸细胞',
    roles: ['air', 'respiration'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_GEST, LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-HRM',
    analogy: '激素门控细胞',
    roles: ['hormone', 'gate'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_ADT],
  },
  {
    code: 'LOG-SEN-TH',
    analogy: '触觉感',
    roles: ['sense', 'touch'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-SEN-TM',
    analogy: '温度感',
    roles: ['sense', 'thermo'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-SEN-GU',
    analogy: '味觉',
    roles: ['sense', 'gustation'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-SEN-VS',
    analogy: '视觉',
    roles: ['sense', 'vision'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-SEN-AU',
    analogy: '听觉',
    roles: ['sense', 'audition'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
  {
    code: 'LOG-SEN-OL',
    analogy: '嗅觉',
    roles: ['sense', 'olfaction'],
    max: LOGIC_CELL_MAX_PER_TYPE,
    diffStages: [LIFE_STAGE_JUV],
  },
];

export const STEM_CELL_TYPE = {
  code: STEM_CELL_CODE,
  analogy: '未分化干细胞',
  roles: ['stem', 'zygote'],
  max: STEM_CELL_MAX,
  diffStages: [],
};

export function logicCellTypeByCode(code) {
  if (code === STEM_CELL_CODE) return STEM_CELL_TYPE;
  return LOGIC_CELL_TYPES.find((t) => t.code === code) ?? null;
}

export function typesDifferentiableInStage(stage) {
  return LOGIC_CELL_TYPES.filter((t) => t.diffStages?.includes(stage));
}

export function initialStemCellCount(rng) {
  return 4 + Math.floor(rng() * 3);
}

/** 宫内合胞干细胞池（略高于普通幼体起点） */
export function initialEmbryoStemCellCount(rng) {
  return 6 + Math.floor(rng() * 3);
}

/** 宫内着床时先天原基（GEST 可分化类型） */
export const GEST_PRIMORDIA_COUNTS = {
  'LOG-DIG': 1,
  'LOG-NRV': 1,
  'LOG-NTR': 1,
  'LOG-RES': 1,
};

/** 出生/外排时必备逻辑细胞下限（数量可少但不得为 0） */
export const BIRTH_MIN_LOGIC_COUNTS = {
  'LOG-BRN': 1,
  'LOG-DIG': 2,
  'LOG-NRV': 2,
  'LOG-NTR': 1,
  'LOG-RES': 1,
  'LOG-MOT': 1,
};
