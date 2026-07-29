/**
 * 田野 / 观察台环境配置 — Phase 34–36
 */

import { juvenileDrawMultiplier as nurtureJuvenileDraw } from './nurture.js';
import { STACK_FEEDBACK } from './profile-stack.js';
import { PERSONA_OBSERVE, PERSONA_FEEDBACK } from './persona-stack.js';

export const ENV_PROFILES = {
  baseline: {
    id: 'baseline',
    label: '基线（现行规则）',
  },
  high_shk: {
    id: 'high_shk',
    label: '高频剧变',
    pulseInterval: 50,
  },
  juvenile_fragile: {
    id: 'juvenile_fragile',
    label: '幼体脆弱窗',
    juvenileTicks: 80,
    juvenileDrawMult: 0.45,
    juvenileMinGen: 1,
  },
  sparse_substrate: {
    id: 'sparse_substrate',
    label: '基底耗竭',
    substrateDrainMult: 1.35,
  },
  harsh_combined: {
    id: 'harsh_combined',
    label: '组合高压',
    pulseInterval: 50,
    juvenileTicks: 80,
    juvenileDrawMult: 0.45,
    juvenileMinGen: 1,
    substrateDrainMult: 1.25,
  },
  /** Phase 36 — 富足基底 + 存活分裂门控 */
  fertile_field: {
    id: 'fertile_field',
    label: '富足分裂场',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
  },
  fertile_field_open: {
    id: 'fertile_field_open',
    label: '富足分裂场（无复制上限）',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: false,
  },
  fertile_field_strict: {
    id: 'fertile_field_strict',
    label: '富足场+复制耗尽终止',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: true,
    rplTickCapEnabled: true,
    rplTickCapBase: 220,
    rplTickCapSpread: 180,
  },
  fertile_inert: {
    id: 'fertile_inert',
    label: '富足无分裂门',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
  },
  fertile_multicell_rpl: {
    id: 'fertile_multicell_rpl',
    label: '富足多子域+复制配额',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    organismMode: 'multicell',
    rplScope: 'organism',
  },
  fertile_renew_plg: {
    id: 'fertile_renew_plg',
    label: '富足+RPL续行+双体汇合',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
  },
  fertile_multicell_renew_plg: {
    id: 'fertile_multicell_renew_plg',
    label: '富足多子域+子域RPL+续行汇合',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
  },
  fertile_renew_cost: {
    id: 'fertile_renew_cost',
    label: '富足+RPL续行（有代价）',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
    rplRenewCostEnabled: true,
    rplRenewStressBump: 3,
    rplRenewRegisterDrain: 0.05,
    rplRenewTickDebt: 28,
    rplRenewMaxCount: 14,
    rplRenewProbDecay: 0.035,
    rplRenewDebtLimit: 260,
    rplTickCapEnabled: true,
    rplTickCapBase: 300,
    rplTickCapSpread: 120,
    plgRenewCostMult: 1.2,
  },
  fertile_mei_fus: {
    id: 'fertile_mei_fus',
    label: '富足+减数缩减+双源汇合',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    meiEnabled: true,
    meiMinAge: 40,
    meiMaxStress: 0.26,
    meiMinIntegrity: 0.5,
    meiMinSubstrate: 0.44,
    meiCooldown: 72,
    meiBaseProb: 0.42,
    fusEnabled: true,
    fusPairCooldown: 90,
    fusPacketMaxAge: 56,
    fusionMutationRate: 0.015,
    fusionMaxPop: 36,
  },
  fertile_mei_fus_ren: {
    id: 'fertile_mei_fus_ren',
    label: '富足重组+续行+live-donor',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    meiEnabled: true,
    meiMinAge: 40,
    meiMaxStress: 0.26,
    meiMinIntegrity: 0.5,
    meiMinSubstrate: 0.44,
    meiCooldown: 72,
    meiBaseProb: 0.42,
    fusEnabled: true,
    fusPairCooldown: 90,
    fusPacketMaxAge: 120,
    fusionMutationRate: 0.015,
    fusionMaxPop: 36,
    fusLiveDonorEnabled: true,
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
  },
  fertile_mei_fus_fix: {
    id: 'fertile_mei_fus_fix',
    label: '富足重组+瓶颈修复',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    meiEnabled: true,
    meiMinAge: 40,
    meiMaxStress: 0.26,
    meiMinIntegrity: 0.5,
    meiMinSubstrate: 0.44,
    meiCooldown: 72,
    meiBaseProb: 0.42,
    fusEnabled: true,
    fusionMutationRate: 0.015,
    fusionMaxPop: 36,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusOrphanPoolMax: 12,
    fusSocialAffinity: true,
    fusAggressivePairing: true,
    fusPacketMaxAge: 200,
    fusPairCooldown: 24,
  },
  fertile_multicell_mei_fus_fix: {
    id: 'fertile_multicell_mei_fus_fix',
    label: '富足多子域重组+瓶颈修复',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    meiEnabled: true,
    meiMinAge: 40,
    meiMaxStress: 0.26,
    meiMinIntegrity: 0.5,
    meiMinSubstrate: 0.44,
    meiCooldown: 72,
    meiBaseProb: 0.42,
    fusEnabled: true,
    fusionMutationRate: 0.015,
    fusionMaxPop: 36,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusOrphanPoolMax: 12,
    fusSocialAffinity: true,
    fusAggressivePairing: true,
    fusPacketMaxAge: 200,
    fusPairCooldown: 24,
  },
  fertile_multicell_mei_fus_route: {
    id: 'fertile_multicell_mei_fus_route',
    label: '富足多子域重组+子域路由',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: false,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    meiEnabled: true,
    meiMinAge: 40,
    meiMaxStress: 0.26,
    meiMinIntegrity: 0.5,
    meiMinSubstrate: 0.44,
    meiCooldown: 72,
    meiBaseProb: 0.42,
    fusEnabled: true,
    fusionMutationRate: 0.015,
    fusionMaxPop: 36,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusOrphanPoolMax: 12,
    fusSocialAffinity: true,
    fusAggressivePairing: true,
    fusPacketMaxAge: 200,
    fusPairCooldown: 24,
    fusSubunitDonorMode: 'any',
    fusIntraSubPlgEnabled: true,
    fusSubunitRouteEnabled: true,
  },
  fertile_multicell_dual_path: {
    id: 'fertile_multicell_dual_path',
    label: '富足多子域双路径竞争',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    meiEnabled: true,
    meiMinAge: 40,
    meiMaxStress: 0.26,
    meiMinIntegrity: 0.5,
    meiMinSubstrate: 0.44,
    meiCooldown: 72,
    meiBaseProb: 0.42,
    fusEnabled: true,
    fusionMutationRate: 0.015,
    fusionMaxPop: 36,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusOrphanPoolMax: 12,
    fusSocialAffinity: true,
    fusAggressivePairing: true,
    fusPacketMaxAge: 200,
    fusPairCooldown: 24,
    fusSubunitDonorMode: 'any',
    fusIntraSubPlgEnabled: true,
    fusSubunitRouteEnabled: true,
  },
  fertile_exp_feedback: {
    id: 'fertile_exp_feedback',
    label: '富足场+阅历反馈',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
    experienceEnabled: true,
    experienceFeedback: true,
    expJuvenileTicks: 48,
  },
  fertile_reg_couple: {
    id: 'fertile_reg_couple',
    label: '富足场+寄存器耦合反馈',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
    registerProfileEnabled: true,
    registerFeedback: true,
    registerCouplingBase: 0.02,
  },
  fertile_mtb_feedback: {
    id: 'fertile_mtb_feedback',
    label: '富足场+代谢通道反馈',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
    metabolicProfileEnabled: true,
    metabolicFeedback: true,
  },
  fertile_coop_feedback: {
    id: 'fertile_coop_feedback',
    label: '富足场+社会合作反馈',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
    cooperationProfileEnabled: true,
    cooperationFeedback: true,
  },
  fertile_stack_full: {
    id: 'fertile_stack_full',
    label: '富足场+四层档案整合',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    fissionEnabled: true,
    fissionMinSubstrate: 0.44,
    fissionMaxStress: 0.28,
    fissionMinIntegrity: 0.48,
    fissionCooldown: 52,
    fissionMinAge: 36,
    fissionBaseProb: 0.46,
    fissionMutationRate: 0.012,
    fissionMaxPop: 36,
    rplEnabled: true,
    rplBaseMax: 2,
    rplMaxSpread: 1,
    rplSenescenceEnd: false,
    rplTickCapEnabled: false,
    experienceEnabled: true,
    experienceFeedback: true,
    expJuvenileTicks: 48,
    registerProfileEnabled: true,
    registerFeedback: true,
    registerCouplingBase: 0.02,
    metabolicProfileEnabled: true,
    metabolicFeedback: true,
    cooperationProfileEnabled: true,
    cooperationFeedback: true,
  },
  fertile_stack_rpr_tri: {
    id: 'fertile_stack_rpr_tri',
    label: '富足四层+繁殖路径+三路径',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    fissionEnabled: true,
    meiEnabled: true,
    fusEnabled: true,
    ...STACK_FEEDBACK,
    reproductionProfileEnabled: true,
    reproductionFeedback: true,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusSubunitRouteEnabled: true,
  },
  fertile_stack_ehu_tri: {
    id: 'fertile_stack_ehu_tri',
    label: '富足四层+繁殖路径+电子人',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    fissionEnabled: true,
    meiEnabled: true,
    fusEnabled: true,
    ...STACK_FEEDBACK,
    reproductionProfileEnabled: true,
    reproductionFeedback: true,
    electronicHumanEnabled: true,
    electronicHumanFeedback: true,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusSubunitRouteEnabled: true,
  },
  fertile_persona_full: {
    id: 'fertile_persona_full',
    label: '富足六层人格栈反馈',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    fissionEnabled: true,
    meiEnabled: true,
    fusEnabled: true,
    ...PERSONA_FEEDBACK,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusSubunitRouteEnabled: true,
  },
  fertile_ehu_deep: {
    id: 'fertile_ehu_deep',
    label: '富足六层+EHU深化',
    substrateDrainMult: 0.52,
    substrateBoost: 0.02,
    substrateFloor: 0.54,
    catastropheDisabled: true,
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    organismMode: 'multicell',
    rplScope: 'subunit',
    meiRplDeduct: 'active',
    fissionEnabled: true,
    meiEnabled: true,
    fusEnabled: true,
    ...PERSONA_FEEDBACK,
    ehuSocialDeepEnabled: true,
    ehuLineageEchoEnabled: true,
    fusLiveDonorEnabled: true,
    fusBeaconEnabled: true,
    fusOrphanPoolEnabled: true,
    fusSubunitRouteEnabled: true,
  },
};

