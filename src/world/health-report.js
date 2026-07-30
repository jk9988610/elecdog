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

export function buildHealthReport(being, atTick = 0, { adult = false, stage = null } = {}) {
  const seq = being?.dna?.sequence ?? '';
  const dnaInterpret = interpretFullDna(seq, being?.id ?? '');
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
  };
}

/** 出生/任意时刻签发（幼体） */
export function issueHealthReport(being, atTick = 0, opts = {}) {
  if (!being) return null;
  being.healthReport = buildHealthReport(being, atTick, opts);
  return being.healthReport;
}

/** 成体性成熟 — 覆盖旧报告 */
export function issueAdultHealthReport(being, atTick = 0) {
  if (!being) return null;
  being.healthReport = buildHealthReport(being, atTick, { adult: true, stage: '成体' });
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
