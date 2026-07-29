// 谱系续行 — 存续终止后变异诞生

import { hashString } from '../core/hash.js';
import { mutate } from '../core/dna.js';
import { birthIntoWorld } from '../birth/spawn.js';
import { applyNurtureAtBirth } from './nurture.js';
import { applyLineageReplication } from './replication.js';
import { recordReproductionPathEvent, reproductionProfileEnabled } from './reproduction-profile.js';

export function spawnLineageOffspring(world, recorder, parent) {
  const seed = hashString(`${parent.id}:${world.tick}:offspring`);
  const { seq, mutationCount } = mutate(parent.dna.sequence, 0.03, seed);
  const born = birthIntoWorld(world, recorder, {
    name: `${parent.name.slice(0, 6)}嗣`,
    code: parent.code,
    dnaSequence: seq,
  });
  born.being.generation = (parent.generation || 0) + 1;
  born.being.lineageParent = parent.id;
  if (reproductionProfileEnabled(world.envProfile)) {
    recordReproductionPathEvent(parent, 'LINEAGE_PARENT');
  }
  applyLineageReplication(world, recorder, born.being);
  const nurture = applyNurtureAtBirth(world, parent, born.being);
  recorder.system(world.tick, `[LINEAGE] 代 ${born.being.generation} 变异位 ${mutationCount}`, {
    parentId: parent.id,
    childId: born.id,
    mutationCount,
    generation: born.being.generation,
    reproMode: nurture.mode,
    nurtureReserve: nurture.reserveSum ?? null,
  });
  if (nurture.mode === 'nursed') {
    recorder.metabolism(
      world.tick,
      born.id,
      `[NUR] seed ${nurture.reserveSum} ticks ${nurture.nurtureTicks} parent ${parent.id}`,
      {
        kind: 'NUR',
        phase: 'seed',
        parentId: parent.id,
        reserveSum: nurture.reserveSum,
        nurtureTicks: nurture.nurtureTicks,
      }
    );
  }
  return born;
}
