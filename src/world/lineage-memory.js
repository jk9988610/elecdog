// W4 谱系记忆回响 — 亲代 mem 摘要经 [MEM-LIN] 传递，与 W1 闭环联动

import { memoryFeedbackEnabled } from './memory-feedback.js';

export function memLineageEchoEnabled(profile) {
  return profile?.memLineageEchoEnabled === true;
}

export function summarizeMemLoads(being) {
  return {
    rx: +(being.memRxLoad ?? 0).toFixed(4),
    tx: +(being.memTxLoad ?? 0).toFixed(4),
    act: +(being.memActLoad ?? 0).toFixed(4),
  };
}

/** 谱系/分裂时亲代记忆负载 → 子代初始 mem 态（EHU-LIN 式） */
export function applyMemLineageEcho(
  world,
  recorder,
  child,
  parents,
  profile,
  { via = 'LINEAGE' } = {}
) {
  if (!memLineageEchoEnabled(profile) || !memoryFeedbackEnabled(profile)) return null;
  const list = parents.filter(Boolean);
  if (!list.length) return null;

  const blend = profile?.memLineageEchoBlend ?? 0.55;
  const avgRx = list.reduce((s, p) => s + (p.memRxLoad ?? 0), 0) / list.length;
  const avgTx = list.reduce((s, p) => s + (p.memTxLoad ?? 0), 0) / list.length;
  const avgAct = list.reduce((s, p) => s + (p.memActLoad ?? 0), 0) / list.length;

  child.memRxLoad = Math.min(1, +(avgRx * blend).toFixed(4));
  child.memTxLoad = Math.min(1, +(avgTx * blend).toFixed(4));
  child.memActLoad = Math.min(1, +(avgAct * blend).toFixed(4));
  child.memEchoVia = via;
  child.memEchoRx = child.memRxLoad;
  child.memEchoTx = child.memTxLoad;
  child.memEchoAct = child.memActLoad;
  child.memLinCount = (child.memLinCount ?? 0) + 1;

  const payload = {
    kind: 'MEM-LIN',
    via,
    echoRx: child.memRxLoad,
    echoTx: child.memTxLoad,
    echoAct: child.memActLoad,
    parentIds: list.map((p) => p.id),
  };

  if (!profile.fieldStatMode) {
    recorder.evolution(
      world.tick,
      child.id,
      `[MEM-LIN] ${via} rx${child.memRxLoad} tx${child.memTxLoad} act${child.memActLoad}`,
      payload
    );
  } else {
    recorder.evolution(world.tick, child.id, `[MEM-LIN] ${via}`, payload);
  }

  return payload;
}

export function memLineageSnapshot(being) {
  return {
    echoRx: +(being.memEchoRx ?? 0).toFixed(4),
    echoTx: +(being.memEchoTx ?? 0).toFixed(4),
    echoAct: +(being.memEchoAct ?? 0).toFixed(4),
    via: being.memEchoVia,
    linCount: being.memLinCount ?? 0,
    current: summarizeMemLoads(being),
  };
}
