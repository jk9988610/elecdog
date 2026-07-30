// 体检报告 — 出生签发；成体性成熟时覆盖更新

import {
  dnaFingerprint,
  dnaSequenceSimilarity,
  isDnaKinBlocked,
  isFullSibling,
  isHalfSibling,
  isParentChildId,
  kinshipRelationLabel,
} from '../genetics/dna-kinship.js';
import { interpretFullDna } from '../genetics/dna-interpret.js';
import { HORMONE_KEYS, hormoneActivityMult } from './hormone-system.js';
import { assessCellIntegrity } from './cell.js';
import { assessStress } from './viability.js';
import { STR_PAIR_IN, STR_PAIR_OUT } from './body-structures.js';

const HORMONE_LABELS = {
  h0: '生殖',
  h1: '泌乳',
  h2: '代谢',
  h3: '应激',
  h4: '生长',
};

export const HORMONE_NORMAL_HINT = {
  h0: { min: 0.08, max: 0.35 },
  h1: { min: 0.05, max: 0.25 },
  h2: { min: 0.1, max: 0.4 },
  h3: { min: 0.04, max: 0.2 },
  h4: { min: 0.06, max: 0.3 },
};

export function formatHormoneValueLine(hormone) {
  const hint = HORMONE_NORMAL_HINT[hormone?.key];
  if (!hint) return `${hormone?.value ?? 0}`;
  return `${Number(hormone.value).toFixed(3)}（正常 ${hint.min.toFixed(2)}–${hint.max.toFixed(2)}）`;
}

function round4(n) {
  return +Number(n).toFixed(4);
}

function registerMean(being) {
  const r = being?.registers ?? [];
  if (!r.length) return 0;
  return round4(r.reduce((a, b) => a + b, 0) / r.length);
}

function channelRegister(being, channelIdx) {
  if (channelIdx == null) return registerMean(being);
  return round4(being.registers?.[channelIdx] ?? 0);
}

function substrateMean(world) {
  const ch = world?.substrate?.channels ?? [];
  if (!ch.length) return 0;
  return round4(ch.reduce((a, b) => a + b, 0) / ch.length);
}

export function buildHormoneVitals(being) {
  const vec = being?.hormoneVec ?? {};
  return HORMONE_KEYS.map((k) => {
    const value = vec[k] ?? 0;
    return {
      key: k,
      label: HORMONE_LABELS[k] ?? k,
      value: round4(value),
      pct: Math.round(Math.max(0, Math.min(1, value)) * 100),
    };
  });
}

export function buildNutritionVitals(being, world) {
  const mean = registerMean(being);
  const subMean = substrateMean(world);
  const stress = world?.substrate?.channels
    ? assessStress(being.registers ?? [], world.substrate.channels)
    : null;
  return {
    metProfile: being?.metProfile ?? 'N0',
    registerMean: mean,
    nutrientReserve: mean,
    substrateMean: subMean,
    energyBalance: round4(mean - subMean * 0.35),
    metDominantIdx: being?.metDominantIdx ?? null,
    metDrawTotal: being?.metDrawTotal ?? 0,
    stress: stress != null ? round4(stress) : null,
    integrity:
      world?.substrate?.channels
        ? round4(assessCellIntegrity(being, world.substrate.channels))
        : null,
    lowStreak: being?.lowStreak ?? 0,
    stressStreak: being?.stressStreak ?? 0,
  };
}

export function buildMaleSpermVitals(being, world, profile) {
  const pairOut = being?.bodyStructures?.[STR_PAIR_OUT];
  const ch = pairOut?.channelIdx ?? pairOut?.channels?.[0] ?? being?.cohortMateChannel ?? 7;
  const mei = being?.meiPacket;
  const gonMult = hormoneActivityMult(being, 'LOG-GON');
  const channelEnergy = channelRegister(being, ch);
  const payloadFrac = mei?.seq?.length ? Math.min(1, mei.seq.length / 96) : 0;
  const gonFrac = Math.min(1, gonMult / 2.2);
  const vitality = round4(0.42 * channelEnergy + 0.33 * payloadFrac + 0.25 * gonFrac);
  const motility = round4(channelEnergy * gonFrac);
  return {
    stocked: Boolean(mei?.seq),
    packetLen: mei?.seq?.length ?? 0,
    activity: vitality,
    vitality,
    motility,
    concentration: payloadFrac,
    gonadMult: round4(gonMult),
    channelEnergy,
    mateChannel: ch,
    structureOpen: Boolean(pairOut?.open),
    grantFrom: being?.pairGrantFrom ?? null,
    logicGon: being?.logicCells?.['LOG-GON']?.length ?? 0,
  };
}

