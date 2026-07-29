// 档案整合层 — EXP + REG + MTB + COOP 四层组合（Phase 52）

import { experienceSnapshot } from './experience.js';
import { registerSnapshot } from './register-profile.js';
import { metabolicSnapshot } from './metabolic-profile.js';
import { cooperationSnapshot } from './cooperation-profile.js';

export const STACK_OBSERVE = {
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
};

export function stackFeedbackConfig() {
  return {
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
  };
}

export const STACK_FEEDBACK = stackFeedbackConfig();

export function profileStackSnapshot(being) {
  const exp = experienceSnapshot(being);
  const reg = registerSnapshot(being);
  const mtb = metabolicSnapshot(being);
  const coop = cooperationSnapshot(being);
  const layerTransitions =
    (exp.transitions ?? 0) +
    (reg.transitions ?? 0) +
    (mtb.transitions ?? 0) +
    (coop.transitions ?? 0);
  return {
    exp,
    reg,
    mtb,
    coop,
    layerTransitions,
  };
}

export function beingLayerTransitions(being) {
  return (
    (being.expTransitions ?? 0) +
    (being.regTransitions ?? 0) +
    (being.metTransitions ?? 0) +
    (being.coopTransitions ?? 0)
  );
}
