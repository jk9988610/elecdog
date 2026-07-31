// 公理: A6 — 诞生仪式；只记录事实，不解释（观察台专用）

import { spawnBeing } from './spawn.js';

export function performBirthRitual(world, recorder, opts = {}) {
  const {
    name = '小狗',
    code = '001',
    dnaSequence = null,
    id: fixedId = null,
    pairMorph = null,
    genome = null,
    ...spawnRest
  } = opts;
  const tick = world.tick;
  const steps = [];

  steps.push(recorder.ritual(tick, '[RITUAL] 启始'));
  steps.push(
    recorder.ritual(tick, `[RITUAL] 地点注册 ${world.birthPlace}`, {
      birthPlace: world.birthPlace,
    })
  );
  steps.push(recorder.ritual(tick, `[RITUAL] 代号载入 ${code}`, { code }));

  const { being, dna, id } = spawnBeing(world, recorder, {
    name,
    code,
    dnaSequence,
    id: fixedId,
    pairMorph,
    genome,
    ...spawnRest,
  });

  steps.push(
    recorder.ritual(tick, `[RITUAL] DNA 原文 ${dna.sequence}`, { dna })
  );
  steps.push(recorder.ritual(tick, `[RITUAL] 身份证 ${id}`, { id }));
  steps.push(
    recorder.ritual(tick, `[RITUAL] 社会位 ${being.socialSlot}`, {
      beingId: id,
      socialSlot: being.socialSlot,
    })
  );

  if (being.organismType === 'multicell') {
    steps.push(
      recorder.ritual(tick, `[RITUAL] 子域 ${being.subCells.length} 单元`, {
        beingId: id,
        organismType: being.organismType,
        subCells: being.subCells.map((sc) => ({ id: sc.id, role: sc.role })),
      })
    );
    recorder.cell(
      tick,
      id,
      `[ORG] multicell subs ${being.subCells.map((sc) => sc.id).join(' ')}`,
      { kind: 'ORG', organismType: 'multicell', subCount: being.subCells.length }
    );
  } else {
    recorder.cell(tick, id, `[ORG] unicell domain e${being.cellBoundary.join(' e')}`, {
      kind: 'ORG',
      organismType: 'unicell',
      boundary: being.cellBoundary,
    });
  }

  const pulse = being.firstPulse();
  recorder.internal(tick, id, pulse);
  steps.push(
    recorder.ritual(tick, `[RITUAL] 意识脉冲 ${pulse.join(' ')}`, { beingId: id })
  );

  steps.push(recorder.ritual(tick, '[RITUAL] 完成', { beingId: id }));
  recorder.system(tick, `个体 ${name}（${code}）进入世界`, { beingId: id });

  return { being, steps, dna, id };
}
