// 人格栈整合 — EXP + REG + MTB + COOP + RPR + EHU（Phase 56）

import {
  profileStackSnapshot,
  beingLayerTransitions,
  STACK_OBSERVE,
  STACK_FEEDBACK,
} from './profile-stack.js';
import { reproductionSnapshot } from './reproduction-profile.js';
import { electronicHumanSnapshot } from './electronic-human-profile.js';

export { STACK_OBSERVE, STACK_FEEDBACK };

export const PERSONA_OBSERVE = {
  ...STACK_OBSERVE,
  reproductionProfileEnabled: true,
  reproductionFeedback: false,
  electronicHumanEnabled: true,
  electronicHumanFeedback: false,
};

export const PERSONA_FEEDBACK = {
  ...STACK_FEEDBACK,
  reproductionProfileEnabled: true,
  reproductionFeedback: true,
  electronicHumanEnabled: true,
  electronicHumanFeedback: true,
};

export function beingPersonaTransitions(being) {
  return (
    beingLayerTransitions(being) +
    (being.rprTransitions ?? 0) +
    (being.ehuTransitions ?? 0)
  );
}

export function personaStackSnapshot(being) {
  const stack = profileStackSnapshot(being);
  const rpr = reproductionSnapshot(being);
  const ehu = electronicHumanSnapshot(being);
  const personaTransitions =
    stack.layerTransitions + (rpr.transitions ?? 0) + (ehu.transitions ?? 0);
  return {
    ...stack,
    rpr,
    ehu,
    personaTransitions,
  };
}
