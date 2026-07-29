/**
 * 观察台呈现模式：原版（机器语言标签）vs 类比版（地球常见词辅助）
 *
 * 类比版仅为观察辅助，不写入 CODEX / 不改变世界规则。
 * 见 docs/PHASE32_WORLD_COMPLETENESS.md
 */

const LS_VIEW = 'elecdog-view-mode';

export const VIEW_NATIVE = 'native';
export const VIEW_ANALOGY = 'analogy';

export function getViewMode() {
  try {
    const v = localStorage.getItem(LS_VIEW);
    if (v === VIEW_ANALOGY || v === VIEW_NATIVE) return v;
  } catch {
    /* ignore */
  }
  return VIEW_NATIVE;
}

export function setViewMode(mode) {
  if (mode !== VIEW_NATIVE && mode !== VIEW_ANALOGY) {
    throw new Error('无效呈现模式');
  }
  localStorage.setItem(LS_VIEW, mode);
}

export function isAnalogyMode() {
  return getViewMode() === VIEW_ANALOGY;
}

/** 仪表盘标签：key → { native, analogy } */
const LABELS = {
  substrate: { native: '数字基底场', analogy: '环境场（八通道）' },
  nodes: { native: '行动标靶', analogy: '可争夺的资源点' },
  envPulse: { native: '环境脉搏与反馈', analogy: '环境波动与回响' },
  popStruct: { native: '种群结构迹', analogy: '种群构成指标' },
  popLife: { native: '存续与谱系', analogy: '生死与后代' },
  social: { native: '社会位', analogy: '群体位置分布' },
  beings: { native: '个体', analogy: '存活个体' },
  stress: { native: '场压', analogy: '内外张力' },
  lowStreak: { native: 'LOW 连击', analogy: '连续匮乏' },
  extRate: { native: '对外率', analogy: '外向活动比例' },
  drw: { native: '摄取 DRW', analogy: '从环境摄取' },
  low: { native: '匮乏 LOW', analogy: '环境不足' },
  integrity: { native: '膜完整性', analogy: '边界完整度' },
  mbr: { native: '跨域 MBR', analogy: '跨界摄取' },
  metabolismDomain: { native: '代谢域', analogy: '可代谢的环境通道' },
  generation: { native: '代', analogy: '谱系代次' },
  slot: { native: '社会位', analogy: '群体位置' },
  aliveTicks: { native: '存活 tick', analogy: '已存活时间（拍）' },
  amb: { native: '脉搏 AMB', analogy: '环境节律' },
  ptb: { native: '扰动 PTB', analogy: '随机扰动' },
  res: { native: '回响 RES', analogy: '行动余波' },
  tgt: { native: '标靶 TGT', analogy: '命中资源点' },
  dep: { native: '枯竭 DEP', analogy: '资源点耗尽' },
  shk: { native: '剧变 SHK', analogy: '环境剧变' },
  npl: { native: '节点脉冲 NPL', analogy: '资源点突变' },
  bio: { native: '生物圈 BIO', analogy: '群体活动反馈' },
  end: { native: '终止 END', analogy: '个体停止' },
  lineage: { native: '续行 LINEAGE', analogy: '后代诞生' },
  sel: { native: '筛选 SEL', analogy: '环境筛选' },
  contest: { native: '争夺 contest', analogy: '同点争夺' },
  nur: { native: '通量 NUR', analogy: '亲代通量扶持' },
  intra: { native: '胞内 INTRA', analogy: '子单元内协作' },
  org: { native: '形态 ORG', analogy: '个体结构类型' },
  fiss: { native: '分裂 FISS', analogy: '存活复制（DNA 分裂）' },
  rpl: { native: '复制 RPL', analogy: 'DNA 剩余复制次数' },
  ren: { native: '续行 REN', analogy: '环境重置复制配额' },
  plg: { native: '汇合 PLG', analogy: '双体通量汇合续行' },
  rco: { native: '代价 RCO', analogy: '续行代谢/寿命代价' },
};

export function label(key) {
  const row = LABELS[key];
  if (!row) return key;
  return isAnalogyMode() ? row.analogy : row.native;
}

export function formatSlot(slot) {
  if (!isAnalogyMode()) return slot;
  const n = slot?.replace?.(/^S/, '') ?? slot;
  return `位置 ${n}`;
}

export function formatGeneration(gen) {
  if (!isAnalogyMode()) return `代${gen}`;
  return `谱系第 ${gen} 代`;
}

export function viewModeHint() {
  return isAnalogyMode()
    ? '类比呈现：用常见词辅助理解，非世界辞典定义'
    : '原版呈现：机器语言与田野标签';
}