const REN_BASE = {
  rplRenewEnabled: true,
  rplRenewGrant: 1,
  rplRenewCooldown: 64,
  rplRenewBaseProb: 0.5,
  rplRenewAtOrBelow: 0,
  rplRenewMaxStress: 0.24,
  rplRenewMinSubstrate: 0.46,
};

const PLG_BASE = {
  plgEnabled: true,
  plgRenewGrant: 1,
  plgPairCooldown: 100,
  plgExhaustedAt: 0,
};

/** Phase 41 — 续行代价 [RCO] */
const REN_COST = {
  rplRenewCostEnabled: true,
  rplRenewStressBump: 3,
  rplRenewRegisterDrain: 0.05,
  rplRenewTickDebt: 28,
  rplRenewMaxCount: 14,
  rplRenewProbDecay: 0.035,
  rplRenewDebtLimit: 260,
  rplTickCapEnabled: true,
  rplTickCapBase: 300,
  rplTickCapSpread: 120,
  plgRenewCostMult: 1.2,
};

const MEI_BASE = {
  meiEnabled: true,
  meiMinAge: 40,
  meiMaxStress: 0.26,
  meiMinIntegrity: 0.5,
  meiMinSubstrate: 0.44,
  meiCooldown: 72,
  meiBaseProb: 0.42,
};

