/**
 * 田野 / 观察台环境配置 — Phase 34–36
 */

import { juvenileDrawMultiplier as nurtureJuvenileDraw } from './nurture.js';
import { initSubstrate } from './substrate.js';
import { initNodes } from './nodes.js';
import { initWorldPlace, applyTerrainSubstrateBias } from './place.js';
import { initDiurnalStats } from './diurnal.js';
import { initPcpState } from './pcp.js';
import { initSeasonalStats } from './seasonal.js';
import { initAirState } from './air.js';
import { initAdvState } from './adv.js';
import { initLunarStats } from './ltc.js';
import { initArtState } from './art.js';
import { initVentState } from './vent.js';
import { initMigState } from './mig.js';
import { initDissipationStats } from './dissip.js';
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

/** Phase 107+ 默认繁殖 — 环境门控有丝分裂（FISS），无续行（REN）/无减数（MEI）默认 */
const ECO_REPRO_BASE = {
  ecoFissEnabled: true,
  fissionEnabled: true,
  rplRenewEnabled: false,
  plgEnabled: false,
  meiEnabled: false,
  fusEnabled: false,
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

const EHU_DEEP_FULL = {
  ...PERSONA_TRI_FEEDBACK,
  ehuSocialDeepEnabled: true,
  ehuLineageEchoEnabled: true,
  ehuArcNarrative: 14,
};

/** Phase 61 — 意识完整栈（六层 + EHU 深化 + 续行汇合） */
const CONSCIOUSNESS_FIELD_BASE = {
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
  fusLiveDonorEnabled: true,
  fusBeaconEnabled: true,
  fusOrphanPoolEnabled: true,
  fusSubunitRouteEnabled: true,
};

ENV_PROFILES.consciousness_full = {
  id: 'consciousness_full',
  label: '意识完整栈',
  ...CONSCIOUSNESS_FIELD_BASE,
  ...EHU_DEEP_FULL,
  ...REN_BASE,
  ...PLG_BASE,
  ehuDistinctionErosionMult: 0.3,
  ehuBindNarrative: true,
};

/** Phase 70 — 智慧演化默认环境：生态有丝分裂，无续行 */
ENV_PROFILES.wisdom_evolution = {
  id: 'wisdom_evolution',
  label: '智慧演化场',
  ...CONSCIOUSNESS_FIELD_BASE,
  ...EHU_DEEP_FULL,
  ...ECO_REPRO_BASE,
  ehuDistinctionErosionMult: 0.3,
  ehuBindNarrative: true,
  memoryFeedbackEnabled: true,
};

/** Phase 58 — CODEX 归纳 + 长时田野（1920 tick） */
export const PHASE58_TREATMENTS = {
  long_deep_960: {
    id: 'long_deep_960',
    label: 'EHU深化×960tick',
    envId: 'fertile_field',
    ...EHU_DEEP_FULL,
    fieldLongStudy: true,
  },
  long_deep_1920: {
    id: 'long_deep_1920',
    label: 'EHU深化×1920tick',
    envId: 'fertile_field',
    ...EHU_DEEP_FULL,
    fieldLongStudy: true,
  },
  long_observe_1920: {
    id: 'long_observe_1920',
    label: '六层观测×1920tick',
    envId: 'fertile_field',
    ...MC_SUB_RPL,
    ...MC_DUAL_ROUTE,
    ...PERSONA_OBSERVE,
    fieldLongStudy: true,
  },
};

/** Phase 59 — 观察台 CODEX UI + EHU×谱系代次田野 */
export const PHASE59_TREATMENTS = {
  ehu_gen_base: {
    id: 'ehu_gen_base',
    label: '六层反馈（无回响）',
    envId: 'fertile_field',
    ...PERSONA_TRI_FEEDBACK,
  },
  ehu_gen_lin: {
    id: 'ehu_gen_lin',
    label: '六层+谱系回响',
    envId: 'fertile_field',
    ...PERSONA_TRI_FEEDBACK,
    ehuLineageEchoEnabled: true,
  },
  ehu_gen_full: {
    id: 'ehu_gen_full',
    label: '六层+绑定+回响',
    envId: 'fertile_field',
    ...EHU_DEEP_FULL,
  },
};

/** Phase 60 — 电子人续行 [EHU-REN] × REN/PLG */
export const PHASE60_TREATMENTS = {
  ehu_ren_off: {
    id: 'ehu_ren_off',
    label: 'EHU深化（无续行）',
    envId: 'fertile_field',
    ...EHU_DEEP_FULL,
    ehuRenewTraceEnabled: false,
  },
  ehu_ren_only: {
    id: 'ehu_ren_only',
    label: 'EHU深化+环境续行',
    envId: 'fertile_field',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
  },
  ehu_ren_plg: {
    id: 'ehu_ren_plg',
    label: 'EHU深化+续行+汇合',
    envId: 'fertile_field',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
  },
};

/** Phase 61 — 意识收敛长时田野 */
export const PHASE61_TREATMENTS = {
  cn_full_960: {
    id: 'cn_full_960',
    label: '意识完整栈×960',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
  },
  cn_full_1920: {
    id: 'cn_full_1920',
    label: '意识完整栈×1920',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    fieldLongStudy: true,
    ehuBindNarrative: true,
  },
  cn_deep_1920: {
    id: 'cn_deep_1920',
    label: 'EHU深化无续行×1920',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    rplRenewEnabled: false,
    plgEnabled: false,
    ehuRenewTraceEnabled: false,
    fieldLongStudy: true,
  },
};

/** Phase 62 — 内在流观察 + 超长时田野（3840 tick） */
export const PHASE62_TREATMENTS = {
  cn_full_1920: {
    id: 'cn_full_1920',
    label: '意识完整栈×1920',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    fieldLongStudy: true,
  },
  cn_full_3840: {
    id: 'cn_full_3840',
    label: '意识完整栈×3840',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    fieldLongStudy: true,
  },
};

/** Phase 63 — CODEX 意识立项验证（960 tick） */
export const PHASE63_TREATMENTS = {
  codex_stack_full: {
    id: 'codex_stack_full',
    label: '意识完整栈（CODEX验证）',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
  },
  codex_stack_ren_off: {
    id: 'codex_stack_ren_off',
    label: '完整栈无续行（对照）',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    rplRenewEnabled: false,
    plgEnabled: false,
    ehuRenewTraceEnabled: false,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
  },
};

/** Phase 65 — 意识交叉验证：EHU × 长时 × 多体信号链 */
export const PHASE65_TREATMENTS = {
  cn_xv_quad_3840: {
    id: 'cn_xv_quad_3840',
    label: '意识×四体×3840',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    fieldLongStudy: true,
    cohort: 'quad',
  },
  cn_xv_ehu_off_quad: {
    id: 'cn_xv_ehu_off_quad',
    label: '四体无EHU×3840（对照）',
    envId: 'consciousness_full',
    electronicHumanEnabled: false,
    ...REN_BASE,
    ...PLG_BASE,
    fieldLongStudy: true,
    cohort: 'quad',
  },
};

/** Phase 70 — W1 记忆→行为闭环（mem on/off 对照） */
export const PHASE70_TREATMENTS = {
  wisdom_mem_off: {
    id: 'wisdom_mem_off',
    label: '完整栈无记忆反馈×1920',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    memoryFeedbackEnabled: false,
    fieldLongStudy: true,
  },
  wisdom_mem_on: {
    id: 'wisdom_mem_on',
    label: '完整栈+记忆反馈×1920',
    envId: 'wisdom_evolution',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    memoryFeedbackEnabled: true,
    fieldLongStudy: true,
  },
};

const W2_WISDOM_BASE = {
  ...EHU_DEEP_FULL,
  ...REN_BASE,
  ...PLG_BASE,
  ehuDistinctionErosionMult: 0.3,
  ehuBindNarrative: true,
  memoryFeedbackEnabled: true,
  fieldLongStudy: true,
};

/** Phase 71 — W2 选择压可重复性度量（智慧演化场 × 剧变对照） */
export const PHASE71_TREATMENTS = {
  w2_evo_cat: {
    id: 'w2_evo_cat',
    label: '智慧演化+剧变选择压',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
  },
  w2_evo_ctrl: {
    id: 'w2_evo_ctrl',
    label: '智慧演化+无剧变对照',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    catastropheDisabled: true,
  },
};

const W2_REIN_COMMON = {
  ...W2_WISDOM_BASE,
  catastropheDisabled: false,
  substrateBoost: 0,
};

/** Phase 73 — W3 预测误差记录 [PRD]（智慧演化场 × on/off） */
export const PHASE73_TREATMENTS = {
  w3_prd_off: {
    id: 'w3_prd_off',
    label: '智慧演化无预测层',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    predictionEnabled: false,
  },
  w3_prd_on: {
    id: 'w3_prd_on',
    label: '智慧演化+预测误差记录',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    predictionEnabled: true,
    predictionAlpha: 0.35,
    predictionLogThreshold: 0.06,
    predictionHighThreshold: 0.12,
  },
};

const W3_PRD_BASE = {
  ...W2_WISDOM_BASE,
  predictionEnabled: true,
  predictionAlpha: 0.35,
  predictionLogThreshold: 0.06,
  predictionHighThreshold: 0.12,
  predictionLateStart: 960,
  predictionLateMid: 1440,
};

const W4_SOC_BASE = {
  ...W3_PRD_BASE,
  predictionFeedbackEnabled: true,
  socialKnowledgeEnabled: false,
};

const W4_MEM_BASE = {
  ...W4_SOC_BASE,
  socialKnowledgeEnabled: true,
  socialKnowledgeFeedbackEnabled: true,
  memLineageEchoEnabled: false,
};

const W5_WISDOM_FULL = {
  ...W4_MEM_BASE,
  socialKnowledgeEnabled: true,
  socialKnowledgeFeedbackEnabled: true,
  memLineageEchoEnabled: true,
  memLineageEchoBlend: 0.55,
  fieldLongStudy: true,
};

/** Phase 80 — GAP-10 选择压跨种子可重复性攻坚（3840 tick × 多节律剧变） */
export const PHASE80_TREATMENTS = {
  w2_gap10_ref3840: {
    id: 'w2_gap10_ref3840',
    label: '基线×3840tick',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
  },
  w2_gap10_shk3840: {
    id: 'w2_gap10_shk3840',
    label: '剧变×3840tick',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
  w2_gap10_mild80: {
    id: 'w2_gap10_mild80',
    label: '温和剧变×3840',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    pulseInterval: 80,
    substrateDrainMult: 0.62,
    substrateFloor: 0.48,
  },
  w2_gap10_rhythm60: {
    id: 'w2_gap10_rhythm60',
    label: '节律剧变×3840',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    pulseInterval: 60,
    substrateDrainMult: 0.72,
    substrateFloor: 0.45,
    substrateBoost: 0.02,
  },
};

/** W2 纯演化栈 — 无记忆反馈/EHU 深化（Phase 81） */
const W2_CORE_ONLY = {
  ...PERSONA_TRI_FEEDBACK,
  ...REN_BASE,
  ...PLG_BASE,
  memoryFeedbackEnabled: false,
  ehuSocialDeepEnabled: false,
  ehuLineageEchoEnabled: false,
  ehuBindNarrative: false,
  fieldLongStudy: true,
};

/** W2 代次深度调参 — 放宽 MEI 门槛（Phase 81） */
const W2_DEPTH_MEI = {
  meiMinAge: 28,
  meiCooldown: 48,
  meiBaseProb: 0.55,
  meiMaxStress: 0.32,
  meiMinSubstrate: 0.38,
};

const W2_SHK_PULSE = {
  pulseInterval: 50,
  substrateDrainMult: 0.88,
  substrateFloor: 0.4,
};

/** Phase 81 — GAP-10 W2-only 栈 + 代次深度攻坚（3000 tick） */
export const PHASE81_TREATMENTS = {
  w2_p81_replay_ref: {
    id: 'w2_p81_replay_ref',
    label: 'Phase72基线复现',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
  },
  w2_p81_replay_shk: {
    id: 'w2_p81_replay_shk',
    label: 'Phase72剧变复现',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    ...W2_SHK_PULSE,
  },
  w2_p81_core_shk: {
    id: 'w2_p81_core_shk',
    label: 'W2纯栈+剧变',
    envId: 'wisdom_evolution',
    ...W2_CORE_ONLY,
    catastropheDisabled: false,
    substrateBoost: 0,
    ...W2_SHK_PULSE,
  },
  w2_p81_depth_shk: {
    id: 'w2_p81_depth_shk',
    label: '深度MEI+剧变',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    ...W2_DEPTH_MEI,
    ...W2_SHK_PULSE,
  },
};

/** Phase 82 — 智慧物种田野验收（完整栈 × 标准/审计情境） */
export const PHASE82_TREATMENTS = {
  w82_accept_std: {
    id: 'w82_accept_std',
    label: '验收标准情境',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    wisdomAcceptance: true,
    wisdomContextId: 'accept_std',
  },
  w82_accept_audit: {
    id: 'w82_accept_audit',
    label: '验收审计情境（剧变）',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    wisdomAcceptance: true,
    wisdomContextId: 'accept_audit',
    catastropheDisabled: false,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
};

const RSV_SHK_PULSE = {
  pulseInterval: 50,
  substrateDrainMult: 0.92,
  substrateFloor: 0.38,
  juvenileTicks: 64,
  juvenileDrawMult: 0.52,
  juvenileMinGen: 1,
};

/** Phase 84 — GAP-ORG 储备池 [RSV] on/off 田野（剧变情境 END 率对照） */
export const PHASE84_TREATMENTS = {
  rsv_off_ref: {
    id: 'rsv_off_ref',
    label: '无储备·基线',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    reservoirEnabled: false,
  },
  rsv_off_shk: {
    id: 'rsv_off_shk',
    label: '无储备·剧变',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    reservoirEnabled: false,
    ...RSV_SHK_PULSE,
  },
  rsv_on_ref: {
    id: 'rsv_on_ref',
    label: '储备·基线',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    reservoirEnabled: true,
  },
  rsv_on_shk: {
    id: 'rsv_on_shk',
    label: '储备·剧变',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    reservoirEnabled: true,
    ...RSV_SHK_PULSE,
  },
};

const DLC_BASE = {
  diurnalEnabled: true,
  diurnalPeriod: 240,
  placeEnabled: true,
};

/** Phase 85 — GAP-ENV band E/M/P + [DLC] 日相田野 */
export const PHASE85_TREATMENTS = {
  dlc_off_M: {
    id: 'dlc_off_M',
    label: '无日相·中带',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    placeBand: 'M',
    placeEnabled: true,
    diurnalEnabled: false,
  },
  dlc_on_M: {
    id: 'dlc_on_M',
    label: '日相·中带',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    placeBand: 'M',
    ...DLC_BASE,
  },
  dlc_on_E: {
    id: 'dlc_on_E',
    label: '日相·赤道带',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    placeBand: 'E',
    ...DLC_BASE,
  },
  dlc_on_P: {
    id: 'dlc_on_P',
    label: '日相·极带',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
    placeBand: 'P',
    ...DLC_BASE,
  },
};

const PCP_ENV_BASE = {
  ...W2_WISDOM_BASE,
  placeBand: 'M',
  placePatch: '00',
  placeEnabled: true,
  ...DLC_BASE,
};

/** Phase 86 — GAP-ENV terrain L/O + [PCP] 简化水循环田野 */
export const PHASE86_TREATMENTS = {
  pcp_off_L: {
    id: 'pcp_off_L',
    label: '无PCP·陆格',
    envId: 'wisdom_evolution',
    ...PCP_ENV_BASE,
    placeTerrain: 'L',
    pcpEnabled: false,
  },
  pcp_off_O: {
    id: 'pcp_off_O',
    label: '无PCP·海格',
    envId: 'wisdom_evolution',
    ...PCP_ENV_BASE,
    placeTerrain: 'O',
    pcpEnabled: false,
  },
  pcp_on_L: {
    id: 'pcp_on_L',
    label: 'PCP·陆格',
    envId: 'wisdom_evolution',
    ...PCP_ENV_BASE,
    placeTerrain: 'L',
    pcpEnabled: true,
  },
  pcp_on_O: {
    id: 'pcp_on_O',
    label: 'PCP·海格',
    envId: 'wisdom_evolution',
    ...PCP_ENV_BASE,
    placeTerrain: 'O',
    pcpEnabled: true,
  },
};

const SCL_ENV_BASE = {
  ...PCP_ENV_BASE,
  placeTerrain: 'L',
  pcpEnabled: true,
};

/** Phase 87 — GAP-ENV [SCL] 季相四相田野 */
export const PHASE87_TREATMENTS = {
  scl_off_ref: {
    id: 'scl_off_ref',
    label: '无季相·基线',
    envId: 'wisdom_evolution',
    ...SCL_ENV_BASE,
    seasonalEnabled: false,
  },
  scl_on_ref: {
    id: 'scl_on_ref',
    label: '季相·标准年',
    envId: 'wisdom_evolution',
    ...SCL_ENV_BASE,
    seasonalEnabled: true,
    seasonalPeriod: 960,
  },
  scl_on_fast: {
    id: 'scl_on_fast',
    label: '季相·快周期',
    envId: 'wisdom_evolution',
    ...SCL_ENV_BASE,
    seasonalEnabled: true,
    seasonalPeriod: 480,
  },
  scl_on_cold: {
    id: 'scl_on_cold',
    label: '季相·冷相偏重',
    envId: 'wisdom_evolution',
    ...SCL_ENV_BASE,
    seasonalEnabled: true,
    seasonalPeriod: 960,
    substrateDrainMult: 1.05,
  },
};

const SYNTH_ENV_BASE = {
  ...SCL_ENV_BASE,
  reservoirEnabled: true,
  seasonalEnabled: true,
  seasonalPeriod: 960,
};

const SYNTH_SHK = {
  catastropheDisabled: false,
  pulseInterval: 55,
  substrateDrainMult: 0.94,
  substrateFloor: 0.36,
};

/** Phase 88 — GAP-ORG Synth-A/B + reservoir 田野 */
export const PHASE88_TREATMENTS = {
  synth_off_rsv: {
    id: 'synth_off_rsv',
    label: '储备无Synth',
    envId: 'wisdom_evolution',
    ...SYNTH_ENV_BASE,
    synthEnabled: false,
  },
  synth_on_ref: {
    id: 'synth_on_ref',
    label: 'Synth全开',
    envId: 'wisdom_evolution',
    ...SYNTH_ENV_BASE,
    synthEnabled: true,
  },
  synth_on_drain: {
    id: 'synth_on_drain',
    label: 'Synth+耗竭',
    envId: 'wisdom_evolution',
    ...SYNTH_ENV_BASE,
    synthEnabled: true,
    substrateDrainMult: 1.08,
    juvenileDrawMult: 0.5,
  },
  synth_on_shk: {
    id: 'synth_on_shk',
    label: 'Synth+剧变',
    envId: 'wisdom_evolution',
    ...SYNTH_ENV_BASE,
    synthEnabled: true,
    ...SYNTH_SHK,
  },
};

const SYM_FUS_BASE = {
  ...SYNTH_ENV_BASE,
  synthEnabled: true,
  meiMinAge: 28,
  meiCooldown: 44,
  meiBaseProb: 0.5,
  fusPairCooldown: 36,
  fusPacketMaxAge: 160,
};

/** Phase 89 — GAP-ORG FUS 捕获 [SYM] module 田野 */
export const PHASE89_TREATMENTS = {
  sym_off_fus: {
    id: 'sym_off_fus',
    label: 'FUS无捕获',
    envId: 'wisdom_evolution',
    ...SYM_FUS_BASE,
    symCaptureEnabled: false,
  },
  sym_on_fus: {
    id: 'sym_on_fus',
    label: 'FUS+SYM捕获',
    envId: 'wisdom_evolution',
    ...SYM_FUS_BASE,
    symCaptureEnabled: true,
  },
  sym_on_boost: {
    id: 'sym_on_boost',
    label: 'FUS+SYM+激进配对',
    envId: 'wisdom_evolution',
    ...SYM_FUS_BASE,
    symCaptureEnabled: true,
    meiBaseProb: 0.62,
    fusAggressivePairing: true,
    fusMaxPairPasses: 3,
  },
  sym_on_nosynth: {
    id: 'sym_on_nosynth',
    label: 'SYM捕获无Synth',
    envId: 'wisdom_evolution',
    ...SYM_FUS_BASE,
    symCaptureEnabled: true,
    synthEnabled: false,
  },
};

const AIR_ENV_BASE = {
  ...SYNTH_ENV_BASE,
  synthEnabled: true,
  symCaptureEnabled: false,
  airEnabled: true,
  airInit: 0.5,
};

/** Phase 90 — GAP-ENV air 标量 + 日相耦合 */
export const PHASE90_TREATMENTS = {
  air_off_ref: {
    id: 'air_off_ref',
    label: '无air参考',
    envId: 'wisdom_evolution',
    ...AIR_ENV_BASE,
    airEnabled: false,
  },
  air_on_ref: {
    id: 'air_on_ref',
    label: 'air参考',
    envId: 'wisdom_evolution',
    ...AIR_ENV_BASE,
    airInit: 0.5,
  },
  air_on_thick: {
    id: 'air_on_thick',
    label: '厚大气',
    envId: 'wisdom_evolution',
    ...AIR_ENV_BASE,
    airInit: 0.85,
    airSolarFloor: 0.35,
  },
  air_on_thin: {
    id: 'air_on_thin',
    label: '稀薄大气',
    envId: 'wisdom_evolution',
    ...AIR_ENV_BASE,
    airInit: 0.15,
    airDrainBoost: 1.15,
  },
};

const ADV_LTC_BASE = {
  ...AIR_ENV_BASE,
  airEnabled: true,
  airInit: 0.5,
  synthEnabled: false,
  symCaptureEnabled: false,
};

/** Phase 91 — GAP-ENV [ADV] 邻格平流 + [LTC] 月相 */
export const PHASE91_TREATMENTS = {
  adv_ltc_off: {
    id: 'adv_ltc_off',
    label: '无ADV/LTC',
    envId: 'wisdom_evolution',
    ...ADV_LTC_BASE,
    advEnabled: false,
    ltcEnabled: false,
  },
  adv_ltc_on: {
    id: 'adv_ltc_on',
    label: 'ADV+LTC全开',
    envId: 'wisdom_evolution',
    ...ADV_LTC_BASE,
    advEnabled: true,
    ltcEnabled: true,
  },
  adv_on_only: {
    id: 'adv_on_only',
    label: '仅ADV',
    envId: 'wisdom_evolution',
    ...ADV_LTC_BASE,
    advEnabled: true,
    ltcEnabled: false,
  },
  ltc_on_only: {
    id: 'ltc_on_only',
    label: '仅LTC',
    envId: 'wisdom_evolution',
    ...ADV_LTC_BASE,
    advEnabled: false,
    ltcEnabled: true,
  },
};

const ART_ENV_BASE = {
  ...ADV_LTC_BASE,
  advEnabled: true,
  ltcEnabled: true,
  artEnabled: true,
};

/** Phase 92 — GAP-ART 持久 [ART] 场态 + 效率田野 */
export const PHASE92_TREATMENTS = {
  art_off_ref: {
    id: 'art_off_ref',
    label: '无ART参考',
    envId: 'wisdom_evolution',
    ...ART_ENV_BASE,
    artEnabled: false,
  },
  art_on_ref: {
    id: 'art_on_ref',
    label: 'ART参考',
    envId: 'wisdom_evolution',
    ...ART_ENV_BASE,
    artEnabled: true,
  },
  art_on_boost: {
    id: 'art_on_boost',
    label: 'ART强化沉积',
    envId: 'wisdom_evolution',
    ...ART_ENV_BASE,
    artEnabled: true,
    artDepositEvery: 8,
    artDrwBonus: 0.075,
  },
  art_on_sparse: {
    id: 'art_on_sparse',
    label: 'ART稀疏沉积',
    envId: 'wisdom_evolution',
    ...ART_ENV_BASE,
    artEnabled: true,
    artMinActs: 14,
    artDepositEvery: 18,
  },
};

const VENT_ENV_BASE = {
  ...ADV_LTC_BASE,
  artEnabled: false,
  advEnabled: true,
  ltcEnabled: true,
  airEnabled: true,
  airInit: 0.5,
  placeBand: 'P',
  placePatch: '11',
  placeTerrain: 'L',
  ventPatch: '11',
  synthEnabled: false,
};

/** Phase 93 — GAP-ENV 地热 vent + 极带生存缝 */
export const PHASE93_TREATMENTS = {
  vent_off_ref: {
    id: 'vent_off_ref',
    label: '极带无vent',
    envId: 'wisdom_evolution',
    ...VENT_ENV_BASE,
    ventEnabled: false,
  },
  vent_on_ref: {
    id: 'vent_on_ref',
    label: '极带vent',
    envId: 'wisdom_evolution',
    ...VENT_ENV_BASE,
    ventEnabled: true,
  },
  vent_on_mismatch: {
    id: 'vent_on_mismatch',
    label: 'vent错位',
    envId: 'wisdom_evolution',
    ...VENT_ENV_BASE,
    ventEnabled: true,
    ventPatch: '00',
    placePatch: '11',
  },
  vent_on_boost: {
    id: 'vent_on_boost',
    label: 'vent强化',
    envId: 'wisdom_evolution',
    ...VENT_ENV_BASE,
    ventEnabled: true,
    ventInjectAmp: 0.032,
    ventBoostMult: 1.14,
  },
};

const MIG_ENV_BASE = {
  ...VENT_ENV_BASE,
  placeBand: 'M',
  placePatch: '00',
  placeTerrain: 'L',
  ventEnabled: false,
  migEnabled: true,
  migTargetPatch: '11',
  migStressMin: 0.14,
  migInterval: 48,
};

/** Phase 94 — GAP-ENV patch 迁徙 + alt 税 */
export const PHASE94_TREATMENTS = {
  mig_off_ref: {
    id: 'mig_off_ref',
    label: '无迁徙',
    envId: 'wisdom_evolution',
    ...MIG_ENV_BASE,
    migEnabled: false,
  },
  mig_on_ref: {
    id: 'mig_on_ref',
    label: 'patch迁徙',
    envId: 'wisdom_evolution',
    ...MIG_ENV_BASE,
    migEnabled: true,
  },
  mig_on_block: {
    id: 'mig_on_block',
    label: '迁徙高压阻断',
    envId: 'wisdom_evolution',
    ...MIG_ENV_BASE,
    migEnabled: true,
    migStressMin: 0.95,
  },
  mig_on_fast: {
    id: 'mig_on_fast',
    label: '迁徙加速',
    envId: 'wisdom_evolution',
    ...MIG_ENV_BASE,
    migEnabled: true,
    migInterval: 32,
    migStressMin: 0.1,
  },
};

const DSP_ENV_BASE = {
  ...MIG_ENV_BASE,
  migEnabled: false,
  ventEnabled: false,
  artEnabled: false,
  advEnabled: false,
  ltcEnabled: false,
  placePatch: '11',
  dissipationEnabled: true,
  dspYieldFrac: 0.3,
};

const W6_TOOL_ORG_STACK = {
  reservoirEnabled: true,
  synthEnabled: true,
  symCaptureEnabled: true,
  meiMinAge: 28,
  meiCooldown: 44,
  meiBaseProb: 0.5,
  fusPairCooldown: 36,
  fusPacketMaxAge: 160,
};

const W6_ENV_STACK = {
  placeEnabled: true,
  placeBand: 'M',
  placePatch: '00',
  placeTerrain: 'L',
  diurnalEnabled: true,
  diurnalPeriod: 240,
  pcpEnabled: true,
  seasonalEnabled: true,
  seasonalPeriod: 960,
  airEnabled: true,
  airInit: 0.5,
  advEnabled: true,
  ltcEnabled: true,
  artEnabled: true,
  ventEnabled: true,
  ventPatch: '11',
  migEnabled: true,
  migTargetPatch: '11',
  migStressMin: 0.14,
  migInterval: 48,
  dissipationEnabled: true,
  dspYieldFrac: 0.3,
};

const W6_STACK_OFF = {
  reservoirEnabled: false,
  synthEnabled: false,
  symCaptureEnabled: false,
  placeEnabled: false,
  diurnalEnabled: false,
  pcpEnabled: false,
  seasonalEnabled: false,
  airEnabled: false,
  advEnabled: false,
  ltcEnabled: false,
  artEnabled: false,
  ventEnabled: false,
  migEnabled: false,
  dissipationEnabled: false,
};

/** Phase 96 — W6 全栈耦合验收（W5 基线 vs 84–95 统一栈） */
export const PHASE96_TREATMENTS = {
  w6_stack_off: {
    id: 'w6_stack_off',
    label: 'W5智慧栈（无84+机制）',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    organismMode: 'multicell',
    w6StackEnabled: false,
    ...W6_STACK_OFF,
  },
  w6_stack_on: {
    id: 'w6_stack_on',
    label: 'W6统一全栈',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    organismMode: 'multicell',
    w6StackEnabled: true,
    ...W6_TOOL_ORG_STACK,
    ...W6_ENV_STACK,
  },
};

/** Phase 100 — GAP-W06 [SEM] 信号载荷共现记录层 */
export const PHASE100_TREATMENTS = {
  sem_off_ref: {
    id: 'sem_off_ref',
    label: 'W5智慧栈无SEM',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    semEnabled: false,
  },
  sem_on_ref: {
    id: 'sem_on_ref',
    label: 'W5智慧栈+SEM记录',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    semEnabled: true,
    semWindow: 1,
    semMinCount: 1,
    semFeedbackEnabled: false,
  },
  sem_on_dense: {
    id: 'sem_on_dense',
    label: 'SEM+宽窗口富信号场',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    semEnabled: true,
    semWindow: 2,
    semMinCount: 2,
    semFeedbackEnabled: false,
    substrateBoost: 0.03,
  },
  sem_on_sk: {
    id: 'sem_on_sk',
    label: 'SEM+剧变脉冲',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    semEnabled: true,
    semWindow: 1,
    semMinCount: 1,
    semFeedbackEnabled: false,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
};

const SEM_RECORD_BASE = {
  ...W5_WISDOM_FULL,
  semEnabled: true,
  semWindow: 1,
  semMinCount: 8,
  semFeedbackEnabled: false,
};

/** Phase 101 — WL1 [SEM] 反馈偏置层 */
export const PHASE101_TREATMENTS = {
  sem_record: {
    id: 'sem_record',
    label: 'SEM记录无反馈',
    envId: 'wisdom_evolution',
    ...SEM_RECORD_BASE,
  },
  sem_feedback: {
    id: 'sem_feedback',
    label: 'SEM记录+反馈偏置',
    envId: 'wisdom_evolution',
    ...SEM_RECORD_BASE,
    semFeedbackEnabled: true,
    semFeedbackStrength: 0.05,
    semFeedbackMinPairs: 2,
    semFeedbackSaturation: 32,
  },
  sem_fb_dense: {
    id: 'sem_fb_dense',
    label: 'SEM反馈+宽窗口',
    envId: 'wisdom_evolution',
    ...SEM_RECORD_BASE,
    semWindow: 2,
    semFeedbackEnabled: true,
    semFeedbackStrength: 0.06,
    semFeedbackMinPairs: 2,
    semFeedbackSaturation: 24,
    substrateBoost: 0.02,
  },
  sem_fb_sk: {
    id: 'sem_fb_sk',
    label: 'SEM反馈+剧变',
    envId: 'wisdom_evolution',
    ...SEM_RECORD_BASE,
    semFeedbackEnabled: true,
    semFeedbackStrength: 0.05,
    semFeedbackMinPairs: 2,
    semFeedbackSaturation: 32,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
};

const SEM_FB_BASE = {
  ...SEM_RECORD_BASE,
  semFeedbackEnabled: true,
  semFeedbackStrength: 0.05,
  semFeedbackMinPairs: 2,
  semFeedbackSaturation: 32,
};

/** Phase 102 — WL2 [SEM-LIN] 谱系约定持久 */
export const PHASE102_TREATMENTS = {
  sem_lin_off: {
    id: 'sem_lin_off',
    label: 'SEM反馈无谱系持久',
    envId: 'wisdom_evolution',
    ...SEM_FB_BASE,
    semLineageEnabled: false,
  },
  sem_lin_on: {
    id: 'sem_lin_on',
    label: 'SEM反馈+谱系持久',
    envId: 'wisdom_evolution',
    ...SEM_FB_BASE,
    semLineageEnabled: true,
    semLineageBlend: 0.55,
    semTraceTopN: 4,
    semTraceMinCount: 2,
  },
  sem_lin_dense: {
    id: 'sem_lin_dense',
    label: '谱系持久+宽窗口',
    envId: 'wisdom_evolution',
    ...SEM_FB_BASE,
    semWindow: 2,
    semLineageEnabled: true,
    semLineageBlend: 0.6,
    semTraceTopN: 6,
    semTraceMinCount: 3,
    substrateBoost: 0.02,
  },
  sem_lin_sk: {
    id: 'sem_lin_sk',
    label: '谱系持久+剧变',
    envId: 'wisdom_evolution',
    ...SEM_FB_BASE,
    semLineageEnabled: true,
    semLineageBlend: 0.55,
    semTraceTopN: 4,
    semTraceMinCount: 2,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
};

const WL3_SEM_STACK = {
  semEnabled: true,
  semWindow: 1,
  semMinCount: 8,
  semFeedbackEnabled: true,
  semFeedbackStrength: 0.05,
  semFeedbackMinPairs: 2,
  semFeedbackSaturation: 32,
  semLineageEnabled: true,
  semLineageBlend: 0.55,
  semTraceTopN: 4,
  semTraceMinCount: 2,
};

const WL3_SOC_STACK = {
  socialKnowledgeEnabled: true,
  socialKnowledgeFeedbackEnabled: true,
};

const WL3_FACTORIAL_BASE = {
  ...W5_WISDOM_FULL,
  semEnabled: false,
  semFeedbackEnabled: false,
  semLineageEnabled: false,
  socialKnowledgeEnabled: false,
  socialKnowledgeFeedbackEnabled: false,
};

/** Phase 103 — WL3 SEM × 社会知识正交对照（640 tick） */
export const PHASE103_TREATMENTS = {
  w3_off_off: {
    id: 'w3_off_off',
    label: '无SEM无SOC',
    envId: 'wisdom_evolution',
    ...WL3_FACTORIAL_BASE,
  },
  w3_off_on: {
    id: 'w3_off_on',
    label: '无SEM有SOC',
    envId: 'wisdom_evolution',
    ...WL3_FACTORIAL_BASE,
    ...WL3_SOC_STACK,
  },
  w3_on_off: {
    id: 'w3_on_off',
    label: '有SEM无SOC',
    envId: 'wisdom_evolution',
    ...WL3_FACTORIAL_BASE,
    ...WL3_SEM_STACK,
  },
  w3_on_on: {
    id: 'w3_on_on',
    label: 'SEM+SOC双开',
    envId: 'wisdom_evolution',
    ...WL3_FACTORIAL_BASE,
    ...WL3_SEM_STACK,
    ...WL3_SOC_STACK,
  },
};

/** Phase 106 — GAP-EVO-CARRY 进化留置 + 生态分裂（非续行） */
const EVO_CARRY_REPRO_BASE = {
  ...W5_WISDOM_FULL,
  ...CONSCIOUSNESS_FIELD_BASE,
  ...ECO_REPRO_BASE,
  semEnabled: true,
  semLineageEnabled: true,
  semFeedbackEnabled: false,
  carryMaxPerSeed: 2,
  carryNaiveCount: 10,
  sculptTicks: 640,
  sculptEnvId: 'harsh_combined',
};

export const PHASE106_TREATMENTS = {
  ev106_naive_only: {
    id: 'ev106_naive_only',
    label: '全0代对照',
    envId: 'wisdom_evolution',
    ...EVO_CARRY_REPRO_BASE,
    carryMode: 'none',
  },
  ev106_mixed_eco: {
    id: 'ev106_mixed_eco',
    label: '0代+留置·生态分裂',
    envId: 'wisdom_evolution',
    ...EVO_CARRY_REPRO_BASE,
    carryMode: 'mixed_eco',
  },
};

/** Phase 108 — 多环境留置链 + SEM 载荷迹跨环境孵化 */
const EVO_CHAIN_BASE = {
  ...EVO_CARRY_REPRO_BASE,
  semEnabled: false,
  semLineageEnabled: false,
  semFeedbackEnabled: false,
  carryMode: 'chain',
  carryIncubateTicks: 384,
  carryIncubateEnvId: 'wisdom_evolution',
};

export const PHASE108_TREATMENTS = {
  ev108_chain_off: {
    id: 'ev108_chain_off',
    label: '塑形→混合（无SEM）',
    envId: 'wisdom_evolution',
    ...EVO_CHAIN_BASE,
    carryIncubateSem: false,
    mixedSemEnabled: false,
  },
  ev108_chain_sem: {
    id: 'ev108_chain_sem',
    label: '塑形→SEM孵化→混合',
    envId: 'wisdom_evolution',
    ...EVO_CHAIN_BASE,
    carryIncubateSem: true,
    mixedSemEnabled: true,
    ...WL3_SEM_STACK,
  },
};

/** Phase 109 — 三环境留置链：harsh 塑形 → SEM 孵化 → 第三环境混合 */
export const PHASE109_TREATMENTS = {
  ev109_triple_ctrl: {
    id: 'ev109_triple_ctrl',
    label: '三环境链·混合对照（wisdom）',
    envId: 'wisdom_evolution',
    mixedEnvId: 'wisdom_evolution',
    ...EVO_CHAIN_BASE,
    carryIncubateSem: true,
    mixedSemEnabled: true,
    ...WL3_SEM_STACK,
  },
  ev109_triple_fertile: {
    id: 'ev109_triple_fertile',
    label: '三环境链·富足混合',
    envId: 'fertile_field',
    mixedEnvId: 'fertile_field',
    ...EVO_CHAIN_BASE,
    carryIncubateSem: true,
    mixedSemEnabled: true,
    ...WL3_SEM_STACK,
  },
};

/** Phase 110 — GAP-13 留置链 × COOP/SOC 合作因果 */
const EVO_CHAIN_COOP_BASE = {
  ...EVO_CHAIN_BASE,
  carryIncubateSem: true,
  mixedSemEnabled: true,
  mixedEnvId: 'fertile_field',
  envId: 'fertile_field',
  ...WL3_SEM_STACK,
};

export const PHASE110_TREATMENTS = {
  ev110_coop_off: {
    id: 'ev110_coop_off',
    label: '留置链·无COOP/SOC',
    ...EVO_CHAIN_COOP_BASE,
    cooperationProfileEnabled: false,
    cooperationFeedback: false,
    socialKnowledgeEnabled: false,
    socialKnowledgeFeedbackEnabled: false,
  },
  ev110_coop_on: {
    id: 'ev110_coop_on',
    label: '留置链·COOP反馈',
    ...EVO_CHAIN_COOP_BASE,
    ...COOP_BASE,
    socialKnowledgeEnabled: false,
    socialKnowledgeFeedbackEnabled: false,
  },
  ev110_coop_soc: {
    id: 'ev110_coop_soc',
    label: '留置链·COOP+SOC',
    ...EVO_CHAIN_COOP_BASE,
    ...COOP_BASE,
    ...WL3_SOC_STACK,
  },
};

/** Phase 112 — 四环境留置链：塑形 → SEM 孵化 → 富足蓄积 → 混合 */
const EVO_QUAD_CHAIN_BASE = {
  ...EVO_CHAIN_BASE,
  carryIncubateSem: true,
  mixedSemEnabled: true,
  mixedEnvId: 'wisdom_evolution',
  carryAccrueEnvId: 'fertile_field',
  carryAccrueTicks: 384,
  carryAccrueCoop: true,
  ...WL3_SEM_STACK,
  ...COOP_BASE,
};

export const PHASE112_TREATMENTS = {
  ev112_quad_chain: {
    id: 'ev112_quad_chain',
    label: '四环境链·富足蓄积→智慧混合',
    envId: 'wisdom_evolution',
    ...EVO_QUAD_CHAIN_BASE,
    carryAccrueEnabled: true,
  },
  ev112_triple_ctrl: {
    id: 'ev112_triple_ctrl',
    label: '三环境链对照（无蓄积）',
    envId: 'wisdom_evolution',
    ...EVO_QUAD_CHAIN_BASE,
    carryAccrueEnabled: false,
    cooperationProfileEnabled: false,
    cooperationFeedback: false,
  },
};

/** Phase 115 — 五环境留置链：塑形 → 孵化 → 蓄积 → SEM 精炼 → 混合 */
const EVO_PENTA_CHAIN_BASE = {
  ...EVO_QUAD_CHAIN_BASE,
  carryAccrueEnabled: true,
  fieldRunDeadlineMs: 180000,
  fieldMaxTicksPerPass: 8192,
  carryChainPasses: [
    { stage: 'incubate', envId: 'wisdom_evolution', ticks: 384, semEnabled: true },
    { stage: 'accrue', envId: 'fertile_field', ticks: 384, coopEnabled: true },
    { stage: 'refine', envId: 'wisdom_evolution', ticks: 256, semEnabled: true, semFeedbackEnabled: true },
  ],
};

export const PHASE115_TREATMENTS = {
  ev115_penta_chain: {
    id: 'ev115_penta_chain',
    label: '五环境链·SEM精炼',
    envId: 'wisdom_evolution',
    ...EVO_PENTA_CHAIN_BASE,
  },
  ev115_quad_ctrl: {
    id: 'ev115_quad_ctrl',
    label: '四环境链对照',
    envId: 'wisdom_evolution',
    ...EVO_QUAD_CHAIN_BASE,
    carryAccrueEnabled: true,
    carryChainPasses: undefined,
  },
};

/** Phase 116 — 加长塑形 tick + 截止守卫（五环境链基底） */
export const PHASE116_TREATMENTS = {
  ev116_sculpt_std: {
    id: 'ev116_sculpt_std',
    label: '标准塑形·五环境链',
    envId: 'wisdom_evolution',
    ...EVO_PENTA_CHAIN_BASE,
    sculptTicks: 640,
  },
  ev116_sculpt_long: {
    id: 'ev116_sculpt_long',
    label: '加长塑形·五环境链',
    envId: 'wisdom_evolution',
    ...EVO_PENTA_CHAIN_BASE,
    sculptTicks: 1920,
  },
};

/** Phase 117 — 六环境+留置链：五环境基底 + stress-echo + SOC 通行 */
const EVO_HEXA_CHAIN_BASE = {
  ...EVO_PENTA_CHAIN_BASE,
  carryChainPasses: [
    { stage: 'incubate', envId: 'wisdom_evolution', ticks: 384, semEnabled: true },
    { stage: 'accrue', envId: 'fertile_field', ticks: 384, coopEnabled: true },
    { stage: 'refine', envId: 'wisdom_evolution', ticks: 256, semEnabled: true, semFeedbackEnabled: true },
    { stage: 'stress_echo', envId: 'harsh_combined', ticks: 192 },
    { stage: 'soc', envId: 'wisdom_evolution', ticks: 256, socEnabled: true },
  ],
};

export const PHASE117_TREATMENTS = {
  ev117_hexa_chain: {
    id: 'ev117_hexa_chain',
    label: '六环境+链·stress-echo+SOC',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_CHAIN_BASE,
  },
  ev117_penta_ctrl: {
    id: 'ev117_penta_ctrl',
    label: '五环境链对照',
    envId: 'wisdom_evolution',
    ...EVO_PENTA_CHAIN_BASE,
  },
};

/** Phase 118 — GAP-13 六环境+链 × 多批次合作因果定律 */
const EVO_HEXA_COOP_LAW_BASE = {
  ...EVO_HEXA_CHAIN_BASE,
  mixedTicks: 960,
  fieldRunDeadlineMs: 180000,
  fieldMaxTicksPerPass: 8192,
  mixedSemEnabled: true,
  ...WL3_SEM_STACK,
};

export const PHASE118_TREATMENTS = {
  ev118_coop_hexa: {
    id: 'ev118_coop_hexa',
    label: '六环境+链·COOP+SOC',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_COOP_LAW_BASE,
    ...COOP_BASE,
    ...WL3_SOC_STACK,
  },
  ev118_coop_off: {
    id: 'ev118_coop_off',
    label: '六环境+链·无COOP/SOC',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_COOP_LAW_BASE,
    cooperationProfileEnabled: false,
    cooperationFeedback: false,
    socialKnowledgeEnabled: false,
    socialKnowledgeFeedbackEnabled: false,
  },
};

/** Phase 119 — 8192 tick 长时稳健性（turbo 加速 + 截止守卫） */
const EVO_HEXA_LONGFIELD_BASE = {
  ...EVO_HEXA_CHAIN_BASE,
  fieldRunDeadlineMs: 180000,
  fieldMaxTicksPerPass: 8192,
  mixedSemEnabled: true,
  ...WL3_SEM_STACK,
  ...COOP_BASE,
  ...WL3_SOC_STACK,
};

export const PHASE119_TREATMENTS = {
  ev119_long_8192: {
    id: 'ev119_long_8192',
    label: '六环境+链·8192混合·turbo',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_LONGFIELD_BASE,
    mixedTicks: 8192,
    fieldTurboMode: true,
  },
  ev119_std_960: {
    id: 'ev119_std_960',
    label: '六环境+链·960混合',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_LONGFIELD_BASE,
    mixedTicks: 960,
    fieldTurboMode: false,
  },
};

/** Phase 121 — GAP-13 × 8192 tick 合作因果（六环境+链 · turbo） */
const EVO_HEXA_COOP_LONG_BASE = {
  ...EVO_HEXA_LONGFIELD_BASE,
  mixedTicks: 8192,
  fieldTurboMode: true,
};

export const PHASE121_TREATMENTS = {
  ev121_coop_long: {
    id: 'ev121_coop_long',
    label: '六环境+链·COOP+SOC·8192',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_COOP_LONG_BASE,
    ...COOP_BASE,
    ...WL3_SOC_STACK,
  },
  ev121_coop_off_long: {
    id: 'ev121_coop_off_long',
    label: '六环境+链·无COOP·8192',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_COOP_LONG_BASE,
    cooperationProfileEnabled: false,
    cooperationFeedback: false,
    socialKnowledgeEnabled: false,
    socialKnowledgeFeedbackEnabled: false,
  },
};

/** Phase 123 — GAP-13 留置繁殖×SOC 继承交互假说（8192 · turbo） */
export const PHASE123_TREATMENTS = {
  ev123_coop_interact: {
    id: 'ev123_coop_interact',
    label: '六环境+链·留置交互·COOP+SOC',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_COOP_LONG_BASE,
    ...COOP_BASE,
    ...WL3_SOC_STACK,
  },
  ev123_coop_off_interact: {
    id: 'ev123_coop_off_interact',
    label: '六环境+链·留置交互·无COOP',
    envId: 'wisdom_evolution',
    ...EVO_HEXA_COOP_LONG_BASE,
    cooperationProfileEnabled: false,
    cooperationFeedback: false,
    socialKnowledgeEnabled: false,
    socialKnowledgeFeedbackEnabled: false,
  },
};

/** Phase 124 — GAP-PAIR-0 体内合胞极简双源繁殖 */
const PAIR_REPRO_MIN_BASE = {
  envId: 'fertile_field',
  substrateDrainMult: 0.52,
  substrateBoost: 0.02,
  substrateFloor: 0.54,
  catastropheDisabled: true,
  organismMode: 'multicell',
  fissionEnabled: false,
  ecoFissEnabled: false,
  rplEnabled: true,
  rplBaseMax: 4,
  rplMaxSpread: 2,
  meiEnabled: true,
  meiMinAge: 32,
  meiMaxStress: 0.28,
  meiMinIntegrity: 0.45,
  meiMinSubstrate: 0.42,
  meiCooldown: 56,
  meiBaseProb: 0.45,
  fusEnabled: false,
  pairReproEnabled: true,
  pairFusInBody: true,
  pairGateMin: 0.08,
  pairGateFieldWeight: 0.35,
  gestationTicks: 64,
  embFluxFrac: 0.018,
  reproMode: 'gestation',
  nurtureTicks: 64,
  nurtureSeedFrac: 0.3,
  nurtureTickGrant: 0.014,
  independenceTicks: 64,
  dockBaseProb: 0.35,
  dockCooldown: 56,
  fusionMutationRate: 0.015,
  fusionMaxPop: 24,
  cohort: 'pair',
};

export const PHASE124_TREATMENTS = {
  ev124_pair_min: {
    id: 'ev124_pair_min',
    label: 'PAIR-0·体内合胞·关FISS',
    ...PAIR_REPRO_MIN_BASE,
  },
  ev124_pair_ctrl_instant: {
    id: 'ev124_pair_ctrl_instant',
    label: '对照·即时FUS',
    ...PAIR_REPRO_MIN_BASE,
    pairReproEnabled: false,
    pairFusInBody: false,
    fusEnabled: true,
    fusPairCooldown: 90,
    fusPacketMaxAge: 56,
    reproMode: 'instant',
  },
  ev124_pair_ctrl_fiss: {
    id: 'ev124_pair_ctrl_fiss',
    label: '对照·克隆FISS',
    ...PAIR_REPRO_MIN_BASE,
    pairReproEnabled: false,
    pairFusInBody: false,
    fissionEnabled: true,
    ecoFissEnabled: true,
    meiEnabled: false,
    reproMode: 'instant',
  },
};

/** Phase 125 — GAP-PAIR-1 半态排入环境场 */
export const PHASE125_TREATMENTS = {
  ev125_pair_field: {
    id: 'ev125_pair_field',
    label: 'PAIR-1·半态排入场',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairFieldHalfMaxAge: 96,
  },
  ev125_pair_body: {
    id: 'ev125_pair_body',
    label: 'PAIR-0·体内直连对照',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: false,
  },
  ev125_pair_ctrl_fiss: {
    id: 'ev125_pair_ctrl_fiss',
    label: '对照·克隆FISS',
    ...PAIR_REPRO_MIN_BASE,
    pairReproEnabled: false,
    pairFusInBody: false,
    pairHalfRelease: false,
    fissionEnabled: true,
    ecoFissEnabled: true,
    meiEnabled: false,
    reproMode: 'instant',
  },
};

/** Phase 126 — GAP-PAIR-2 许可握手 [PRQ]/[PGR] */
export const PHASE126_TREATMENTS = {
  ev126_pair_handshake: {
    id: 'ev126_pair_handshake',
    label: 'PAIR-2·许可握手',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairHandshake: true,
    pairFieldHalfMaxAge: 96,
    pairRequestMaxAge: 48,
  },
  ev126_pair_nohandshake: {
    id: 'ev126_pair_nohandshake',
    label: 'PAIR-1·无握手对照',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairHandshake: false,
    pairFieldHalfMaxAge: 96,
  },
  ev126_pair_ctrl_fiss: {
    id: 'ev126_pair_ctrl_fiss',
    label: '对照·克隆FISS',
    ...PAIR_REPRO_MIN_BASE,
    pairReproEnabled: false,
    pairFusInBody: false,
    pairHalfRelease: false,
    pairHandshake: false,
    fissionEnabled: true,
    ecoFissEnabled: true,
    meiEnabled: false,
    reproMode: 'instant',
  },
};

/** Phase 127 — GAP-PAIR-3 subCell / r_k 通道绑定 */
export const PHASE127_TREATMENTS = {
  ev127_pair_channel: {
    id: 'ev127_pair_channel',
    label: 'PAIR-3·通道绑定',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairHandshake: true,
    pairChannelBind: true,
    pairReleaseSubRole: 'act',
    pairAcceptSubRole: 'draw',
    pairAcceptRMin: 0.08,
    pairAcceptEMin: 0.06,
    pairFieldHalfMaxAge: 96,
    pairRequestMaxAge: 48,
  },
  ev127_pair_nochannel: {
    id: 'ev127_pair_nochannel',
    label: 'PAIR-2·无通道对照',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairHandshake: true,
    pairChannelBind: false,
    pairFieldHalfMaxAge: 96,
    pairRequestMaxAge: 48,
  },
  ev127_pair_ctrl_fiss: {
    id: 'ev127_pair_ctrl_fiss',
    label: '对照·克隆FISS',
    ...PAIR_REPRO_MIN_BASE,
    pairReproEnabled: false,
    pairFusInBody: false,
    pairHalfRelease: false,
    pairHandshake: false,
    pairChannelBind: false,
    fissionEnabled: true,
    ecoFissEnabled: true,
    meiEnabled: false,
    reproMode: 'instant',
  },
};

/** Phase 128 — GAP-PAIR-4 多维激素向量 h_k */
export const PHASE128_TREATMENTS = {
  ev128_pair_hormvec: {
    id: 'ev128_pair_hormvec',
    label: 'PAIR-4·多维激素',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairHandshake: true,
    pairChannelBind: true,
    pairHormoneVector: true,
    pairReleaseSubRole: 'act',
    pairAcceptSubRole: 'draw',
    pairAcceptRMin: 0.08,
    pairAcceptEMin: 0.06,
    pairHormoneMeanMin: 0.06,
    pairHormoneFloorMin: 0.01,
    pairFieldHalfMaxAge: 96,
    pairRequestMaxAge: 48,
  },
  ev128_pair_scalar: {
    id: 'ev128_pair_scalar',
    label: 'PAIR-3·标量激素对照',
    ...PAIR_REPRO_MIN_BASE,
    pairHalfRelease: true,
    pairHandshake: true,
    pairChannelBind: true,
    pairHormoneVector: false,
    pairReleaseSubRole: 'act',
    pairAcceptSubRole: 'draw',
    pairAcceptRMin: 0.08,
    pairAcceptEMin: 0.06,
    pairFieldHalfMaxAge: 96,
    pairRequestMaxAge: 48,
  },
  ev128_pair_ctrl_fiss: {
    id: 'ev128_pair_ctrl_fiss',
    label: '对照·克隆FISS',
    ...PAIR_REPRO_MIN_BASE,
    pairReproEnabled: false,
    pairFusInBody: false,
    pairHalfRelease: false,
    pairHandshake: false,
    pairChannelBind: false,
    pairHormoneVector: false,
    fissionEnabled: true,
    ecoFissEnabled: true,
    meiEnabled: false,
    reproMode: 'instant',
  },
};

/** Phase 129 — 六环境链 × PAIR-0 混合繁殖 */
const EVO_CHAIN_PAIR_BASE = {
  ...EVO_HEXA_CHAIN_BASE,
  carryMode: 'chain',
  cohort: 'pair',
  envId: 'fertile_field',
  mixedEnvId: 'fertile_field',
  mixedTicks: 640,
  fieldRunDeadlineMs: 180000,
  fieldMaxTicksPerPass: 8192,
  carryPairMorphAssign: ['A', 'B'],
  catastropheDisabled: true,
  organismMode: 'multicell',
  fissionEnabled: false,
  ecoFissEnabled: false,
  rplEnabled: true,
  meiEnabled: true,
  fusEnabled: false,
  pairReproEnabled: true,
  pairFusInBody: true,
  pairHalfRelease: false,
  reproMode: 'gestation',
  substrateDrainMult: 0.52,
  substrateBoost: 0.02,
  substrateFloor: 0.54,
  pairGateMin: 0.08,
  pairGateFieldWeight: 0.35,
  gestationTicks: 64,
  nurtureTicks: 64,
  dockBaseProb: 0.35,
  mixedSemEnabled: false,
  cooperationProfileEnabled: false,
  socialKnowledgeEnabled: false,
};

export const PHASE129_TREATMENTS = {
  ev129_chain_pair: {
    id: 'ev129_chain_pair',
    label: '六环境链+PAIR-0',
    ...EVO_CHAIN_PAIR_BASE,
  },
  ev129_chain_eco: {
    id: 'ev129_chain_eco',
    label: '六环境链+生态FISS对照',
    envId: 'wisdom_evolution',
    mixedEnvId: 'wisdom_evolution',
    ...EVO_HEXA_CHAIN_BASE,
    carryMode: 'chain',
    mixedSemEnabled: true,
    ...WL3_SEM_STACK,
  },
  ev129_pair_only: {
    id: 'ev129_pair_only',
    label: '无链·PAIR-0基线',
    ...PAIR_REPRO_MIN_BASE,
    carryMode: 'none',
    cohort: 'pair',
  },
};

/** Phase 130 — 六环境链 × PAIR-2/3/4 全栈 */
const EVO_CHAIN_PAIR_FULL_BASE = {
  ...EVO_CHAIN_PAIR_BASE,
  pairHalfRelease: true,
  pairHandshake: true,
  pairChannelBind: true,
  pairHormoneVector: true,
  pairReleaseSubRole: 'act',
  pairAcceptSubRole: 'draw',
  pairAcceptRMin: 0.08,
  pairAcceptEMin: 0.06,
  pairHormoneMeanMin: 0.06,
  pairHormoneFloorMin: 0.01,
  pairFieldHalfMaxAge: 96,
  pairRequestMaxAge: 48,
};

const PAIR_FULL_ONLY_BASE = {
  ...PAIR_REPRO_MIN_BASE,
  carryMode: 'none',
  cohort: 'pair',
  pairHalfRelease: true,
  pairHandshake: true,
  pairChannelBind: true,
  pairHormoneVector: true,
  pairReleaseSubRole: 'act',
  pairAcceptSubRole: 'draw',
  pairAcceptRMin: 0.08,
  pairAcceptEMin: 0.06,
  pairHormoneMeanMin: 0.06,
  pairHormoneFloorMin: 0.01,
  pairFieldHalfMaxAge: 96,
  pairRequestMaxAge: 48,
};

export const PHASE130_TREATMENTS = {
  ev130_chain_pair_full: {
    id: 'ev130_chain_pair_full',
    label: '六环境链+PAIR全栈',
    ...EVO_CHAIN_PAIR_FULL_BASE,
  },
  ev130_chain_pair0: {
    id: 'ev130_chain_pair0',
    label: '六环境链+PAIR-0对照',
    ...EVO_CHAIN_PAIR_BASE,
  },
  ev130_pair_full_only: {
    id: 'ev130_pair_full_only',
    label: '无链·PAIR全栈基线',
    ...PAIR_FULL_ONLY_BASE,
  },
};

/** Phase 131 — WL-R1 繁殖邻域 SEM 域标记 */
const WL_R1_SEM_STACK = {
  ...WL3_SEM_STACK,
  mixedSemEnabled: true,
  semDomainTag: true,
  semMinCount: 2,
  semReproWindow: 48,
  semDomainWindow: 48,
};

export const PHASE131_TREATMENTS = {
  ev131_wlr_chain_full: {
    id: 'ev131_wlr_chain_full',
    label: '链+PAIR全栈+SEM域',
    ...EVO_CHAIN_PAIR_FULL_BASE,
    ...WL_R1_SEM_STACK,
  },
  ev131_wlr_chain_pair0: {
    id: 'ev131_wlr_chain_pair0',
    label: '链+PAIR-0+SEM域对照',
    ...EVO_CHAIN_PAIR_BASE,
    ...WL_R1_SEM_STACK,
  },
  ev131_wlr_sem_plain: {
    id: 'ev131_wlr_sem_plain',
    label: '链+PAIR全栈+SEM无域对照',
    ...EVO_CHAIN_PAIR_FULL_BASE,
    ...WL3_SEM_STACK,
    mixedSemEnabled: true,
    semDomainTag: false,
  },
};

/** Phase 132 — WL-R2 链×PAIR 混编跨代繁殖载荷迹 */
const WL_R2_LIN_STACK = {
  ...WL_R1_SEM_STACK,
  semReproLineage: true,
};

export const PHASE132_TREATMENTS = {
  ev132_wlr_lin_full: {
    id: 'ev132_wlr_lin_full',
    label: '链+PAIR全栈+繁殖域迹',
    ...EVO_CHAIN_PAIR_FULL_BASE,
    ...WL_R2_LIN_STACK,
  },
  ev132_wlr_lin_off: {
    id: 'ev132_wlr_lin_off',
    label: '链+PAIR全栈+谱系无繁殖域',
    ...EVO_CHAIN_PAIR_FULL_BASE,
    ...WL_R1_SEM_STACK,
    semReproLineage: false,
  },
  ev132_wlr_no_lin: {
    id: 'ev132_wlr_no_lin',
    label: '链+PAIR全栈+无谱系对照',
    ...EVO_CHAIN_PAIR_FULL_BASE,
    ...WL_R1_SEM_STACK,
    semLineageEnabled: false,
    semReproLineage: false,
  },
};

/** Phase 113 — GAP-13 加长混合 tick + 墙钟/tick 截止守卫 */
export const PHASE113_TREATMENTS = {
  ev113_coop_std: {
    id: 'ev113_coop_std',
    label: '标准混合·COOP+SOC',
    ...EVO_CHAIN_COOP_BASE,
    mixedTicks: 640,
    fieldRunDeadlineMs: 180000,
    fieldMaxTicksPerPass: 8192,
    ...COOP_BASE,
    ...WL3_SOC_STACK,
  },
  ev113_coop_long: {
    id: 'ev113_coop_long',
    label: '加长混合·COOP+SOC',
    ...EVO_CHAIN_COOP_BASE,
    mixedTicks: 1920,
    fieldRunDeadlineMs: 180000,
    fieldMaxTicksPerPass: 8192,
    ...COOP_BASE,
    ...WL3_SOC_STACK,
  },
};

/** 观察台默认环境 — W6 环境栈 + 智慧语言 SEM 栈 */
ENV_PROFILES.observer_wl_stack = {
  id: 'observer_wl_stack',
  label: '观察台·智慧语言栈',
  ...W5_WISDOM_FULL,
  organismMode: 'multicell',
  ...ECO_REPRO_BASE,
  ...W6_TOOL_ORG_STACK,
  ...W6_ENV_STACK,
  ...WL3_SEM_STACK,
};

/** 观察台默认环境 — W6 环境栈可视化 */
ENV_PROFILES.observer_w6_stack = {
  id: 'observer_w6_stack',
  label: '观察台·环境栈',
  ...W5_WISDOM_FULL,
  organismMode: 'multicell',
  ...ECO_REPRO_BASE,
  ...W6_TOOL_ORG_STACK,
  ...W6_ENV_STACK,
};

/** Phase 95 — GAP-11+ [DSP] 耗散定律记录层 */
export const PHASE95_TREATMENTS = {
  dsp_off_ref: {
    id: 'dsp_off_ref',
    label: '无DSP账本',
    envId: 'wisdom_evolution',
    ...DSP_ENV_BASE,
    dissipationEnabled: false,
  },
  dsp_on_ref: {
    id: 'dsp_on_ref',
    label: 'DSP y=0.3',
    envId: 'wisdom_evolution',
    ...DSP_ENV_BASE,
    dissipationEnabled: true,
    dspYieldFrac: 0.3,
  },
  dsp_on_low: {
    id: 'dsp_on_low',
    label: 'DSP y=0.2',
    envId: 'wisdom_evolution',
    ...DSP_ENV_BASE,
    dissipationEnabled: true,
    dspYieldFrac: 0.2,
  },
  dsp_on_high: {
    id: 'dsp_on_high',
    label: 'DSP y=0.4',
    envId: 'wisdom_evolution',
    ...DSP_ENV_BASE,
    dissipationEnabled: true,
    dspYieldFrac: 0.4,
  },
};

/** Phase 78 — L6b 多情境开放泛化（智慧完整栈 × 基线/剧变/耗竭/幼体） */
export const PHASE78_TREATMENTS = {
  w5_ctx_base: {
    id: 'w5_ctx_base',
    label: '智慧栈基线情境',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    wisdomContextId: 'base',
  },
  w5_ctx_shock: {
    id: 'w5_ctx_shock',
    label: '智慧栈+高频剧变情境',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    wisdomContextId: 'shock',
    catastropheDisabled: false,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
  w5_ctx_fertile: {
    id: 'w5_ctx_fertile',
    label: '智慧栈+富足加成情境',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    wisdomContextId: 'fertile',
    substrateDrainMult: 0.38,
    substrateFloor: 0.58,
    substrateBoost: 0.04,
  },
  w5_ctx_juv: {
    id: 'w5_ctx_juv',
    label: '智慧栈+幼体脆弱情境',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
    wisdomContextId: 'juvenile',
    juvenileTicks: 80,
    juvenileDrawMult: 0.48,
    juvenileMinGen: 1,
  },
};

/** Phase 77 — W5 长时开放演化田野（智慧完整栈 × 1920 vs 8192） */
export const PHASE77_TREATMENTS = {
  w5_std_1920: {
    id: 'w5_std_1920',
    label: '智慧完整栈×1920',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
  },
  w5_open_8192: {
    id: 'w5_open_8192',
    label: '智慧完整栈×8192',
    envId: 'wisdom_evolution',
    ...W5_WISDOM_FULL,
  },
};

/** Phase 76 — W4 谱系记忆回响（亲代 mem 摘要 → [MEM-LIN] → W1 闭环） */
export const PHASE76_TREATMENTS = {
  w4_mem_echo_off: {
    id: 'w4_mem_echo_off',
    label: '社会知识无记忆回响',
    envId: 'wisdom_evolution',
    ...W4_MEM_BASE,
    memLineageEchoEnabled: false,
  },
  w4_mem_echo_on: {
    id: 'w4_mem_echo_on',
    label: '社会知识+谱系记忆回响',
    envId: 'wisdom_evolution',
    ...W4_MEM_BASE,
    memLineageEchoEnabled: true,
    memLineageEchoBlend: 0.55,
  },
};

/** Phase 75 — W4 社会知识累积（RX 频次编码 → 可继承社会迹） */
export const PHASE75_TREATMENTS = {
  w4_soc_off: {
    id: 'w4_soc_off',
    label: '智慧演化无社会知识累积',
    envId: 'wisdom_evolution',
    ...W4_SOC_BASE,
    socialKnowledgeEnabled: false,
  },
  w4_soc_on: {
    id: 'w4_soc_on',
    label: '智慧演化+社会知识累积',
    envId: 'wisdom_evolution',
    ...W4_SOC_BASE,
    socialKnowledgeEnabled: true,
    socialKnowledgeFeedbackEnabled: true,
  },
};

/** Phase 74 — W3 预测误差 → 行为校正反馈 */
export const PHASE74_TREATMENTS = {
  w3_prd_record: {
    id: 'w3_prd_record',
    label: '预测记录无反馈',
    envId: 'wisdom_evolution',
    ...W3_PRD_BASE,
    predictionFeedbackEnabled: false,
  },
  w3_prd_feedback: {
    id: 'w3_prd_feedback',
    label: '预测记录+校正反馈',
    envId: 'wisdom_evolution',
    ...W3_PRD_BASE,
    predictionFeedbackEnabled: true,
  },
};

/** Phase 72 — W2 选择压强化环境（攻坚 GAP-10 / GAP-W02） */
export const PHASE72_TREATMENTS = {
  w2_p71_ref: {
    id: 'w2_p71_ref',
    label: 'Phase71基线（富足无剧变）',
    envId: 'wisdom_evolution',
    ...W2_WISDOM_BASE,
  },
  w2_rein_shk: {
    id: 'w2_rein_shk',
    label: '强化+高频剧变',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    pulseInterval: 50,
    substrateDrainMult: 0.88,
    substrateFloor: 0.4,
  },
  w2_rein_harsh: {
    id: 'w2_rein_harsh',
    label: '强化+组合高压',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    pulseInterval: 50,
    juvenileTicks: 80,
    juvenileDrawMult: 0.48,
    juvenileMinGen: 1,
    substrateDrainMult: 1.12,
    substrateFloor: 0.36,
  },
  w2_rein_sparse: {
    id: 'w2_rein_sparse',
    label: '强化+基底耗竭',
    envId: 'wisdom_evolution',
    ...W2_REIN_COMMON,
    substrateDrainMult: 1.22,
    substrateFloor: 0.32,
  },
};

/** Phase 66 — 意识可持续：谱系×续行×H3 跨代并存 */
export const PHASE66_TREATMENTS = {
  cn_sustain_full_3840: {
    id: 'cn_sustain_full_3840',
    label: '完整栈×谱系续行×3840',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    fieldLongStudy: true,
  },
  cn_sustain_lin_off_3840: {
    id: 'cn_sustain_lin_off_3840',
    label: '无谱系回响×3840（对照）',
    envId: 'consciousness_full',
    ...EHU_DEEP_FULL,
    ...REN_BASE,
    ...PLG_BASE,
    ehuLineageEchoEnabled: false,
    ehuDistinctionErosionMult: 0.3,
    ehuBindNarrative: true,
    fieldLongStudy: true,
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

export function initEnvStackModules(world, profile = world?.envProfile) {
  if (!profile) return;
  if (profile.placeEnabled || profile.placeBand != null) {
    initWorldPlace(world, profile);
    applyTerrainSubstrateBias(world);
  }
  if (profile.pcpEnabled) initPcpState(world, profile);
  if (profile.diurnalEnabled) initDiurnalStats(world);
  if (profile.seasonalEnabled) initSeasonalStats(world);
  if (profile.airEnabled) initAirState(world, profile);
  if (profile.advEnabled) initAdvState(world);
  if (profile.ltcEnabled) initLunarStats(world);
  if (profile.artEnabled) initArtState(world, profile);
  if (profile.ventEnabled) initVentState(world, profile);
  if (profile.migEnabled) initMigState(world);
  if (profile.dissipationEnabled) initDissipationStats(world);
}

export function applyPhase108Treatment(world, treatmentId) {
  const treatment = PHASE108_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase108 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 108, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase109Treatment(world, treatmentId) {
  const treatment = PHASE109_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase109 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 109, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase110Treatment(world, treatmentId) {
  const treatment = PHASE110_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase110 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 110, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase112Treatment(world, treatmentId) {
  const treatment = PHASE112_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase112 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  world.fieldStudy = { phase: 112, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase115Treatment(world, treatmentId) {
  const treatment = PHASE115_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase115 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  world.fieldStudy = { phase: 115, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase116Treatment(world, treatmentId) {
  const treatment = PHASE116_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase116 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  world.fieldStudy = { phase: 116, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase117Treatment(world, treatmentId) {
  const treatment = PHASE117_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase117 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 117, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase118Treatment(world, treatmentId) {
  const treatment = PHASE118_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase118 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 118, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase119Treatment(world, treatmentId) {
  const treatment = PHASE119_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase119 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 119, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase121Treatment(world, treatmentId) {
  const treatment = PHASE121_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase121 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 121, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase123Treatment(world, treatmentId) {
  const treatment = PHASE123_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase123 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 123, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase124Treatment(world, treatmentId) {
  const treatment = PHASE124_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase124 处理组: ${treatmentId}`);
  }
  const envId = treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, envId);
  world.envProfile = { ...base, ...treatment, envId };
  world.fieldStudy = { phase: 124, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase125Treatment(world, treatmentId) {
  const treatment = PHASE125_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase125 处理组: ${treatmentId}`);
  }
  const envId = treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, envId);
  world.envProfile = { ...base, ...treatment, envId };
  world.fieldStudy = { phase: 125, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase126Treatment(world, treatmentId) {
  const treatment = PHASE126_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase126 处理组: ${treatmentId}`);
  }
  const envId = treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, envId);
  world.envProfile = { ...base, ...treatment, envId };
  world.fieldStudy = { phase: 126, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase127Treatment(world, treatmentId) {
  const treatment = PHASE127_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase127 处理组: ${treatmentId}`);
  }
  const envId = treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, envId);
  world.envProfile = { ...base, ...treatment, envId };
  world.fieldStudy = { phase: 127, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase128Treatment(world, treatmentId) {
  const treatment = PHASE128_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase128 处理组: ${treatmentId}`);
  }
  const envId = treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, envId);
  world.envProfile = { ...base, ...treatment, envId };
  world.fieldStudy = { phase: 128, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase129Treatment(world, treatmentId) {
  const treatment = PHASE129_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase129 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 129, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase130Treatment(world, treatmentId) {
  const treatment = PHASE130_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase130 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 130, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase131Treatment(world, treatmentId) {
  const treatment = PHASE131_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase131 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
    world.envProfile.semDomainTag = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 131, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase132Treatment(world, treatmentId) {
  const treatment = PHASE132_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase132 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId ?? 'fertile_field';
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
    world.envProfile.semDomainTag = false;
    world.envProfile.semReproLineage = false;
  }
  if (treatment.semLineageEnabled === false) {
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semReproLineage = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 132, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase113Treatment(world, treatmentId) {
  const treatment = PHASE113_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase113 处理组: ${treatmentId}`);
  }
  const mixedEnvId = treatment.mixedEnvId ?? treatment.envId;
  const base = applyEnvProfile(world, mixedEnvId);
  world.envProfile = { ...base, ...treatment, envId: mixedEnvId };
  if (!treatment.mixedSemEnabled) {
    world.envProfile.semEnabled = false;
    world.envProfile.semLineageEnabled = false;
    world.envProfile.semFeedbackEnabled = false;
  }
  if (!treatment.cooperationProfileEnabled) {
    world.envProfile.cooperationProfileEnabled = false;
    world.envProfile.cooperationFeedback = false;
  }
  if (!treatment.socialKnowledgeEnabled) {
    world.envProfile.socialKnowledgeEnabled = false;
    world.envProfile.socialKnowledgeFeedbackEnabled = false;
  }
  world.fieldStudy = { phase: 113, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase106Treatment(world, treatmentId) {
  const treatment = PHASE106_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase106 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 106, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase103Treatment(world, treatmentId) {
  const treatment = PHASE103_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase103 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 103, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase102Treatment(world, treatmentId) {
  const treatment = PHASE102_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase102 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 102, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase101Treatment(world, treatmentId) {
  const treatment = PHASE101_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase101 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 101, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase100Treatment(world, treatmentId) {
  const treatment = PHASE100_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase100 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 100, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase96Treatment(world, treatmentId) {
  const treatment = PHASE96_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase96 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 96, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  initAdvState(world);
  initLunarStats(world);
  initArtState(world, world.envProfile);
  initVentState(world, world.envProfile);
  initMigState(world);
  initDissipationStats(world);
  world.symCaptureTotal = 0;
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase95Treatment(world, treatmentId) {
  const treatment = PHASE95_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase95 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 95, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  initAdvState(world);
  initLunarStats(world);
  initArtState(world, world.envProfile);
  initVentState(world, world.envProfile);
  initMigState(world);
  initDissipationStats(world);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase94Treatment(world, treatmentId) {
  const treatment = PHASE94_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase94 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 94, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  initAdvState(world);
  initLunarStats(world);
  initArtState(world, world.envProfile);
  initVentState(world, world.envProfile);
  initMigState(world);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase93Treatment(world, treatmentId) {
  const treatment = PHASE93_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase93 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 93, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  initAdvState(world);
  initLunarStats(world);
  initArtState(world, world.envProfile);
  initVentState(world, world.envProfile);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase92Treatment(world, treatmentId) {
  const treatment = PHASE92_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase92 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 92, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  initAdvState(world);
  initLunarStats(world);
  initArtState(world, world.envProfile);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase91Treatment(world, treatmentId) {
  const treatment = PHASE91_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase91 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 91, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  initAdvState(world);
  initLunarStats(world);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase90Treatment(world, treatmentId) {
  const treatment = PHASE90_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase90 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 90, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  initAirState(world, world.envProfile);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase89Treatment(world, treatmentId) {
  const treatment = PHASE89_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase89 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 89, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  world.symCaptureTotal = 0;
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase88Treatment(world, treatmentId) {
  const treatment = PHASE88_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase88 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 88, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase87Treatment(world, treatmentId) {
  const treatment = PHASE87_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase87 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 87, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  initSeasonalStats(world);
  return world.envProfile;
}

export function applyPhase86Treatment(world, treatmentId) {
  const treatment = PHASE86_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase86 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 86, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  applyTerrainSubstrateBias(world);
  initNodes(world);
  initDiurnalStats(world);
  initPcpState(world, world.envProfile);
  return world.envProfile;
}

export function applyPhase85Treatment(world, treatmentId) {
  const treatment = PHASE85_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase85 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 85, treatmentId, ...treatment };
  initWorldPlace(world, world.envProfile);
  initSubstrate(world);
  initDiurnalStats(world);
  return world.envProfile;
}

export function applyPhase84Treatment(world, treatmentId) {
  const treatment = PHASE84_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase84 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 84, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase82Treatment(world, treatmentId) {
  const treatment = PHASE82_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase82 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 82, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase81Treatment(world, treatmentId) {
  const treatment = PHASE81_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase81 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 81, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase80Treatment(world, treatmentId) {
  const treatment = PHASE80_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase80 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 80, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase78Treatment(world, treatmentId) {
  const treatment = PHASE78_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase78 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 78, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase77Treatment(world, treatmentId) {
  const treatment = PHASE77_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase77 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 77, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase76Treatment(world, treatmentId) {
  const treatment = PHASE76_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase76 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 76, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase75Treatment(world, treatmentId) {
  const treatment = PHASE75_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase75 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 75, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase74Treatment(world, treatmentId) {
  const treatment = PHASE74_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase74 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 74, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase73Treatment(world, treatmentId) {
  const treatment = PHASE73_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase73 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 73, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase72Treatment(world, treatmentId) {
  const treatment = PHASE72_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase72 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 72, treatmentId, ...treatment };
  if (treatment.pulseInterval && world.catastrophe) {
    world.catastrophe.interval = treatment.pulseInterval;
    world.catastrophe.nextAt = Math.min(world.catastrophe.nextAt, treatment.pulseInterval);
  }
  return world.envProfile;
}

export function applyPhase71Treatment(world, treatmentId) {
  const treatment = PHASE71_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase71 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 71, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase70Treatment(world, treatmentId) {
  const treatment = PHASE70_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase70 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 70, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase66Treatment(world, treatmentId) {
  const treatment = PHASE66_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase66 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 66, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase65Treatment(world, treatmentId) {
  const treatment = PHASE65_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase65 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 65, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase63Treatment(world, treatmentId) {
  const treatment = PHASE63_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase63 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 63, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase62Treatment(world, treatmentId) {
  const treatment = PHASE62_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase62 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 62, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase61Treatment(world, treatmentId) {
  const treatment = PHASE61_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase61 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 61, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase60Treatment(world, treatmentId) {
  const treatment = PHASE60_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase60 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 60, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase59Treatment(world, treatmentId) {
  const treatment = PHASE59_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase59 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 59, treatmentId, ...treatment };
  return world.envProfile;
}

export function applyPhase58Treatment(world, treatmentId) {
  const treatment = PHASE58_TREATMENTS[treatmentId];
  if (!treatment) {
    throw new Error(`未知 Phase58 处理组: ${treatmentId}`);
  }
  const base = applyEnvProfile(world, treatment.envId);
  world.envProfile = { ...base, ...treatment };
  world.fieldStudy = { phase: 58, treatmentId, ...treatment };
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
