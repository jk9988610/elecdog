/** Phase 121 — GAP-13 × 8192 tick 合作因果 */

import {
  analyzeCoopCausalLaw,
  verifyCoopCausalLawBatch,
  slimCarryChainMetrics,
} from './phase118-analyze.js';

export function analyzeCoopCausalLongLaw(recorder, beings, world, ctx) {
  const base = analyzeCoopCausalLaw(recorder, beings, world, ctx);
  const ticksRequested = ctx?.ticksRequested ?? ctx?.ticks ?? 0;
  const ticksCompleted = ctx?.ticks ?? 0;
  return {
    ...base,
    tickCompletionRate: ticksRequested ? +(ticksCompleted / ticksRequested).toFixed(4) : null,
    fieldTurboMode: world.envProfile?.fieldTurboMode === true,
  };
}

export function verifyCoopCausalLongLawBatch(byTreatment) {
  const mapped = {
    ev118_coop_hexa: byTreatment.ev121_coop_long ?? [],
    ev118_coop_off: byTreatment.ev121_coop_off_long ?? [],
  };
  const base = verifyCoopCausalLawBatch(mapped);

  const longOk = (byTreatment.ev121_coop_long ?? []).filter((r) => (r.carryCount ?? 0) > 0);
  const h8 = longOk.every((r) => (r.metrics.tickCompletionRate ?? 0) >= 0.95);
  const h9 = longOk.every((r) => (r.metrics.maxChainDepth ?? 0) >= 5);

  const support = base.support + [h8, h9].filter(Boolean).length;
  const total = 9;
  const passed = [
    base.h1MultiBatchImport,
    base.h2NoRen,
    base.h3CoopRobust,
    base.h4CarryAdvLaw,
    base.h5CorrSignLaw,
    base.h6OnBeatsOff,
    base.h7NoDeadline,
    h8,
    h9,
  ].filter(Boolean).length;

  return {
    ...base,
    h8TickComplete: h8,
    h9ChainDepth5: h9,
    support,
    passed,
    total,
    verdict:
      passed >= 6 ? 'support' : passed >= 5 ? 'weak' : passed >= 4 ? 'pending' : 'unsupport',
  };
}

export { slimCarryChainMetrics };
