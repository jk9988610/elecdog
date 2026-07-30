/** Phase 114 — 观察台留置 + naive 混编载入 */

import { pairReproEnabled } from '../world/pair-repro.js';

const OBSERVER_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';

/** 按田野 run（处理组 × 种子）分组 */
export function groupEntriesByRun(entries) {
  const map = new Map();
  for (const e of entries) {
    const runKey = `${e.treatmentId}:seed${e.seed}`;
    if (!map.has(runKey)) {
      map.set(runKey, {
        runKey,
        treatmentId: e.treatmentId,
        treatmentLabel: e.treatmentLabel,
        seed: e.seed,
        phase: e.phase,
        entries: [],
      });
    }
    map.get(runKey).entries.push(e);
  }
  return [...map.values()].sort((a, b) =>
    a.treatmentId.localeCompare(b.treatmentId) || a.seed - b.seed
  );
}

/** 从同一 run 取最多 maxCarry 条留置 */
export function pickRunCarryBatch(runGroup, maxCarry = 2) {
  return (runGroup?.entries ?? []).slice(0, maxCarry);
}

/** 构建观察台 naive 队列（与田野混编比例缩小） */
export function buildObserverNaiveSpecs(seed = 0, count = 4, profile = null) {
  const codes = ['001', '002', '003', '004', '005', '006'];
  const specs = [];
  const assignMorph = pairReproEnabled(profile);
  for (let i = 0; i < count; i++) {
    const code = codes[i % codes.length];
    const id = i === 0 ? `012026072901000${seed}` : null;
    const spec = {
      name: i === 0 ? '观察者' : code,
      code,
      dnaSequence: i === 0 ? OBSERVER_DNA : null,
      id,
      cohortTag: 'naive',
    };
    if (assignMorph) {
      spec.pairMorph = i % 2 === 0 ? 'A' : 'B';
    }
    specs.push(spec);
  }
  return specs;
}

export const DEFAULT_OBSERVER_NAIVE_COUNT = 4;
export const MAX_CARRY_BATCH = 2;
