/**
 * 观察者释义表 — UI 专用，不写入 codex-data / 不改变世界规则
 *
 * 将田野与 CODEX 已确立的机制标签译为观察者可读中文。
 * 不对单个 hex 字节做地球语词典映射。
 */

export const OBSERVER_LEXICON_META = {
  id: 'observer-lexicon',
  title: '观察者释义表',
  note: '机制→中文辅助读；载荷三字节仍无固定地球词义',
};

/** SEM 四域 + 繁殖核（WL-R1） */
export const DOMAIN_CN = {
  YI: '衣·边界与躯体',
  SHI: '食·场通量与摄取',
  ZHU: '住·依附与宫内',
  XING: '行·位移与社会对外',
  'CORE-R': '繁殖核·信息交换',
};

/** 繁殖链阶段标签（CORE-R） */
export const REPRO_KIND_CN = {
  MEI: '半态排出准备',
  DCK: '半态驻留',
  PRQ: '许可请求',
  PGR: '许可授予',
  'FLD-CH': '半态场交换',
  'FLD-CH-IN': '场内半态交换',
  'FUS-IN': '体内合胞',
  EMB: '宫内通量',
  EXP: '外排子代',
  HRM: '多维门控',
  FUS: '双源汇合',
};

/** 语义分级（观察者层） */
export const TIER_CN = {
  1: '繁殖交流',
  2: '四域活动语境',
  3: '许可与场交换',
  0: '未归类载荷',
};

export function domainListCn(domains = []) {
  return domains.map((d) => DOMAIN_CN[d] ?? d).join('、');
}

export function reproKindsCn(kinds = []) {
  return kinds.map((k) => REPRO_KIND_CN[k] ?? k).join('、');
}

export function tierCn(tier) {
  return TIER_CN[tier] ?? '—';
}

/** 形态 A/B 观察者类比（机制层仍用 A/B；仅 UI） */
export const PAIR_MORPH_CN = {
  A: '雄',
  B: '雌',
};

/** 定向言语意图 */
export const SPEECH_INTENT_CN = {
  PRQ: '繁殖许可请求（排出方→接纳方）',
  PGR: '繁殖许可授予（接纳方→排出方）',
  'Q-YI': '衣域询问',
  'Q-SHI': '食域询问',
  'Q-ZHU': '住域询问',
  'Q-XING': '行域询问',
};

export const QUERY_MODE_CN = {
  REL: '关系式询问',
  INF: '信息收集式询问',
};

export function speechIntentCn(intent, queryMode = null) {
  const base = SPEECH_INTENT_CN[intent] ?? intent;
  if (queryMode && QUERY_MODE_CN[queryMode]) {
    return `${base}·${QUERY_MODE_CN[queryMode]}`;
  }
  return base;
}

export function pairMorphCn(morph) {
  return PAIR_MORPH_CN[morph] ?? morph ?? '—';
}

/** 共现对 → 观察者句式 */
export function pairConventionCn(rx, tx, count, domain = null) {
  const dom = domain ? `（${DOMAIN_CN[domain] ?? domain}）` : '';
  return `收 ${rx} 后倾向回应 ${tx}，已共现 ${count} 次${dom}`;
}