const FUS_BASE = {
  fusEnabled: true,
  fusPairCooldown: 90,
  fusPacketMaxAge: 56,
  fusionMutationRate: 0.015,
  fusionMaxPop: 36,
};

const MEI_FUS_ONLY = {
  fissionEnabled: false,
  ...MEI_BASE,
  ...FUS_BASE,
};

const FUS_BOTTLENECK_FIX = {
  fusLiveDonorEnabled: true,
  fusBeaconEnabled: true,
  fusOrphanPoolEnabled: true,
  fusOrphanPoolMax: 12,
  fusSocialAffinity: true,
  fusAggressivePairing: true,
  fusMaxPairPasses: 3,
  fusMaxPairsPerTick: 8,
  fusPacketMaxAge: 200,
  fusPairCooldown: 24,
};

/** Phase 46 — 子域积压路由 [ISPL]/[XBCN] */
const FUS_SUBUNIT_ROUTE = {
  fusSubunitDonorMode: 'any',
  fusIntraSubPlgEnabled: true,
  fusSubunitRouteEnabled: true,
};

const MC_SUB_RPL = {
  organismMode: 'multicell',
  rplEnabled: true,
  rplBaseMax: 5,
  rplMaxSpread: 3,
  rplScope: 'subunit',
  meiRplDeduct: 'active',
};

const MC_RECOMB_ROUTE = {
  fissionEnabled: false,
  ...MEI_FUS_ONLY,
  ...FUS_BOTTLENECK_FIX,
  ...FUS_SUBUNIT_ROUTE,
};

const MC_DUAL_ROUTE = {
  ...MEI_FUS_ONLY,
  ...FUS_BOTTLENECK_FIX,
  ...FUS_SUBUNIT_ROUTE,
  fissionEnabled: true,
};

