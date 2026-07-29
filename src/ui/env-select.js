/**
 * 观察台环境选择 — 复用 env-profile，默认 baseline
 */

import { ENV_PROFILES } from '../world/env-profile.js';
import { isAnalogyMode } from './analogy.js';

const LS_ENV = 'elecdog-env-profile';

/** 观察台可选环境（田野配置子集） */
export const OBSERVER_ENV_IDS = [
  'wisdom_evolution',
  'consciousness_full',
  'baseline',
  'fertile_field',
  'fertile_multicell_rpl',
  'fertile_multicell_renew_plg',
  'fertile_field_open',
  'fertile_field_strict',
  'fertile_renew_plg',
  'fertile_renew_cost',
  'fertile_mei_fus',
  'fertile_mei_fus_ren',
  'fertile_mei_fus_fix',
  'fertile_multicell_mei_fus_fix',
  'fertile_multicell_mei_fus_route',
  'fertile_multicell_dual_path',
  'fertile_exp_feedback',
  'fertile_reg_couple',
  'fertile_mtb_feedback',
  'fertile_coop_feedback',
  'fertile_stack_full',
  'fertile_stack_rpr_tri',
  'fertile_stack_ehu_tri',
  'fertile_persona_full',
  'fertile_ehu_deep',
  'fertile_inert',
  'harsh_combined',
];

const ANALOGY_LABELS = {
  wisdom_evolution: '智慧演化场（默认）',
  consciousness_full: '意识完整栈',
  baseline: '基线（现行）',
  fertile_field: '富足分裂场（有复制上限）',
  fertile_multicell_rpl: '富足多子域+复制配额（共享）',
  fertile_multicell_renew_plg: '富足多子域+子域配额+续行汇合',
  fertile_field_open: '富足分裂场（无复制上限）',
  fertile_field_strict: '富足场（复制耗尽即终止）',
  fertile_renew_plg: '富足场（配额续行+双体汇合）',
  fertile_renew_cost: '富足场（续行有代价）',
  fertile_mei_fus: '富足场（减数+双源汇合）',
  fertile_mei_fus_ren: '富足重组+续行+live-donor',
  fertile_mei_fus_fix: '富足重组+瓶颈修复全套',
  fertile_multicell_mei_fus_fix: '多子域重组+瓶颈修复全套',
  fertile_multicell_mei_fus_route: '多子域重组+子域路由全套',
  fertile_multicell_dual_path: '多子域双路径竞争（FISS+重组）',
  fertile_exp_feedback: '富足场（阅历积累+行为反馈）',
  fertile_reg_couple: '富足场（寄存器模式+场耦合反馈）',
  fertile_mtb_feedback: '富足场（代谢通道分布+摄取反馈）',
  fertile_coop_feedback: '富足场（社会合作模式+行为反馈）',
  fertile_stack_full: '富足场（四层档案整合反馈）',
  fertile_stack_rpr_tri: '富足四层+繁殖路径追踪+三路径',
  fertile_stack_ehu_tri: '富足四层+繁殖路径+电子人层',
  fertile_persona_full: '富足六层人格栈（全反馈）',
  fertile_ehu_deep: '富足六层+EHU谱系回响与社会绑定',
  fertile_inert: '富足场（无分裂门）',
  harsh_combined: '组合高压（死亡续行）',
};

export function isObserverEnvId(id) {
  return OBSERVER_ENV_IDS.includes(id);
}

export function getObserverEnvId() {
  try {
    const v = localStorage.getItem(LS_ENV);
    if (isObserverEnvId(v)) return v;
  } catch {
    /* ignore */
  }
  return 'wisdom_evolution';
}

export function setObserverEnvId(id) {
  if (!isObserverEnvId(id)) {
    throw new Error('无效观察台环境');
  }
  localStorage.setItem(LS_ENV, id);
}

export function observerEnvLabel(id) {
  const profile = ENV_PROFILES[id];
  if (!profile) return id;
  if (isAnalogyMode() && ANALOGY_LABELS[id]) return ANALOGY_LABELS[id];
  return profile.label;
}

export function observerEnvHint(id) {
  const hints = {
    wisdom_evolution: '意识完整栈 + W1 记忆→行为闭环；智慧演化默认',
    consciousness_full: '六层人格 + EHU 深化 + 谱系回响 + 社会绑定 + 续行汇合',
    baseline: '默认规则；剧变脉冲；无存活分裂',
    fertile_field: '富足场 + [FISS]；DNA [RPL] 复制次数上限',
    fertile_multicell_rpl: '多子域 organism + 共享 [RPL]；[INTRA] 分工',
    fertile_multicell_renew_plg: '多子域 subunit [RPL] + [REN] + [PLG] 汇合',
    fertile_field_open: '富足场 + [FISS]；无 [RPL] 上限（Phase 36 对照）',
    fertile_field_strict: '富足场 + [RPL] 耗尽或 tick 顶 → [END]',
    fertile_renew_plg: '富足场 + [RPL] + [REN] 环境重置 + [PLG] 双体通量汇合',
    fertile_renew_cost: '富足场 + [REN]/[PLG] + [RCO] 续行代价（tick 债务/胁迫）',
    fertile_mei_fus: '富足场 + [MEI] 减数缩减 + [FUS] 双源汇合（无克隆分裂）',
    fertile_mei_fus_ren: '重组 + [REN] 续行 + live-donor 配对（packet 积压修复）',
    fertile_mei_fus_fix: '重组 + [BCN] 信标 + 孤儿池 + 激进配对 + live-donor',
    fertile_multicell_mei_fus_fix: '多子域 + [MEI]/[FUS] + 子域 RPL 扣减 + Phase44 修复包',
    fertile_multicell_mei_fus_route: '多子域 + [ISPL] 胞内通量 + [XBCN] 跨子域信标 + donor any',
    fertile_multicell_dual_path: '多子域 + [FISS] 与 [MEI]/[FUS] 共享 RPL 竞争 + 路由包',
    fertile_exp_feedback: '富足场 + [EXP] 阅历阶段（E0–E3）调制 ACT 阈值',
    fertile_reg_couple: '富足场 + [REG] 模式（SYNC/LAG/SCATTER/LOCK）调制基底耦合',
    fertile_mtb_feedback: '富足场 + [MTB] 摄取档案（DOM/BAL/SCAR）调制 DRW 倍率',
    fertile_coop_feedback: '富足场 + [COOP] 社会迹模式（MESH/RIVAL 等）调制 ACT',
    fertile_stack_full: '富足场 + [EXP]+[REG]+[MTB]+[COOP] 四层档案同时反馈',
    fertile_stack_rpr_tri: '四层档案 + [RPR] 繁殖路径（LINEAGE/FISS/RCM）追踪',
    fertile_stack_ehu_tri: '四层档案 + [RPR] + [EHU] 自我连续阶段（H0–H3）',
    fertile_persona_full: '六层人格栈 [EXP]+[REG]+[MTB]+[COOP]+[RPR]+[EHU] 全反馈',
    fertile_ehu_deep: '六层 + [EHU-LIN] 谱系回响 + 社会绑定深化',
    fertile_inert: '同等富足基底，fissionEnabled 关闭（对照）',
    harsh_combined: '耗竭 + 脉冲 + 幼体脆弱；[END]→[LINEAGE] 高周转',
  };
  return hints[id] ?? '';
}
