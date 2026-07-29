// 田野统计模式 — 无诞生仪式，仅实例化个体

import { createDna, createDnaFromSequence } from '../core/dna.js';
import { generateId } from '../core/id.js';
import { Being } from '../being/being.js';
import { initOrganism } from '../world/organism.js';
import { initReplicationQuota, recordReplicationInit } from '../world/replication.js';
import { performBirthRitual } from './ritual.js';
import { initExperience, experienceEnabled } from '../world/experience.js';
import { initRegisterProfile, registerProfileEnabled } from '../world/register-profile.js';
import { initMetabolicProfile, metabolicProfileEnabled } from '../world/metabolic-profile.js';
import { initCooperationProfile, cooperationProfileEnabled } from '../world/cooperation-profile.js';
import {
  initReproductionProfile,
  reproductionProfileEnabled,
  classifyBirthOrigin,
} from '../world/reproduction-profile.js';
import {
  initElectronicHuman,
  electronicHumanEnabled,
} from '../world/electronic-human-profile.js';
import { initMemoryFeedback, memoryFeedbackEnabled } from '../world/memory-feedback.js';

/** 统计田野：跳过仪式与冗余日志 */
export function spawnBeing(
  world,
  recorder,
  { name = '个体', code = '001', dnaSequence = null, id: fixedId = null } = {}
) {
  const tick = world.tick;
  const dna = dnaSequence ? createDnaFromSequence(code, dnaSequence) : createDna(code);
  const id = fixedId ?? generateId({ birthPlace: world.birthPlace, code });
  const being = new Being({ name, code, dna, id });
  being.bornAtTick = tick;
  initOrganism(being, world.envProfile);
  initReplicationQuota(being, world.envProfile);
  if (experienceEnabled(world.envProfile)) {
    initExperience(being);
  }
  if (registerProfileEnabled(world.envProfile)) {
    initRegisterProfile(being);
  }
  if (metabolicProfileEnabled(world.envProfile)) {
    initMetabolicProfile(being);
  }
  if (cooperationProfileEnabled(world.envProfile)) {
    initCooperationProfile(being);
  }
  if (reproductionProfileEnabled(world.envProfile)) {
    initReproductionProfile(being);
    being.rprOrigin = classifyBirthOrigin(being);
  }
  if (electronicHumanEnabled(world.envProfile)) {
    initElectronicHuman(being);
  }
  if (memoryFeedbackEnabled(world.envProfile)) {
    initMemoryFeedback(being);
  }

  if (!world.envProfile?.fieldStatMode) {
    recordReplicationInit(recorder, tick, being);
  }

  world.beings.push(being);
  return { being, id, dna };
}

/** 观察台用仪式；田野统计用 spawn */
export function birthIntoWorld(world, recorder, opts) {
  if (world.envProfile?.fieldStatMode) {
    return spawnBeing(world, recorder, opts);
  }
  return performBirthRitual(world, recorder, opts);
}
