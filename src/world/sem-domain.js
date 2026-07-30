// WL-R1 — [SEM] 繁殖核 / 四域标记（YI SHI ZHU XING CORE-R）

import { semEnabled } from './sem.js';

export const SEM_DOMAIN_CORE = 'CORE-R';
export const SEM_DOMAIN_YI = 'YI';
export const SEM_DOMAIN_SHI = 'SHI';
export const SEM_DOMAIN_ZHU = 'ZHU';
export const SEM_DOMAIN_XING = 'XING';

const KIND_TO_DOMAIN = {
  MEI: SEM_DOMAIN_CORE,
  DCK: SEM_DOMAIN_CORE,
  PRQ: SEM_DOMAIN_CORE,
  PGR: SEM_DOMAIN_CORE,
  'FUS-IN': SEM_DOMAIN_CORE,
  FLD: SEM_DOMAIN_CORE,
  'FLD-CH': SEM_DOMAIN_CORE,
  'FLD-IN': SEM_DOMAIN_CORE,
  'FLD-CH-IN': SEM_DOMAIN_CORE,
  EXP: SEM_DOMAIN_CORE,
  HRM: SEM_DOMAIN_CORE,
  EMB: SEM_DOMAIN_CORE,
  NUR: SEM_DOMAIN_ZHU,
  CEL: SEM_DOMAIN_YI,
  MBR: SEM_DOMAIN_YI,
  ORG: SEM_DOMAIN_YI,
  INTRA: SEM_DOMAIN_YI,
  DRW: SEM_DOMAIN_SHI,
  LOW: SEM_DOMAIN_SHI,
};

const DOMAIN_PRIORITY = [
  SEM_DOMAIN_CORE,
  SEM_DOMAIN_ZHU,
  SEM_DOMAIN_SHI,
  SEM_DOMAIN_YI,
  SEM_DOMAIN_XING,
];

export function semDomainTagEnabled(profile) {
  return semEnabled(profile) && profile?.semDomainTag === true;
}

export function markSemDomain(being, domain, tick) {
  if (!being || !domain) return;
  if (!being.semDomainTicks) being.semDomainTicks = {};
  being.semDomainTicks[domain] = tick;
}

export function noteSemDomainFromKind(being, kind, tick) {
  const domain = KIND_TO_DOMAIN[kind];
  if (domain) markSemDomain(being, domain, tick);
}

/** tick 内代谢/行为 → 四域痕迹 */
export function noteSemDomainFromTick(being, world, profile, ctx = {}) {
  if (!semDomainTagEnabled(profile)) return;
  const tick = world.tick;
  if (ctx.hadDraw) markSemDomain(being, SEM_DOMAIN_SHI, tick);
  if (ctx.hadLow) markSemDomain(being, SEM_DOMAIN_SHI, tick);
  if (ctx.hadAct) markSemDomain(being, SEM_DOMAIN_XING, tick);
  if (ctx.hadCrossBoundary || ctx.lowIntegrity) markSemDomain(being, SEM_DOMAIN_YI, tick);
  if (ctx.hadIntra) markSemDomain(being, SEM_DOMAIN_YI, tick);
  if (being.independent === false) markSemDomain(being, SEM_DOMAIN_ZHU, tick);
  if (being.syncyte) markSemDomain(being, SEM_DOMAIN_CORE, tick);
}

export function resolveSemDomain(being, world, profile) {
  if (!semDomainTagEnabled(profile)) return null;
  const window = profile?.semDomainWindow ?? profile?.semReproWindow ?? 24;
  const tick = world.tick;
  const stamps = being.semDomainTicks ?? {};
  const active = DOMAIN_PRIORITY.filter((d) => tick - (stamps[d] ?? -Infinity) <= window);
  return active[0] ?? null;
}

export function semDomainCountsFromRecorder(recorder) {
  const counts = { 'CORE-R': 0, YI: 0, SHI: 0, ZHU: 0, XING: 0, untagged: 0 };
  for (const e of recorder.entries ?? []) {
    if (e.channel !== 'evolution' || e.meta?.kind !== 'SEM') continue;
    const d = e.meta.domain;
    if (d && counts[d] != null) counts[d] += 1;
    else counts.untagged += 1;
  }
  return counts;
}
