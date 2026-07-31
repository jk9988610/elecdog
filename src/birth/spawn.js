// 田野统计模式 — 无诞生仪式，仅实例化个体

import { createDna, createDnaFromSequence } from '../core/dna.js';
import { generateId } from '../core/id.js';
import { Being } from '../being/being.js';
import { initOrganism } from '../world/organism.js';
import { initReplicationQuota, recordReplicationInit, replicationEnabled } from '../world/replication.js';
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
import { initSemLineage, semLineageEnabled } from '../world/sem-lineage.js';
import { initInternalTxCoupling, internalTxCouplingEnabled } from '../world/internal-tx-coupling.js';
import { initReservoir, reservoirEnabled } from '../world/reservoir.js';
import { initSynthCounters, synthEnabled } from '../world/synth.js';
import { initSymModules } from '../world/sym.js';
import { assignBeingPlace, applyPlaceBirthBias, placeEnabled } from '../world/place.js';
import { SOLAR_CHANNEL } from '../world/diurnal.js';
import { initDockedHalf, pairReproEnabled } from '../world/pair-repro.js';
import {
  assignPairMorph,
  initSubstantiveSignal,
  substantiveSignalOnly,
} from '../world/substantive-signal.js';
import { initMulticellV2, multicellV2Enabled } from '../world/multicell-v2.js';
import { upsertGenealogyFromBeing } from '../world/genealogy-persist.js';
import { assignBeingNames } from '../world/being-names.js';
import {
  chromosomeGeneticsEnabled,
  createRandomDiploid,
  diploidExpressSequence,
  derivePairMorphFromGenome,
  sequenceToDiploid,
  setSexPairForMorph,
} from '../genetics/genome.js';

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
    cohortTag = 'naive',
    pairMorph = null,
    familyName = null,
    givenName = null,
    nameIndex = null,
    genome = null,
  } = {}
) {
  const tick = world.tick;
  const profile = world.envProfile ?? {};
  let dna = dnaSequence ? createDnaFromSequence(code, dnaSequence) : createDna(code);
  const id = fixedId ?? generateId({ birthPlace: world.birthPlace, code });
  const being = new Being({ name, code, dna, id });
  being.bornAtTick = tick;
  being.cohortTag = cohortTag;

  if (chromosomeGeneticsEnabled(profile)) {
    if (genome?.pairs?.length) {
      being.genome = genome;
      dna.sequence = diploidExpressSequence(genome);
      being.dna = dna;
    } else if (dnaSequence) {
      being.genome = sequenceToDiploid(dna.sequence);
      if (pairMorph === 'A' || pairMorph === 'B') {
        setSexPairForMorph(being.genome, pairMorph);
      }
    } else {
      being.genome = createRandomDiploid(code, pairMorph === 'A' || pairMorph === 'B' ? pairMorph : null, tick);
    }
    if (!genome?.pairs?.length) {
      dna.sequence = diploidExpressSequence(being.genome);
      being.dna = dna;
    }
  }

  if (pairMorph === 'A' || pairMorph === 'B') {
    being.pairMorph = pairMorph;
  } else if (pairReproEnabled(profile)) {
    being.pairMorph = chromosomeGeneticsEnabled(profile)
      ? derivePairMorphFromGenome(being.genome ?? sequenceToDiploid(dna.sequence))
      : assignPairMorph(id);
  }
  assignBeingNames(being, {
    familyName,
    givenName,
    pairMorph: being.pairMorph,
    index: nameIndex ?? world.beings.length,
  });
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
  if (semLineageEnabled(world.envProfile)) {
    initSemLineage(being);
  }
  if (internalTxCouplingEnabled(world.envProfile)) {
    initInternalTxCoupling(being);
  }
  if (substantiveSignalOnly(world.envProfile)) {
    initSubstantiveSignal(being);
  }
  if (multicellV2Enabled(world.envProfile)) {
    initMulticellV2(being, world.envProfile);
  }
  if (reservoirEnabled(world.envProfile)) {
    initReservoir(being, world.envProfile);
  }
  if (synthEnabled(world.envProfile)) {
    initSynthCounters(being);
  }
  initSymModules(being);

  if (pairReproEnabled(world.envProfile) && being.pairMorph === 'B') {
    initDockedHalf(world, being);
  }

  if (!world.envProfile?.fieldStatMode) {
    recordReplicationInit(recorder, tick, being);
  }

  world.beings.push(being);
  upsertGenealogyFromBeing(world, being);
  return { being, id, dna };
}

/**
 * Phase 106 — 从留置快照复活（非 0 代 + 可选 ecoRepro）
 */
export function spawnCarriedBeing(world, recorder, snapshot, { cohortTag = 'carry', fixedId = null, pairMorph = null } = {}) {
  if (!snapshot?.dnaSequence) {
    throw new Error('留置快照缺少 dnaSequence');
  }
  const profile = world.envProfile ?? {};
  const morph = pairMorph ?? snapshot.pairMorph ?? null;
  const born = spawnBeing(world, recorder, {
    name: snapshot.name ?? '留置',
    code: snapshot.code ?? '001',
    dnaSequence: snapshot.dnaSequence,
    id: fixedId,
    pairMorph: morph,
    cohortTag,
  });
  const being = born.being;

  being.generation = snapshot.generation ?? 0;
  being.cohortTag = cohortTag;
  const prov = snapshot.provenance;
  being.carryProvenance = prov
    ? { ...prov, chain: prov.chain?.length ? prov.chain.map((c) => ({ ...c })) : prov.chain }
    : null;
  being.ecoRepro = snapshot.ecoRepro === true || profile.ecoFissEnabled === true;

  if (snapshot.registers?.length === being.registers.length) {
    being.registers = [...snapshot.registers];
  }
  if (snapshot.metProfile) {
    being.metProfile = snapshot.metProfile;
  }
  if (snapshot.semTrace?.length && semLineageEnabled(profile)) {
    being.semTrace = snapshot.semTrace.map((e) => ({ ...e }));
    being.semTraceWeight = snapshot.semTraceWeight ?? 0;
    being.reproTraceWeight = snapshot.reproTraceWeight ?? 0;
  }

  if (replicationEnabled(profile)) {
    const grant = profile.carryMeiRplGrant ?? 2;
    if (being.rplScope === 'subunit' && being.rplSub?.length) {
      for (const unit of being.rplSub) {
        unit.remaining = Math.min(unit.max, grant);
      }
      being.rplRemaining = being.rplSub.reduce((s, u) => s + u.remaining, 0);
    } else {
      being.rplRemaining = Math.min(being.rplMax ?? grant, grant);
    }
  }

  return born;
}

/** 观察台用仪式；田野统计用 spawn */
export function birthIntoWorld(world, recorder, opts) {
  if (world.envProfile?.fieldStatMode) {
    return spawnBeing(world, recorder, opts);
  }
  return performBirthRitual(world, recorder, opts);
}
