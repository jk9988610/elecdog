// 谱系续行 — 存续终止后变异诞生

import { hashString } from '../core/hash.js';
import { mutate } from '../core/dna.js';
import { performBirthRitual } from '../birth/ritual.js';

export function spawnLineageOffspring(world, recorder, parent) {
  const seed = hashString(`${parent.id}:${world.tick}:offspring`);
  const { seq, mutationCount } = mutate(parent.dna.sequence, 0.03, seed);
  const born = performBirthRitual(world, recorder, {
    name: `${parent.name.slice(0, 6)}嗣`,
    code: parent.code,
    dnaSequence: seq,
  });
  born.being.generation = (parent.generation || 0) + 1;
  born.being.lineageParent = parent.id;
  recorder.system(world.tick, `[LINEAGE] 代 ${born.being.generation} 变异位 ${mutationCount}`, {
    parentId: parent.id,
    childId: born.id,
    mutationCount,
    generation: born.being.generation,
  });
  return born;
}