/** Phase 45 — 多细胞 × 重组 [MEI]/[FUS] */
export const PHASE45_TREATMENTS = {
  multicell_org_mei: {
    id: 'multicell_org_mei',
    label: '多细胞+共享RPL+重组',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
    fissionEnabled: false,
    meiRplDeduct: 'organism',
    ...MEI_FUS_ONLY,
  },
  multicell_sub_mei: {
    id: 'multicell_sub_mei',
    label: '多细胞+子域RPL+重组',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    fissionEnabled: false,
    meiRplDeduct: 'active',
    ...MEI_FUS_ONLY,
  },
  multicell_org_mei_fix: {
    id: 'multicell_org_mei_fix',
    label: '多细胞+共享RPL+重组+修复包',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
    fissionEnabled: false,
    meiRplDeduct: 'organism',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
  },
  multicell_sub_mei_fix: {
    id: 'multicell_sub_mei_fix',
    label: '多细胞+子域RPL+重组+修复包',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    fissionEnabled: false,
    meiRplDeduct: 'active',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
  },
  unicell_mei_fix: {
    id: 'unicell_mei_fix',
    label: '单细胞+重组+修复包（锚定）',
    envId: 'fertile_field',
    organismMode: 'unicell',
    fissionEnabled: false,
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
  },
};

/** Phase 46 — 子域积压路由 [ISPL]/[XBCN] */
export const PHASE46_TREATMENTS = {
  multicell_sub_fix: {
    id: 'multicell_sub_fix',
    label: '子域+修复包（基线）',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    fissionEnabled: false,
    meiRplDeduct: 'active',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
  },
  multicell_sub_route: {
    id: 'multicell_sub_route',
    label: '子域+修复包+路由',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    fissionEnabled: false,
    meiRplDeduct: 'active',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
    ...FUS_SUBUNIT_ROUTE,
  },
  multicell_sub_route_ren: {
    id: 'multicell_sub_route_ren',
    label: '子域+修复+路由+REN',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    fissionEnabled: false,
    meiRplDeduct: 'active',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
    ...FUS_SUBUNIT_ROUTE,
    ...REN_BASE,
  },
  unicell_mei_fix: {
    id: 'unicell_mei_fix',
    label: '单细胞+修复包（锚定）',
    envId: 'fertile_field',
    organismMode: 'unicell',
    fissionEnabled: false,
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
  },
};

/** Phase 47 — 多细胞双路径竞争 [FISS] vs [MEI]/[FUS] */
export const PHASE47_TREATMENTS = {
  multicell_fiss_only: {
    id: 'multicell_fiss_only',
    label: '多细胞+仅FISS',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    meiEnabled: false,
    fusEnabled: false,
  },
  multicell_recomb_only: {
    id: 'multicell_recomb_only',
    label: '多细胞+仅重组+路由',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_RECOMB_ROUTE,
  },
  multicell_dual_sub: {
    id: 'multicell_dual_sub',
    label: '多细胞+双路径(子域+路由)',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
  },
  multicell_dual_org: {
    id: 'multicell_dual_org',
    label: '多细胞+双路径(共享RPL)',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplEnabled: true,
    rplBaseMax: 5,
    rplMaxSpread: 3,
    rplScope: 'organism',
    meiRplDeduct: 'organism',
    ...MC_DUAL_ROUTE,
  },
};

const EXP_BASE = {
  experienceEnabled: true,
  experienceFeedback: true,
  expJuvenileTicks: 48,
};

/** Phase 48 — 阅历层 [EXP] 积累与行为反馈 */
export const PHASE48_TREATMENTS = {
  fertile_no_exp: {
    id: 'fertile_no_exp',
    label: '富足场（无阅历）',
    envId: 'fertile_field',
  },
  fertile_exp_record: {
    id: 'fertile_exp_record',
    label: '富足场+阅历积累',
    envId: 'fertile_field',
    experienceEnabled: true,
    experienceFeedback: false,
    expJuvenileTicks: 48,
  },
  fertile_exp_feedback: {
    id: 'fertile_exp_feedback',
    label: '富足场+阅历反馈',
    envId: 'fertile_field',
    ...EXP_BASE,
  },
  fertile_exp_dual: {
    id: 'fertile_exp_dual',
    label: '富足双路径+阅历反馈',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    ...EXP_BASE,
  },
};

const REG_BASE = {
  registerProfileEnabled: true,
  registerFeedback: true,
  registerCouplingBase: 0.02,
};

/** Phase 49 — 寄存器语义层 [REG] 模式与场耦合 */
export const PHASE49_TREATMENTS = {
  fertile_no_reg: {
    id: 'fertile_no_reg',
    label: '富足场（无寄存器层）',
    envId: 'fertile_field',
  },
  fertile_reg_observe: {
    id: 'fertile_reg_observe',
    label: '富足场+寄存器观测',
    envId: 'fertile_field',
    registerProfileEnabled: true,
    registerFeedback: false,
    registerCouplingBase: 0.02,
  },
  fertile_reg_couple: {
    id: 'fertile_reg_couple',
    label: '富足场+寄存器耦合反馈',
    envId: 'fertile_field',
    ...REG_BASE,
  },
  harsh_reg_couple: {
    id: 'harsh_reg_couple',
    label: '组合高压+寄存器耦合',
    envId: 'harsh_combined',
    ...REG_BASE,
  },
};

