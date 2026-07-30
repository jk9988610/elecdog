// 断奶后成体队列 — 观察台默认 4 雄 4 雌（无血缘、满格逻辑细胞）

import { hashString } from '../core/hash.js';
import { reduceDna } from '../core/dna.js';
import { spawnBeing } from './spawn.js';
import {
  resolveDevStage,
  resolveLifeStage,
  freezeStemPool,
  fillAdultLogicCellsToMax,
} from '../world/multicell-v2.js';
import {
  annotatePairHalfMetadata,
  initDockedHalf,
} from '../world/pair-repro.js';
import {
  initAdultMatingStructures,
  STR_PAIR_IN,
  STR_PAIR_OUT,
} from '../world/body-structures.js';
import { issueAdultHealthReport } from '../world/health-report.js';
import { cohortKinBlocked } from '../world/kinship-gate.js';

const COHORT_MATE_CHANNEL = 7;

export function pinMatingStructureChannel(being, structCode, channel) {
  const st = being?.bodyStructures?.[structCode];
  if (st) {
    st.channels = [channel];
    st.channelIdx = channel;
  }
}

export function initAdultWeanedBeing(being, world, profile) {
  const juv = profile?.juvenileTicks ?? 96;
  being.tickCount = juv + 16;
  being.independent = true;
  being.weaned = true;
  being.registers = being.registers.map((v) => Math.max(v, 0.58));
  resolveDevStage(being, world, profile);
  resolveLifeStage(being, world, profile);
  fillAdultLogicCellsToMax(being, world, profile, { bypassEnvGate: true });
  if (being.stemPoolFrozen) {
    freezeStemPool(being, world.tick);
  }
  initAdultMatingStructures(being, profile, world.tick ?? 0);
  issueAdultHealthReport(being, world.tick ?? 0);
  if (being.pairMorph === 'A') {
    pinMatingStructureChannel(being, STR_PAIR_OUT, COHORT_MATE_CHANNEL);
    const seed = hashString(`${being.id}:adult-sperm`);
    being.meiPacket = {
      seq: reduceDna(being.dna.sequence, seed),
      atTick: world.tick ?? 0,
      adultSeed: true,
    };
    annotatePairHalfMetadata(being, profile);
  } else if (being.pairMorph === 'B') {
    pinMatingStructureChannel(being, STR_PAIR_IN, COHORT_MATE_CHANNEL);
    initDockedHalf(world, being);
    annotatePairHalfMetadata(being, profile);
  }
  return being;
}

function assertCohortNoKin(cohort, profile) {
  for (let i = 0; i < cohort.length; i++) {
    for (let j = i + 1; j < cohort.length; j++) {
      if (cohortKinBlocked(cohort[i], cohort[j], profile)) {
        throw new Error(`cohort kin blocked: ${cohort[i].code} vs ${cohort[j].code}`);
      }
    }
  }
}

/** 默认 4 男（A）+ 4 女（B）断奶成体，DNA 无近亲、逻辑细胞满格 */
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
  assertCohortNoKin(out, profile);
  return out;
}
