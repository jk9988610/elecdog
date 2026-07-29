// 公理: A6 — 诞生仪式；只记录事实，不解释

import { createDna, createDnaFromSequence } from '../core/dna.js';
import { generateId } from '../core/id.js';
import { Being } from '../being/being.js';
import { initOrganism } from '../world/organism.js';
import { initReplicationQuota, recordReplicationInit } from '../world/replication.js';

export function performBirthRitual(
  world,
  recorder,
  { name = '小狗', code = '001', dnaSequence = null, id: fixedId = null } = {}
) {
  const tick = world.tick;
  const steps = [];

  steps.push(recorder.ritual(tick, '[RITUAL] 启始'));

  steps.push(
    recorder.ritual(tick, `[RITUAL] 地点注册 ${world.birthPlace}`, {
      birthPlace: world.birthPlace,
    })
  );

  steps.push(recorder.ritual(tick, `[RITUAL] 代号载入 ${code}`, { code }));

  const dna = dnaSequence ? createDnaFromSequence(code, dnaSequence) : createDna(code);
  steps.push(
    recorder.ritual(tick, `[RITUAL] DNA 原文 ${dna.sequence}`, {
      dna,
    })
  );

  const id = fixedId ?? generateId({ birthPlace: world.birthPlace, code });
  steps.push(recorder.ritual(tick, `[RITUAL] 身份证 ${id}`, { id }));

  const being = new Being({ name, code, dna, id });
  being.bornAtTick = tick;
  const organismType = initOrganism(being, world.envProfile);
  steps.push(
    recorder.ritual(tick, `[RITUAL] 社会位 ${being.socialSlot}`, {
      beingId: id,
      socialSlot: being.socialSlot,
    })
  );
  if (organismType === 'multicell') {
    steps.push(
      recorder.ritual(tick, `[RITUAL] 子域 ${being.subCells.length} 单元`, {
        beingId: id,
        organismType,
        subCells: being.subCells.map((sc) => ({ id: sc.id, role: sc.role })),
      })
    );
    recorder.cell(
      tick,
      id,
      `[ORG] multicell subs ${being.subCells.map((sc) => sc.id).join(' ')}`,
      {
        kind: 'ORG',
        organismType,
        subCount: being.subCells.length,
      }
    );
  } else {
    recorder.cell(tick, id, `[ORG] unicell domain e${being.cellBoundary.join(' e')}`, {
      kind: 'ORG',
      organismType: 'unicell',
      boundary: being.cellBoundary,
    });
  }

  initReplicationQuota(being, world.envProfile);
  recordReplicationInit(recorder, tick, being);

  const pulse = being.firstPulse();
  recorder.internal(tick, id, pulse);
  steps.push(
    recorder.ritual(tick, `[RITUAL] 意识脉冲 ${pulse.join(' ')}`, {
      beingId: id,
    })
  );

  world.beings.push(being);
  steps.push(recorder.ritual(tick, '[RITUAL] 完成', { beingId: id }));

  recorder.system(tick, `个体 ${name}（${code}）进入世界`, { beingId: id });

  return { being, steps, dna, id };
}