const MTB_BASE = {
  metabolicProfileEnabled: true,
  metabolicFeedback: true,
};

/** Phase 50 — 代谢通道层 [MTB] 摄取分布与反馈 */
export const PHASE50_TREATMENTS = {
  fertile_no_mtb: {
    id: 'fertile_no_mtb',
    label: '富足场（无代谢层）',
    envId: 'fertile_field',
  },
  fertile_mtb_observe: {
    id: 'fertile_mtb_observe',
    label: '富足场+代谢观测',
    envId: 'fertile_field',
    metabolicProfileEnabled: true,
    metabolicFeedback: false,
  },
  fertile_mtb_feedback: {
    id: 'fertile_mtb_feedback',
    label: '富足场+代谢反馈',
    envId: 'fertile_field',
    ...MTB_BASE,
  },
  harsh_mtb_feedback: {
    id: 'harsh_mtb_feedback',
    label: '组合高压+代谢反馈',
    envId: 'harsh_combined',
    ...MTB_BASE,
  },
};

const COOP_BASE = {
  cooperationProfileEnabled: true,
  cooperationFeedback: true,
};

/** Phase 51 — 社会合作层 [COOP] 社会迹聚合与反馈 */
export const PHASE51_TREATMENTS = {
  fertile_no_coop: {
    id: 'fertile_no_coop',
    label: '富足场（无合作层）',
    envId: 'fertile_field',
  },
  fertile_coop_observe: {
    id: 'fertile_coop_observe',
    label: '富足场+合作观测',
    envId: 'fertile_field',
    cooperationProfileEnabled: true,
    cooperationFeedback: false,
  },
  fertile_coop_feedback: {
    id: 'fertile_coop_feedback',
    label: '富足场+合作反馈',
    envId: 'fertile_field',
    ...COOP_BASE,
  },
  fertile_coop_dense: {
    id: 'fertile_coop_dense',
    label: '富足场+合作反馈(高密)',
    envId: 'fertile_field',
    fissionMaxPop: 48,
    ...COOP_BASE,
  },
};

/** Phase 52 — 四层档案整合 EXP+REG+MTB+COOP */
export const PHASE52_TREATMENTS = {
  fertile_no_stack: {
    id: 'fertile_no_stack',
    label: '富足场（无档案层）',
    envId: 'fertile_field',
  },
  fertile_stack_observe: {
    id: 'fertile_stack_observe',
    label: '富足场+四层观测',
    envId: 'fertile_field',
    experienceEnabled: true,
    experienceFeedback: false,
    expJuvenileTicks: 48,
    registerProfileEnabled: true,
    registerFeedback: false,
    registerCouplingBase: 0.02,
    metabolicProfileEnabled: true,
    metabolicFeedback: false,
    cooperationProfileEnabled: true,
    cooperationFeedback: false,
  },
  fertile_stack_feedback: {
    id: 'fertile_stack_feedback',
    label: '富足场+四层反馈',
    envId: 'fertile_field',
    experienceEnabled: true,
    experienceFeedback: true,
    expJuvenileTicks: 48,
    registerProfileEnabled: true,
    registerFeedback: true,
    registerCouplingBase: 0.02,
    metabolicProfileEnabled: true,
    metabolicFeedback: true,
    cooperationProfileEnabled: true,
    cooperationFeedback: true,
  },
  fertile_stack_dual: {
    id: 'fertile_stack_dual',
    label: '富足四层+双路径',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    experienceEnabled: true,
    experienceFeedback: true,
    expJuvenileTicks: 48,
    registerProfileEnabled: true,
    registerFeedback: true,
    registerCouplingBase: 0.02,
    metabolicProfileEnabled: true,
    metabolicFeedback: true,
    cooperationProfileEnabled: true,
    cooperationFeedback: true,
  },
};

/** Phase 53 — 繁殖路径层 [RPR] × 四层档案（GAP-14） */
export const PHASE53_TREATMENTS = {
  stack_no_rpr: {
    id: 'stack_no_rpr',
    label: '四层反馈（无RPR）',
    envId: 'fertile_field',
    ...STACK_FEEDBACK,
  },
  stack_rpr_observe: {
    id: 'stack_rpr_observe',
    label: '四层+RPR观测',
    envId: 'fertile_field',
    ...STACK_FEEDBACK,
    reproductionProfileEnabled: true,
    reproductionFeedback: false,
  },
  stack_rpr_fiss: {
    id: 'stack_rpr_fiss',
    label: '四层+RPR+仅FISS',
    envId: 'fertile_field',
    ...STACK_FEEDBACK,
    reproductionProfileEnabled: true,
    reproductionFeedback: true,
    fissionEnabled: true,
    meiEnabled: false,
    fusEnabled: false,
  },
  stack_rpr_tri: {
    id: 'stack_rpr_tri',
    label: '四层+RPR+三路径',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    ...STACK_FEEDBACK,
    reproductionProfileEnabled: true,
    reproductionFeedback: true,
  },
};

