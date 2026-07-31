#!/usr/bin/env node
/** 染色体遗传 — 减数分裂、受精、性染色体 morph */
import { createWorld } from '../src/world/world.js';
import { applyEnvProfile, initEnvStackModules } from '../src/world/env-profile.js';
import { Recorder } from '../src/recorder/logger.js';
import { spawnAdultMulticellCohort } from '../src/birth/adult-cohort.js';
import {
  meiosis,
  fertilize,
  derivePairMorphFromGenome,
  isSexYChromosome,
  SEX_PAIR_INDEX,
  produceGamete,
  diploidExpressSequence,
} from '../src/genetics/genome.js';
import { genomeDisplayRows, haploidDisplayRows } from '../src/genetics/genome-display.js';
import { renderBeingDetailHTML } from '../src/ui/genealogy-tree.js';
import {
  createSyncyteOnB,
  processPairGestation,
  registerPairSpeechPRQ,
  registerPairSpeechPGR,
} from '../src/world/pair-repro.js';
import { STR_PAIR_IN, STR_PAIR_OUT, initAdultMatingStructures } from '../src/world/body-structures.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    failed += 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

function pinChannels(being, code, ch) {
  const st = being?.bodyStructures?.[code];
  if (st) st.channels = [ch];
}

const world = createWorld('M-CHR');
applyEnvProfile(world, 'multicell_v2_world');
initEnvStackModules(world);
const recorder = new Recorder();

const cohort = spawnAdultMulticellCohort(world, recorder, { males: 2, females: 2 });
assert(cohort.every((b) => b.genome?.pairs?.length === 12), '成体均有 12 对染色体');
assert(
  cohort.filter((b) => b.pairMorph === 'A').every((b) => !isSexYChromosome(b.genome.pairs[SEX_PAIR_INDEX].maternal)),
  '雄体母源性染色体非 Y'
);
assert(
  cohort.filter((b) => b.pairMorph === 'A').every((b) => isSexYChromosome(b.genome.pairs[SEX_PAIR_INDEX].paternal)),
  '雄体父源性染色体为 Y'
);
assert(
  cohort.filter((b) => b.pairMorph === 'B').every(
    (b) =>
      !isSexYChromosome(b.genome.pairs[SEX_PAIR_INDEX].maternal) &&
      !isSexYChromosome(b.genome.pairs[SEX_PAIR_INDEX].paternal)
  ),
  '雌体性染色体均为 X'
);

const male = cohort.find((b) => b.pairMorph === 'A');
const female = cohort.find((b) => b.pairMorph === 'B');
const sperm = produceGamete(male, world.envProfile, 42);
const egg = produceGamete(female, world.envProfile, 43);
assert(sperm.haploid?.length === 12, '精子单倍体 12 条');
assert(egg.haploid?.length === 12, '卵子单倍体 12 条');
const zyg = fertilize(egg.haploid, sperm.haploid);
assert(derivePairMorphFromGenome(zyg) === 'A' || derivePairMorphFromGenome(zyg) === 'B', '合子 morph 可派生');

const genome = male.genome;
const hap1 = meiosis(genome, 1);
const hap2 = meiosis(genome, 2);
assert(hap1.join('') !== hap2.join('') || genome.pairs.every((p) => p.maternal === p.paternal), '减数分裂可产生不同单倍型');

initAdultMatingStructures(male, world.envProfile, 0);
initAdultMatingStructures(female, world.envProfile, 0);
pinChannels(male, STR_PAIR_OUT, 7);
pinChannels(female, STR_PAIR_IN, 7);
world.courtshipGraceUntilTick = 0;
male.courtshipEligibleAtTick = 0;
female.courtshipEligibleAtTick = 0;
male.partnerFusEligibleAtTick = 0;
female.partnerFusEligibleAtTick = 0;
registerPairSpeechPRQ(world, recorder, male, female.id);
registerPairSpeechPGR(world, recorder, female, male.id);
male.partnerId = female.id;
female.partnerId = male.id;
male.meiPacket = produceGamete(male, world.envProfile, 99);
female.dockedHalf = produceGamete(female, world.envProfile, 100);
const syncyte = createSyncyteOnB(world, recorder, male, female, male.meiPacket.seq, female.dockedHalf.seq);
assert(syncyte?.genome?.pairs?.length === 12, 'syncyte 有二倍体 genome');
female.syncyte.gestationUntilTick = world.tick;
const gest = processPairGestation(world, recorder);
assert(gest.length > 0, '外排');
const child = world.beings.find((b) => b.id === gest[0].childId);
assert(child?.genome?.pairs?.length === 12, '子代有二倍体 genome');
assert(child.pairMorph === derivePairMorphFromGenome(child.genome), '子代 morph 与性染色体一致');
assert(child.dna.sequence === diploidExpressSequence(child.genome), '子代表达串与 genome 一致');

const genomeRows = genomeDisplayRows(male.genome);
assert(genomeRows.length === 12, '展示行 12 对');
assert(genomeRows[SEX_PAIR_INDEX].isSexPair, '性染色体对标记');
const spermRows = haploidDisplayRows(sperm.haploid);
assert(spermRows.length === 12, '精子单倍体展示 12 条');
const detailHtml = renderBeingDetailHTML(male, female, world.envProfile, world);
assert(detailHtml.includes('染色体二倍体'), '详情含染色体表');
assert(detailHtml.includes(genomeRows[0].maternal), '详情含母源染色体');

if (failed) {
  console.error(`observer-chromosome-genetics-verify: ${failed} failed`);
  process.exit(1);
}
console.log('observer-chromosome-genetics-verify: all passed');
