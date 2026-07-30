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

export function semFourDomainCoupleEnabled(profile) {
  return semDomainTagEnabled(profile) && profile?.semFourDomainCouple === true;
}

export const FOUR_DOMAINS = [SEM_DOMAIN_YI, SEM_DOMAIN_SHI, SEM_DOMAIN_ZHU, SEM_DOMAIN_XING];

export function coreRDomainActive(being, world, profile) {
  if (!semDomainTagEnabled(profile)) return false;
  const window = profile?.semDomainWindow ?? profile?.semReproWindow ?? 48;
  const tick = world.tick;
  return tick - (being.semDomainTicks?.[SEM_DOMAIN_CORE] ?? -Infinity) <= window;
}

export function activeFourDomains(being, world, profile) {
  if (!semDomainTagEnabled(profile)) return [];
  const window = profile?.semDomainWindow ?? profile?.semReproWindow ?? 48;
  const tick = world.tick;
  const stamps = being.semDomainTicks ?? {};
  return FOUR_DOMAINS.filter((d) => tick - (stamps[d] ?? -Infinity) <= window);
}

export function noteFourDomainCouple(being, world, profile) {
  if (!semFourDomainCoupleEnabled(profile) || !coreRDomainActive(being, world, profile)) return [];
  const active = activeFourDomains(being, world, profile);
  if (!active.length) return [];
  if (!being.semFourDomainCoupleTally) being.semFourDomainCoupleTally = {};
  for (const d of active) {
    being.semFourDomainCoupleTally[d] = (being.semFourDomainCoupleTally[d] ?? 0) + 1;
  }
  being.semCoreRFourCouplePairs = (being.semCoreRFourCouplePairs ?? 0) + 1;
  return active;
}

export function fourDomainCoupleCountsFromBeings(beings) {
  const counts = { YI: 0, SHI: 0, ZHU: 0, XING: 0, couplePairs: 0 };
  for (const being of beings) {
    const tally = being.semFourDomainCoupleTally ?? {};
    for (const d of FOUR_DOMAINS) counts[d] += tally[d] ?? 0;
    counts.couplePairs += being.semCoreRFourCouplePairs ?? 0;
  }
  return counts;
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

/** 田野分析：按配对形成时的域戳累计归因 */
export function semDomainCountsFromBeings(beings, profile) {
  const counts = { 'CORE-R': 0, YI: 0, SHI: 0, ZHU: 0, XING: 0, untagged: 0 };
  const domainTag = semDomainTagEnabled(profile);
  for (const being of beings) {
    if (!domainTag) {
      counts.untagged += being.semPairTally ?? 0;
      continue;
    }
    const tally = being.semDomainPairTally ?? {};
    for (const [domain, n] of Object.entries(tally)) {
      if (counts[domain] != null) counts[domain] += n;
    }
    const tagged = Object.values(tally).reduce((a, b) => a + b, 0);
    const untagged = (being.semPairTally ?? 0) - tagged;
    if (untagged > 0) counts.untagged += untagged;
  }
  return counts;
}
