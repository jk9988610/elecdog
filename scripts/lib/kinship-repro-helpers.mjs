/** 田野脚本共用 — 多细胞繁殖分娩辅助 */
import {
  initAdultMatingStructures,
  STR_PAIR_OUT,
  STR_PAIR_IN,
} from '../../src/world/body-structures.js';
import {
  processPartnerChannelFus,
  processPartnerFertilization,
  processPairGestation,
  restoreAdultReproPackages,
  registerPairSpeechPRQ,
  registerPairSpeechPGR,
} from '../../src/world/pair-repro.js';

export function pinChannels(being, code, ch) {
  const st = being?.bodyStructures?.[code];
  if (st) st.channels = [ch];
}

export function waiveReproGates(world, beings = []) {
  world.courtshipGraceUntilTick = 0;
  for (const b of beings) {
    b.courtshipEligibleAtTick = 0;
    b.partnerFusEligibleAtTick = 0;
    b.postpartumUntilTick = 0;
  }
}

export function resetPairForNextBirth(world, male, female, profile) {
  female.pregnant = false;
  female.syncyte = null;
  female.postpartumUntilTick = 0;
  female.partnerChannelFusedAtTick = null;
  female.fertilizationEligibleAtTick = null;
  male.partnerChannelFusedAtTick = null;
  restoreAdultReproPackages(male, world, profile);
  restoreAdultReproPackages(female, world, profile);
}

export function bondPair(world, recorder, male, female) {
  const profile = profileFrom(world);
  for (const b of world.beings ?? []) {
    if (b.id === male.id || b.id === female.id) {
      b.partnerId = null;
      b.partnerChannelFusedAtTick = null;
      b.fertilizationEligibleAtTick = null;
      b.partnerFusEligibleAtTick = 0;
    }
  }
  restoreAdultReproPackages(male, world, profile);
  restoreAdultReproPackages(female, world, profile);
  initAdultMatingStructures(male, profile, 0);
  initAdultMatingStructures(female, profile, 0);
  pinChannels(male, STR_PAIR_OUT, 7);
  pinChannels(female, STR_PAIR_IN, 7);
  waiveReproGates(world, world.beings ?? []);
  let prq = registerPairSpeechPRQ(world, recorder, male, female.id);
  let pgr = registerPairSpeechPGR(world, recorder, female, male.id);
  if (!prq || !pgr) {
    prq = registerPairSpeechPRQ(world, recorder, female, male.id);
    pgr = registerPairSpeechPGR(world, recorder, male, female.id);
  }
  return prq && pgr;
}

function profileFrom(world) {
  return world.envProfile ?? {};
}

export function birthChild(world, recorder, male, female) {
  const profile = profileFrom(world);
  restoreAdultReproPackages(male, world, profile);
  restoreAdultReproPackages(female, world, profile);
  pinChannels(male, STR_PAIR_OUT, 7);
  pinChannels(female, STR_PAIR_IN, 7);
  waiveReproGates(world, [male, female]);
  male.partnerFusEligibleAtTick = 0;
  female.partnerFusEligibleAtTick = 0;
  processPartnerChannelFus(world, recorder);
  world.tick = female.fertilizationEligibleAtTick ?? world.tick;
  const fus = processPartnerFertilization(world, recorder);
  if (!fus.length || !female.syncyte) return null;
  female.syncyte.gestationUntilTick = world.tick;
  const gest = processPairGestation(world, recorder);
  const childId = gest[0]?.childId;
  return childId ? world.beings.find((b) => b.id === childId) : null;
}
