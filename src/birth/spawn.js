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
import { initPrediction, predictionEnabled } from '../world/prediction.js';
import { initSocialKnowledge, socialKnowledgeEnabled } from '../world/social-knowledge.js';
import { initSemState, semEnabled } from '../world/sem.js';
import { initReservoir, reservoirEnabled } from '../world/reservoir.js';
import { initSynthCounters, synthEnabled } from '../world/synth.js';
import { initSymModules } from '../world/sym.js';
import { assignBeingPlace, applyPlaceBirthBias, placeEnabled } from '../world/place.js';
import { SOLAR_CHANNEL } from '../world/diurnal.js';

/** 统计田野：跳过仪式与冗余日志 */
export function spawnBeing(
  world,
  recorder,
  {
    name = '个体',
    code = '001',
    dnaSequence = null,
    id: fixedId = null,
    placeBand = null,
    placePatch = null,
    placeTerrain = null,
  } = {}
) {
  const tick = world.tick;
  const dna = dnaSequence ? createDnaFromSequence(code, dnaSequence) : createDna(code);
  const id = fixedId ?? generateId({ birthPlace: world.birthPlace, code });
  const being = new Being({ name, code, dna, id });
  being.bornAtTick = tick;
  initOrganism(being, world.envProfile);
  if (placeBand || placeTerrain) {
    assignBeingPlace(being, {
      band: placeBand ?? world.envProfile.placeBand ?? 'M',
      patch: placePatch ?? '00',
      terrain: placeTerrain ?? world.envProfile.placeTerrain ?? null,
    });
  } else if (placeEnabled(world.envProfile)) {
    assignBeingPlace(being, {
      band: world.place?.band ?? world.envProfile.placeBand ?? 'M',
      patch: placePatch ?? world.place?.patch ?? '00',
      terrain: world.place?.terrain ?? world.envProfile.placeTerrain ?? null,
    });
  }
  if (being.place || placeEnabled(world.envProfile)) {
    applyPlaceBirthBias(being, SOLAR_CHANNEL);
  }
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
  if (predictionEnabled(world.envProfile)) {
    initPrediction(being);
  }
  if (socialKnowledgeEnabled(world.envProfile)) {
    initSocialKnowledge(being);
  }
  if (semEnabled(world.envProfile)) {
    initSemState(being);
  }
  if (reservoirEnabled(world.envProfile)) {
    initReservoir(being, world.envProfile);
  }
  if (synthEnabled(world.envProfile)) {
    initSynthCounters(being);
  }
  initSymModules(being);

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
