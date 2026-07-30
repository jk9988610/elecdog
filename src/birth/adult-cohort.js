// 断奶后成体队列 — 观察台默认 4 雄 4 雌

import { hashString } from '../core/hash.js';
import { reduceDna } from '../core/dna.js';
import { spawnBeing } from './spawn.js';
import {
  resolveDevStage,
  resolveLifeStage,
  freezeStemPool,
} from '../world/multicell-v2.js';
import { initAdultMatingStructures } from '../world/body-structures.js';
import {
  annotatePairHalfMetadata,
  initDockedHalf,
} from '../world/pair-repro.js';

export function initAdultWeanedBeing(being, world, profile) {
  const juv = profile?.juvenileTicks ?? 96;
  being.tickCount = juv + 16;
  being.independent = true;
  being.weaned = true;
  resolveDevStage(being, world, profile);
  resolveLifeStage(being, world, profile);
  if (being.stemPoolFrozen) {
    freezeStemPool(being, world.tick);
  }
  initAdultMatingStructures(being, profile, world.tick ?? 0);
  if (being.pairMorph === 'A') {
    const seed = hashString(`${being.id}:adult-sperm`);
    being.meiPacket = {
      seq: reduceDna(being.dna.sequence, seed),
      atTick: world.tick ?? 0,
      adultSeed: true,
    };
    annotatePairHalfMetadata(being, profile);
  } else if (being.pairMorph === 'B') {
    initDockedHalf(world, being);
    annotatePairHalfMetadata(being, profile);
  }
  return being;
}

/** 默认 4 男（A）+ 4 女（B）断奶成体 */
export function spawnAdultMulticellCohort(world, recorder, { males = 4, females = 4 } = {}) {
  const profile = world.envProfile ?? {};
  const out = [];
  for (let i = 0; i < males; i++) {
    const { being } = spawnBeing(world, recorder, {
      name: `雄${i + 1}`,
      code: `M${String(i + 1).padStart(2, '0')}`,
      pairMorph: 'A',
      cohortTag: 'adult',
    });
    initAdultWeanedBeing(being, world, profile);
    out.push(being);
  }
  for (let i = 0; i < females; i++) {
    const { being } = spawnBeing(world, recorder, {
      name: `雌${i + 1}`,
      code: `F${String(i + 1).padStart(2, '0')}`,
      pairMorph: 'B',
      cohortTag: 'adult',
    });
    initAdultWeanedBeing(being, world, profile);
    out.push(being);
  }
  return out;
}
