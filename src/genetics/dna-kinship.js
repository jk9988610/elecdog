// DNA 血缘相似度 — 配合族谱 ID 禁止近亲繁殖

import { hashString } from '../core/hash.js';
import { DNA_ZONES } from './dna-express.js';

export const KINSHIP_LABEL_NONE = '无血缘';
export const KINSHIP_LABEL_PARENT = '父母子女';
export const KINSHIP_LABEL_SIBLING = '同胞';
export const KINSHIP_LABEL_HALF = '半同胞';
export const KINSHIP_LABEL_CLOSE = '近亲';
export const KINSHIP_LABEL_DISTANT = '远亲';

/** 序列相同位点比例 */
export function dnaSequenceSimilarity(seqA, seqB) {
  if (!seqA || !seqB) return 0;
  const len = Math.min(seqA.length, seqB.length);
  if (!len) return 0;
  let match = 0;
  for (let i = 0; i < len; i++) {
    if (seqA[i] === seqB[i]) match += 1;
  }
  return match / len;
}

/** Z1–Z6 区段序列相似度（表达串 96 位切片） */
export function zoneSequenceSimilarity(seqA, seqB, zoneKey) {
  const z = DNA_ZONES[zoneKey];
  if (!z) return 0;
  return dnaSequenceSimilarity(seqA?.slice(z.start, z.end), seqB?.slice(z.start, z.end));
}

export function parentZoneSimilarityRows(child, parent) {
  if (!child?.dna?.sequence || !parent?.dna?.sequence) return [];
  return Object.keys(DNA_ZONES).map((zoneKey) => ({
    zone: zoneKey,
    tag: DNA_ZONES[zoneKey].tag,
    sim: zoneSequenceSimilarity(child.dna.sequence, parent.dna.sequence, zoneKey),
  }));
}

export function overallSequenceSimilarityPct(sim) {
  return `${Math.round((sim ?? 0) * 100)}%`;
}

/** 短指纹 — 体检报告与族谱展示 */
export function dnaFingerprint(seq, bits = 24) {
  if (!seq) return '—';
  const h = hashString(`fp:${seq}`);
  return h.toString(16).toUpperCase().padStart(8, '0').slice(0, bits / 4);
}

export function isFullSibling(a, b) {
  if (!a?.id || !b?.id) return false;
  const pa = a.pairParentA;
  const pb = a.pairParentB;
  if (!pa || !pb) return false;
  return b.pairParentA === pa && b.pairParentB === pb;
}

export function isHalfSibling(a, b) {
  if (!a?.id || !b?.id || isFullSibling(a, b)) return false;
  const parentsA = [a.pairParentA, a.pairParentB].filter(Boolean);
  const parentsB = [b.pairParentA, b.pairParentB].filter(Boolean);
  if (!parentsA.length || !parentsB.length) return false;
  return parentsA.some((p) => parentsB.includes(p));
}

export function isParentChildId(a, b) {
  if (!a?.id || !b?.id) return false;
  if (b.pairParentA === a.id || b.pairParentB === a.id) return true;
  if (a.pairParentA === b.id || a.pairParentB === b.id) return true;
  if (b.fissionParent === a.id || a.fissionParent === b.id) return true;
  if (b.lineageParent === a.id || a.lineageParent === b.id) return true;
  return false;
}

export function kinshipDnaBlockEnabled(profile) {
  return profile?.kinshipDnaBlockEnabled === true;
}

export function kinshipDnaBlockSim(profile) {
  return profile?.kinshipDnaBlockSim ?? 0.68;
}

/** DNA 高相似视为血缘（同胞/克隆）；多代后相似度自然下降可繁殖 */
export function isDnaKinBlocked(a, b, profile = {}) {
  if (!kinshipDnaBlockEnabled(profile)) return false;
  const sim = dnaSequenceSimilarity(a?.dna?.sequence, b?.dna?.sequence);
  return sim >= kinshipDnaBlockSim(profile);
}

export function kinshipRelationLabel(a, b, profile = {}) {
  if (!a?.id || !b?.id || a.id === b.id) return KINSHIP_LABEL_NONE;
  if (isParentChildId(a, b)) return KINSHIP_LABEL_PARENT;
  if (isFullSibling(a, b)) return KINSHIP_LABEL_SIBLING;
  if (isHalfSibling(a, b)) return KINSHIP_LABEL_HALF;
  const sim = dnaSequenceSimilarity(a?.dna?.sequence, b?.dna?.sequence);
  if (kinshipDnaBlockEnabled(profile) && sim >= kinshipDnaBlockSim(profile)) {
    return KINSHIP_LABEL_CLOSE;
  }
  if (sim >= 0.42) return KINSHIP_LABEL_DISTANT;
  return KINSHIP_LABEL_NONE;
}

/** 队列开局：任意两体不可繁殖近亲 */
export function cohortPairKinBlocked(a, b, profile = {}) {
  if (isParentChildId(a, b)) return true;
  if (isFullSibling(a, b)) return true;
  if (isHalfSibling(a, b)) return true;
  return isDnaKinBlocked(a, b, profile);
}