const STACK_RPR_TRI_BASE = {
  ...MC_SUB_RPL,
  ...MC_DUAL_ROUTE,
  ...STACK_FEEDBACK,
  reproductionProfileEnabled: true,
  reproductionFeedback: true,
};

/** Phase 55 — 电子人层 [EHU] × 四层栈 + RPR 三路径（OUTLINE Phase 4 kickoff） */
export const PHASE55_TREATMENTS = {
  stack_tri_no_ehu: {
    id: 'stack_tri_no_ehu',
    label: '四层+RPR三路径（无EHU）',
    envId: 'fertile_field',
    ...STACK_RPR_TRI_BASE,
  },
  stack_ehu_observe: {
    id: 'stack_ehu_observe',
    label: '四层+RPR+EHU观测',
    envId: 'fertile_field',
    ...STACK_RPR_TRI_BASE,
    electronicHumanEnabled: true,
    electronicHumanFeedback: false,
  },
  stack_ehu_feedback: {
    id: 'stack_ehu_feedback',
    label: '四层+RPR+EHU反馈',
    envId: 'fertile_field',
    ...STACK_RPR_TRI_BASE,
    electronicHumanEnabled: true,
    electronicHumanFeedback: true,
  },
  stack_ehu_narrative: {
    id: 'stack_ehu_narrative',
    label: '四层+RPR+EHU叙事',
    envId: 'fertile_field',
    ...STACK_RPR_TRI_BASE,
    electronicHumanEnabled: true,
    electronicHumanFeedback: true,
    ehuArcNarrative: 12,
  },
};

/** Phase 56 — 六层人格栈整合 EXP+REG+MTB+COOP+RPR+EHU */
export const PHASE56_TREATMENTS = {
  persona_tri_only: {
    id: 'persona_tri_only',
    label: '三路径（无档案层）',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
  },
  persona_observe: {
    id: 'persona_observe',
    label: '六层观测',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    ...PERSONA_OBSERVE,
  },
  persona_feedback: {
    id: 'persona_feedback',
    label: '六层反馈',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    ...PERSONA_FEEDBACK,
  },
  persona_coherence: {
    id: 'persona_coherence',
    label: '六层+连贯加速',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    ...PERSONA_FEEDBACK,
    ehuJuvenileTicks: 32,
  },
};

const PERSONA_TRI_FEEDBACK = {
  ...MC_SUB_RPL,
  ...MC_DUAL_ROUTE,
  ...PERSONA_FEEDBACK,
};

/** Phase 57 — 电子人深化 [EHU-LIN] 谱系回响 + 社会绑定 */
export const PHASE57_TREATMENTS = {
  ehu_persona_base: {
    id: 'ehu_persona_base',
    label: '六层反馈（EHU基线）',
    envId: 'fertile_field',
    ...PERSONA_TRI_FEEDBACK,
  },
  ehu_social_bind: {
    id: 'ehu_social_bind',
    label: '六层+社会绑定深化',
    envId: 'fertile_field',
    ...PERSONA_TRI_FEEDBACK,
    ehuSocialDeepEnabled: true,
  },
  ehu_lineage_echo: {
    id: 'ehu_lineage_echo',
    label: '六层+谱系回响',
    envId: 'fertile_field',
    ...PERSONA_TRI_FEEDBACK,
    ehuLineageEchoEnabled: true,
  },
  ehu_deep_full: {
    id: 'ehu_deep_full',
    label: '六层+绑定+回响',
    envId: 'fertile_field',
    ...PERSONA_TRI_FEEDBACK,
    ehuSocialDeepEnabled: true,
    ehuLineageEchoEnabled: true,
    ehuArcNarrative: 14,
  },
};

/** Phase 44 — 汇合瓶颈突破 [BCN] + 孤儿池 + 激进配对 */
export const PHASE44_TREATMENTS = {
  mei_strict: {
    id: 'mei_strict',
    label: '严格重组（无修复）',
    envId: 'fertile_field_strict',
    ...MEI_FUS_ONLY,
  },
  mei_strict_beacon: {
    id: 'mei_strict_beacon',
    label: '严格+信标+延长packet',
    envId: 'fertile_field_strict',
    ...MEI_FUS_ONLY,
    fusBeaconEnabled: true,
    fusPacketMaxAge: 160,
    fusPairCooldown: 48,
  },
  mei_strict_fix: {
    id: 'mei_strict_fix',
    label: '严格+瓶颈全套修复',
    envId: 'fertile_field_strict',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
  },
  mei_strict_fix_ren: {
    id: 'mei_strict_fix_ren',
    label: '严格+修复+续行',
    envId: 'fertile_field_strict',
    ...MEI_FUS_ONLY,
    ...FUS_BOTTLENECK_FIX,
    ...REN_BASE,
  },
};

