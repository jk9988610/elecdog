// 成体体检报告 — 性成熟时签发，求偶时随 PRQ 附带供 DNA 血缘检测

import {
  dnaFingerprint,
  dnaSequenceSimilarity,
  isDnaKinBlocked,
  isFullSibling,
  isHalfSibling,
  isParentChildId,
  kinshipDnaBlockEnabled,
  kinshipRelationLabel,
} from '../genetics/dna-kinship.js';

export function buildHealthReport(being, atTick = 0) {
  const seq = being?.dna?.sequence ?? '';
  return {
    beingId: being?.id ?? null,
    atTick,
    pairMorph: being?.pairMorph ?? null,
    generation: being?.generation ?? 0,
    dnaSeq: seq,
    dnaFp: dnaFingerprint(seq),
    pairParentA: being?.pairParentA ?? null,
    pairParentB: being?.pairParentB ?? null,
    adult: true,
  };
}

export function issueAdultHealthReport(being, atTick = 0) {
  if (!being) return null;
  being.healthReport = buildHealthReport(being, atTick);
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
