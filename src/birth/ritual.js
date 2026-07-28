// 公理: A6 — 诞生仪式；只记录事实，不解释

import { createDna } from '../core/dna.js';
import { generateId } from '../core/id.js';
import { Being } from '../being/being.js';

export function performBirthRitual(world, recorder, { name = '小狗', code = '001' } = {}) {
  const tick = world.tick;
  const steps = [];

  steps.push(recorder.ritual(tick, '[RITUAL] 启始'));

  steps.push(
    recorder.ritual(tick, `[RITUAL] 地点注册 ${world.birthPlace}`, {
      birthPlace: world.birthPlace,
    })
  );

  steps.push(recorder.ritual(tick, `[RITUAL] 代号载入 ${code}`, { code }));

  const dna = createDna(code);
  steps.push(
    recorder.ritual(tick, `[RITUAL] DNA 原文 ${dna.sequence}`, {
      dna,
    })
  );

  const id = generateId({ birthPlace: world.birthPlace, code });
  steps.push(recorder.ritual(tick, `[RITUAL] 身份证 ${id}`, { id }));

  const being = new Being({ name, code, dna, id });
  being.bornAtTick = tick;

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
