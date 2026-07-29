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
  mei: { native: '减数 MEI', analogy: 'DNA 单源缩减包' },
  fus: { native: '汇合 FUS', analogy: '双源 DNA 重组诞生' },
  bcn: { native: '信标 BCN', analogy: 'packet 就绪广播' },
  exp: { native: '阅历 EXP', analogy: '经历阶段（非地球年龄）' },
  expStage: { native: '阅历阶段', analogy: '经历阶段' },
  reg: { native: '寄存器 REG', analogy: 'r–e 耦合模式' },
  regMode: { native: '寄存器模式', analogy: '场对齐模式' },
  mtb: { native: '代谢 MTB', analogy: '摄取通道档案' },
  metProfile: { native: '代谢档案', analogy: '通道摄取模式' },
  coop: { native: '合作 COOP', analogy: '社会迹模式' },
  coopMode: { native: '合作模式', analogy: '社会互动模式' },
  lay: { native: '档案 LAY', analogy: '四层跃迁合计' },
  rpr: { native: '繁殖 RPR', analogy: '繁殖路径档案' },
  rprMode: { native: '繁殖模式', analogy: '繁殖路径模式' },
  ehu: { native: '电子人 EHU', analogy: '自我连续档案（非人格预制）' },
  ehuStage: { native: '电子人阶段', analogy: '自我连续阶段' },
  ehuLin: { native: '谱系回响', analogy: '亲代连续迹（非遗传情感）' },
  ehuBind: { native: '社会绑定', analogy: '自我-社会交叉迹' },
  ehuRen: { native: '续行 EHU-REN', analogy: '续行与自我连续交叉迹' },
  psn: { native: '人格 PSN', analogy: '六层跃迁合计' },
  envStack: { native: '环境栈', analogy: '区带·地形·相位（类比）' },
  envStackOff: {
    native: '当前环境未启用区带/相位栈 — 可选「观察台·环境栈」环境',
    analogy: '当前环境未启用区带/相位 — 请切换至环境栈观察配置',
  },
  envPlace: { native: '区位', analogy: '诞生区位' },
  envPhases: { native: '相位', analogy: '周期相位（类比）' },
  envLogs: { native: '通道计数', analogy: '环境通道记录' },
  birthPlace: { native: 'birthPlace', analogy: '诞生区位码' },
  envBand: { native: '区带', analogy: '纬度带（类比）' },
  envPatch: { native: 'patch', analogy: '局域格点' },
  envTerrain: { native: '地形', analogy: '陆海格（类比）' },
  envDiurnal: { native: '日相 DLC', analogy: '日相（类比）' },
  envSeasonal: { native: '季相 SCL', analogy: '季相（类比）' },
  envLunar: { native: '月相 LTC', analogy: '潮汐相（类比）' },
  envAir: { native: '大气 AIR', analogy: '大气标量（类比）' },
  envPcp: { native: '水循环 PCP', analogy: '相态储库（类比）' },
  envDay: { native: '昼相', analogy: '白昼' },
  envNight: { native: '夜相', analogy: '夜相' },
  envDiurnalStats: { native: '昼/夜 tick', analogy: '明/暗拍计数' },
  envTools: { native: '工具/储备层', analogy: '内共生与场工具（类比）' },
  envRsv: { native: '储备 RSV', analogy: '内部储能（类比）' },
  envSynth: { native: 'Synth A/B', analogy: '内生产通量（类比）' },
  envSym: { native: '捕获 SYM', analogy: '模块捕获（类比）' },
  envArt: { native: '场态 ART', analogy: '持久结构（类比）' },
  envVent: { native: '地热 VTN', analogy: '局域微源（类比）' },
  envVentOn: { native: 'vent on', analogy: '微源活跃' },
  envVentOff: { native: 'vent off', analogy: '微源休眠' },
  envMig: { native: '迁徙 MIG', analogy: '区位移动（类比）' },
  envDsp: { native: '耗散 DSP', analogy: '通量分流（类比）' },
  envAdv: { native: '平流 ADV', analogy: '邻格搬运（类比）' },
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

export function formatExpStage(stage) {
  const labels = { E0: '初态', E1: '积累', E2: '稳态', E3: '磨损' };
  if (!isAnalogyMode()) return stage ?? 'E0';
  return labels[stage] ?? stage ?? '初态';
}

export function formatRegMode(mode) {
  const labels = { SYNC: '同步', LAG: '滞后', SCATTER: '离散', LOCK: '锁定' };
  if (!isAnalogyMode()) return mode ?? 'SYNC';
  return labels[mode] ?? mode ?? '同步';
}

export function formatMetProfile(profile) {
  const labels = { N0: '初采', DOM: '单通道主导', BAL: '多通道均衡', SCAR: '匮乏型' };
  if (!isAnalogyMode()) return profile ?? 'N0';
  return labels[profile] ?? profile ?? '初采';
}

export function formatCoopMode(mode) {
  const labels = { S0: '初态', SOLO: '孤立', MESH: '交叉接收', RIVAL: '争夺', ECHO: '广播' };
  if (!isAnalogyMode()) return mode ?? 'S0';
  return labels[mode] ?? mode ?? '初态';
}

export function formatRprMode(mode) {
  const labels = {
    R0: '初态',
    SEED_DOM: '种子代',
    LIN_DOM: '谱系路径',
    FIS_DOM: '分裂路径',
    RCM_DOM: '重组路径',
    MULTI: '多路径',
  };
  if (!isAnalogyMode()) return mode ?? 'R0';
  return labels[mode] ?? mode ?? '初态';
}

export function formatEhuStage(stage) {
  const labels = { H0: '初态', H1: '可追踪', H2: '整合', H3: '叙事' };
  if (!isAnalogyMode()) return stage ?? 'H0';
  return labels[stage] ?? stage ?? '初态';
}

export function viewModeHint() {
  return isAnalogyMode()
    ? '类比呈现：用常见词辅助理解，非世界辞典定义'
    : '原版呈现：机器语言与田野标签';
}

export function formatBand(band) {
  if (!band) return '—';
  if (!isAnalogyMode()) return `区带 ${band}`;
  const labels = { E: '赤道带 (E)', M: '中带 (M)', P: '极带 (P)' };
  return labels[band] ?? band;
}

export function formatTerrain(terrain) {
  if (!terrain) return '—';
  if (!isAnalogyMode()) return `地形 ${terrain}`;
  return terrain === 'O' ? '海格 (O)' : '陆格 (L)';
}

export function formatPatch(patch) {
  if (patch == null) return '—';
  if (!isAnalogyMode()) return `patch ${patch}`;
  return `格点 ${patch}`;
}

export function formatDiurnalQuarter(q) {
  if (!isAnalogyMode()) return `q${q ?? 0}`;
  const labels = ['夜相', '晨相', '昼相', '暮相'];
  return labels[q] ?? `q${q}`;
}

export function formatSeasonPhase(phase) {
  if (!isAnalogyMode()) return `相${phase ?? 0}`;
  const labels = ['暖相', '基准相', '冷相', '过渡相'];
  return labels[phase] ?? `相${phase}`;
}

export function formatLunarPhase(phase) {
  if (!isAnalogyMode()) return `潮${phase ?? 0}`;
  const labels = ['低潮', '上潮', '高潮', '下潮'];
  return labels[phase] ?? `潮${phase}`;
}