/** Phase 43 — 重组 × 续行 + live-donor 配对 */
export const PHASE43_TREATMENTS = {
  mei_fus: {
    id: 'mei_fus',
    label: '重组基线',
    envId: 'fertile_field',
    ...MEI_FUS_ONLY,
  },
  mei_fus_ren: {
    id: 'mei_fus_ren',
    label: '重组+[REN]',
    envId: 'fertile_field',
    ...MEI_FUS_ONLY,
    ...REN_BASE,
  },
  mei_strict: {
    id: 'mei_strict',
    label: '重组+严格耗尽',
    envId: 'fertile_field_strict',
    ...MEI_FUS_ONLY,
  },
  mei_strict_ren_donor: {
    id: 'mei_strict_ren_donor',
    label: '严格+续行+live-donor',
    envId: 'fertile_field_strict',
    ...MEI_FUS_ONLY,
    ...REN_BASE,
    fusLiveDonorEnabled: true,
    fusPacketMaxAge: 120,
  },
};

/** Phase 42 — [MEI] 减数缩减 / [FUS] 双源汇合 */
export const PHASE42_TREATMENTS = {
  fertile_clonal: {
    id: 'fertile_clonal',
    label: '富足+克隆分裂（对照）',
    envId: 'fertile_field',
    meiEnabled: false,
    fusEnabled: false,
  },
  fertile_mei_fus: {
    id: 'fertile_mei_fus',
    label: '富足+减数+汇合（无克隆）',
    envId: 'fertile_field',
    fissionEnabled: false,
    ...MEI_BASE,
    ...FUS_BASE,
  },
  fertile_both: {
    id: 'fertile_both',
    label: '富足+克隆+重组并存',
    envId: 'fertile_field',
    ...MEI_BASE,
    ...FUS_BASE,
  },
  fertile_mei_fus_strict: {
    id: 'fertile_mei_fus_strict',
    label: '重组+复制耗尽终止',
    envId: 'fertile_field_strict',
    fissionEnabled: false,
    ...MEI_BASE,
    ...FUS_BASE,
  },
};

export const PHASE41_TREATMENTS = {
  fertile_rpl: {
    id: 'fertile_rpl',
    label: '富足+RPL（无续行）',
    envId: 'fertile_field',
  },
  fertile_ren_free: {
    id: 'fertile_ren_free',
    label: '富足+RPL+[REN]（无代价）',
    envId: 'fertile_field',
    ...REN_BASE,
  },
  fertile_ren_cost: {
    id: 'fertile_ren_cost',
    label: '富足+RPL+[REN]+[RCO]',
    envId: 'fertile_field',
    ...REN_BASE,
    ...REN_COST,
  },
  fertile_ren_plg_cost: {
    id: 'fertile_ren_plg_cost',
    label: '富足+RPL+[REN]+[PLG]+[RCO]',
    envId: 'fertile_field',
    ...REN_BASE,
    ...PLG_BASE,
    ...REN_COST,
  },
};

/** Phase 40 — 多细胞 × RPL 续行 */
export const PHASE40_TREATMENTS = {
  multicell_org_ren: {
    id: 'multicell_org_ren',
    label: '多细胞+共享RPL+[REN]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
    ...REN_BASE,
  },
  multicell_org_ren_plg: {
    id: 'multicell_org_ren_plg',
    label: '多细胞+共享RPL+[REN]+[PLG]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
    ...REN_BASE,
    ...PLG_BASE,
  },
  multicell_sub_ren: {
    id: 'multicell_sub_ren',
    label: '多细胞+子域RPL+[REN]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    ...REN_BASE,
  },
  multicell_sub_ren_plg: {
    id: 'multicell_sub_ren_plg',
    label: '多细胞+子域RPL+[REN]+[PLG]',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
    ...REN_BASE,
    ...PLG_BASE,
  },
};

/** Phase 39 — [REN] 环境重置 / [PLG] 双体通量汇合 */
export const PHASE39_TREATMENTS = {
  fertile_rpl: {
    id: 'fertile_rpl',
    label: '富足+RPL（无续行）',
    envId: 'fertile_field',
  },
  fertile_ren: {
    id: 'fertile_ren',
    label: '富足+RPL+[REN]',
    envId: 'fertile_field',
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    rplRenewAtOrBelow: 0,
    rplRenewMaxStress: 0.24,
    rplRenewMinSubstrate: 0.46,
  },
  fertile_ren_plg: {
    id: 'fertile_ren_plg',
    label: '富足+RPL+[REN]+[PLG]',
    envId: 'fertile_field',
    rplRenewEnabled: true,
    rplRenewGrant: 1,
    rplRenewCooldown: 64,
    rplRenewBaseProb: 0.5,
    rplRenewAtOrBelow: 0,
    rplRenewMaxStress: 0.24,
    rplRenewMinSubstrate: 0.46,
    plgEnabled: true,
    plgRenewGrant: 1,
    plgPairCooldown: 100,
    plgExhaustedAt: 0,
  },
};

