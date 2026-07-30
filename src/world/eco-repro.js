/** 生态繁殖默认 — 环境门控有丝分裂（FISS），无续行（REN） */

export function ecoFissProfileEnabled(profile) {
  return profile?.ecoFissEnabled === true || profile?.carryEcoFissEnabled === true;
}

/** 个体是否走生态分裂、跳过续行 */
export function beingUsesEcoFiss(being, profile) {
  if (ecoFissProfileEnabled(profile)) return true;
  return being?.ecoRepro === true && profile?.carryEcoFissEnabled === true;
}