export function buildFemaleEggVitals(being, world, profile) {
  const pairIn = being?.bodyStructures?.[STR_PAIR_IN];
  const ch = pairIn?.channelIdx ?? pairIn?.channels?.[0] ?? being?.cohortMateChannel ?? 7;
  const dock = being?.dockedHalf;
  const gonMult = hormoneActivityMult(being, 'LOG-GON');
  const channelEnergy = channelRegister(being, ch);
  const payloadFrac = dock?.seq?.length ? Math.min(1, dock.seq.length / 96) : 0;
  const gonFrac = Math.min(1, gonMult / 2.2);
  const quality = round4(0.45 * channelEnergy + 0.35 * payloadFrac + 0.2 * gonFrac);
  const receptivity = quality;
  const viability = round4(channelEnergy * payloadFrac);
  return {
    stocked: Boolean(dock?.seq),
    halfLen: dock?.seq?.length ?? 0,
    oocyteQuality: quality,
    receptivity,
    viability,
    maturity: payloadFrac,
    gonadMult: round4(gonMult),
    channelEnergy,
    mateChannel: ch,
    structureOpen: Boolean(pairIn?.open),
    pregnancyClosed: Boolean(pairIn?.pregnancyClosed),
    logicGon: being?.logicCells?.['LOG-GON']?.length ?? 0,
  };
}

export function buildHealthVitals(being, world, profile, { adult = false } = {}) {
  const common = {
    hormones: buildHormoneVitals(being),
    nutrition: buildNutritionVitals(being, world),
    logicHrm: being?.logicCells?.['LOG-HRM']?.length ?? 0,
    logicNtr: being?.logicCells?.['LOG-NTR']?.length ?? 0,
    logicNrv: being?.logicCells?.['LOG-NRV']?.length ?? 0,
    independent: being?.independent !== false,
    weaned: Boolean(being?.weaned),
  };
  const vitals = { common };
  if (adult && being?.pairMorph === 'A') {
    vitals.sperm = buildMaleSpermVitals(being, world, profile);
  }
  if (adult && being?.pairMorph === 'B') {
    vitals.egg = buildFemaleEggVitals(being, world, profile);
  }
  return vitals;
}

export function buildHealthReport(being, atTick = 0, { adult = false, stage = null, world = null } = {}) {
  const seq = being?.dna?.sequence ?? '';
  const dnaInterpret = interpretFullDna(seq, being?.id ?? '');
  const profile = world?.envProfile ?? {};
  const stageLabel =
    stage ??
    (adult ? '成体' : being?.independent === false ? '婴' : being?.lifeStage === 'ADT' ? '成' : '幼');
  return {
    beingId: being?.id ?? null,
    atTick,
    stage: stageLabel,
    adult: Boolean(adult),
    pairMorph: being?.pairMorph ?? null,
    generation: being?.generation ?? 0,
    dnaSeq: seq,
    dnaFp: dnaFingerprint(seq),
    dnaInterpret,
    pairParentA: being?.pairParentA ?? null,
    pairParentB: being?.pairParentB ?? null,
    vitals: buildHealthVitals(being, world, profile, { adult }),
  };
}

/** 出生/任意时刻签发（幼体） */
export function issueHealthReport(being, atTick = 0, opts = {}) {
  if (!being) return null;
  being.healthReport = buildHealthReport(being, atTick, opts);
  return being.healthReport;
}

/** 成体性成熟 — 覆盖旧报告 */
export function issueAdultHealthReport(being, atTick = 0, world = null) {
  if (!being) return null;
  being.healthReport = buildHealthReport(being, atTick, {
    adult: true,
    stage: '成体',
    world,
  });
  return being.healthReport;
}

export function kinshipFromHealthReport(receiver, report, profile = {}) {
  if (!receiver || !report) return { blocked: false, label: '无血缘', sim: 0 };
  const donor = {
    id: report.beingId,
    dna: { sequence: report.dnaSeq },
    pairParentA: report.pairParentA,
    pairParentB: report.pairParentB,
  };
  const sim = dnaSequenceSimilarity(receiver.dna?.sequence, report.dnaSeq);
  let blocked = false;
  if (isParentChildId(receiver, donor)) blocked = true;
  else if (isFullSibling(receiver, donor)) blocked = true;
  else if (isHalfSibling(receiver, donor)) blocked = true;
  else if (isDnaKinBlocked(receiver, donor, profile)) blocked = true;
  const label = kinshipRelationLabel(receiver, donor, profile);
  return { blocked, label, sim: +sim.toFixed(3) };
}

export function healthReportKinBlocked(receiver, report, profile = {}) {
  return kinshipFromHealthReport(receiver, report, profile).blocked;
}