/** Phase 38 — 多细胞 × RPL 共享 vs 子域分摊 */
export const PHASE38_TREATMENTS = {
  unicell_rpl: {
    id: 'unicell_rpl',
    label: '单域+复制配额',
    envId: 'fertile_field',
    organismMode: 'unicell',
    rplScope: 'organism',
  },
  multicell_rpl: {
    id: 'multicell_rpl',
    label: '多子域+有机体共享RPL',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'organism',
  },
  multicell_subrpl: {
    id: 'multicell_subrpl',
    label: '多子域+子域分摊RPL',
    envId: 'fertile_field',
    organismMode: 'multicell',
    rplScope: 'subunit',
    rplBaseMax: 5,
    rplMaxSpread: 3,
  },
};

/** Phase 35 田野处理组（固定 harsh_combined 基底） */
export const PHASE35_TREATMENTS = {
  unicell_instant: {
    id: 'unicell_instant',
    label: '单域即时独立',
    envId: 'harsh_combined',
    organismMode: 'unicell',
    reproMode: 'instant',
  },
  unicell_nursed: {
    id: 'unicell_nursed',
    label: '单域延迟独立+通量',
    envId: 'harsh_combined',
    organismMode: 'unicell',
    reproMode: 'nursed',
    nurtureTicks: 80,
    nurtureSeedFrac: 0.35,
    nurtureTickGrant: 0.012,
    dependentDrawMult: 0.55,
    independenceTicks: 80,
  },
  multicell_instant: {
    id: 'multicell_instant',
    label: '多子域即时独立',
    envId: 'harsh_combined',
    organismMode: 'multicell',
    reproMode: 'instant',
  },
  multicell_nursed: {
    id: 'multicell_nursed',
    label: '多子域延迟独立+通量',
    envId: 'harsh_combined',
    organismMode: 'multicell',
    reproMode: 'nursed',
    nurtureTicks: 80,
    nurtureSeedFrac: 0.35,
    nurtureTickGrant: 0.012,
    dependentDrawMult: 0.55,
    independenceTicks: 80,
  },
};

export function applyEnvProfile(world, profileId) {
  const profile = ENV_PROFILES[profileId] ?? ENV_PROFILES.baseline;
  world.envProfile = { ...profile };
  if (profile.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = profile.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, profile.pulseInterval);
  }
  return profile;
}

export function applyFieldTreatment(world, treatmentId) {
  const treatment = PHASE35_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知田野处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 35, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase38Treatment(world, treatmentId) {
  const treatment = PHASE38_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase38 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 38, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase47Treatment(world, treatmentId) {
  const treatment = PHASE47_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase47 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 47, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase48Treatment(world, treatmentId) {
  const treatment = PHASE48_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase48 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 48, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase49Treatment(world, treatmentId) {
  const treatment = PHASE49_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase49 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 49, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase50Treatment(world, treatmentId) {
  const treatment = PHASE50_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase50 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 50, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase51Treatment(world, treatmentId) {
  const treatment = PHASE51_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase51 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 51, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase52Treatment(world, treatmentId) {
  const treatment = PHASE52_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase52 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 52, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase57Treatment(world, treatmentId) {
  const treatment = PHASE57_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase57 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 57, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase56Treatment(world, treatmentId) {
  const treatment = PHASE56_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase56 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 56, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase55Treatment(world, treatmentId) {
  const treatment = PHASE55_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase55 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 55, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase53Treatment(world, treatmentId) {
  const treatment = PHASE53_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase53 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 53, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase46Treatment(world, treatmentId) {
  const treatment = PHASE46_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase46 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 46, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase45Treatment(world, treatmentId) {
  const treatment = PHASE45_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase45 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 45, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase44Treatment(world, treatmentId) {
  const treatment = PHASE44_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase44 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 44, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase43Treatment(world, treatmentId) {
  const treatment = PHASE43_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase43 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 43, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase42Treatment(world, treatmentId) {
  const treatment = PHASE42_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase42 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 42, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase41Treatment(world, treatmentId) {
  const treatment = PHASE41_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase41 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 41, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase40Treatment(world, treatmentId) {
  const treatment = PHASE40_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase40 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 40, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase39Treatment(world, treatmentId) {
  const treatment = PHASE39_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase39 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 39, treatmentId, ...treatment };
  return world.envProfile;
}

export function juvenileDrawMultiplier(being, profile) {
  return nurtureJuvenileDraw(being, profile);
}
