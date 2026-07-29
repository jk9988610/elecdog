/**
 * 观察台环境选择 — 复用 env-profile，默认 baseline
 */

import { ENV_PROFILES } from '../world/env-profile.js';
import { isAnalogyMode } from './analogy.js';

const LS_ENV = 'elecdog-env-profile';

/** 观察台可选环境（田野配置子集） */
export const OBSERVER_ENV_IDS = [
  'baseline',
  'fertile_field',
  'fertile_field_open',
  'fertile_field_strict',
  'fertile_inert',
  'harsh_combined',
];

const ANALOGY_LABELS = {
  baseline: '基线（现行）',
  fertile_field: '富足分裂场（有复制上限）',
  fertile_field_open: '富足分裂场（无复制上限）',
  fertile_field_strict: '富足场（复制耗尽即终止）',
  fertile_inert: '富足场（无分裂门）',
  harsh_combined: '组合高压（死亡续行）',
};

export function isObserverEnvId(id) {
  return OBSERVER_ENV_IDS.includes(id);
}

export function getObserverEnvId() {
  try {
    const v = localStorage.getItem(LS_ENV);
    if (isObserverEnvId(v)) return v;
  } catch {
    /* ignore */
  }
  return 'baseline';
}

export function setObserverEnvId(id) {
  if (!isObserverEnvId(id)) {
    throw new Error('无效观察台环境');
  }
  localStorage.setItem(LS_ENV, id);
}

export function observerEnvLabel(id) {
  const profile = ENV_PROFILES[id];
  if (!profile) return id;
  if (isAnalogyMode() && ANALOGY_LABELS[id]) return ANALOGY_LABELS[id];
  return profile.label;
}

export function observerEnvHint(id) {
  const hints = {
    baseline: '默认规则；剧变脉冲；无存活分裂',
    fertile_field: '富足场 + [FISS]；DNA [RPL] 复制次数上限',
    fertile_field_open: '富足场 + [FISS]；无 [RPL] 上限（Phase 36 对照）',
    fertile_field_strict: '富足场 + [RPL] 耗尽或 tick 顶 → [END]',
    fertile_inert: '同等富足基底，fissionEnabled 关闭（对照）',
    harsh_combined: '耗竭 + 脉冲 + 幼体脆弱；[END]→[LINEAGE] 高周转',
  };
  return hints[id] ?? '';
}
