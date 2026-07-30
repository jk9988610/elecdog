// DNA 全序列解读 — Z1–Z6 区段 + 每位点四态释义（观察台体检报告）

import {
  DNA_ZONES,
  DNA_LENGTH,
  zoneSlice,
  buildDnaExpression,
  SENSE_KINDS,
} from './dna-express.js';
import { dnaFingerprint } from './dna-kinship.js';

const ZONE_CN = {
  Z1: { name: '体轴', tag: 'axis', role: '胚胎体轴 DIFF 优先级、宫内窗偏置' },
  Z2: { name: '形态', tag: 'morph', role: '形态槽位、STR 凹凸通道子集' },
  Z3: { name: '激素', tag: 'hormone', role: '激素基线、分泌节律、生殖/泌乳/青春期' },
  Z4: { name: '神经', tag: 'neural', role: '神经耦合、感觉→整合延迟、BRN 增益' },
  Z5: { name: '感官', tag: 'sense', role: '五感阈值、饱和与噪声' },
  Z6: { name: '稳态', tag: 'homeo', role: '分裂冷却、幼体窗、组织 MIT/DIFF 速率' },
};

const QUADRANT_CN = {
  axis: ['消化轴权重↑', '运动轴权重↑', '神经轴权重↑', '稳态/胚胎窗偏置↑'],
  morph: ['排出方通道倾向', '接纳方通道倾向', '体表通道稀疏', '体表通道密集'],
  hormone: ['代谢 h0 向', '生殖 h1 向', '泌乳 h2 向', '应激 h3 向'],
  neural: ['神经增益偏弱', '神经增益偏强', '整合延迟偏短', '整合延迟偏长'],
  sense: ['感官阈值偏低', '感官阈值偏高', '饱和偏早', '噪声偏大'],
  homeo: ['MIT 偏快', 'DIFF 偏快', '幼体窗偏长', '独立阈值偏迟'],
};

const SENSE_CN = {
  th: '触觉',
  tm: '温度',
  gu: '味觉',
  vs: '视觉',
  au: '听觉',
  ol: '嗅觉',
};

function zoneKeyForIndex(index) {
  for (const [key, z] of Object.entries(DNA_ZONES)) {
    if (index >= z.start && index < z.end) return key;
  }
  return 'Z6';
}

function quadrantMeaning(tag, digit) {
  const d = Math.min(3, Math.max(0, parseInt(digit, 10) || 0));
  const table = QUADRANT_CN[tag] ?? QUADRANT_CN.homeo;
  return table[d];
}

function zoneExpressSummary(zoneKey, sequence, beingId, express) {
  const meta = ZONE_CN[zoneKey];
  const slice = zoneSlice(sequence, zoneKey);
  const lines = [];
  if (zoneKey === 'Z1' && express?.axis) {
    lines.push(`消化偏置 ${express.axis.dig} · 运动 ${express.axis.mot} · 神经 ${express.axis.nrv}`);
  }
  if (zoneKey === 'Z2' && express) {
    lines.push(`形态槽 hash ${express.morphSlot}`);
  }
  if (zoneKey === 'Z3' && express?.hormoneBaseline) {
    const h = express.hormoneBaseline;
    lines.push(`激素基线 h0–h4: ${h.h0} / ${h.h1} / ${h.h2} / ${h.h3} / ${h.h4}`);
  }
  if (zoneKey === 'Z4' && express?.neural) {
    const n = express.neural;
    lines.push(`NRV+${n.nrvBoost} BRN+${n.brnBoost} 延迟${n.senDelay}tick`);
  }
  if (zoneKey === 'Z5' && express?.sense) {
    const parts = SENSE_KINDS.map((k) => {
      const p = express.sense[k];
      return `${SENSE_CN[k] ?? k}噪${p.noise}`;
    });
    lines.push(parts.join(' · '));
  }
  if (zoneKey === 'Z6' && express?.homeo) {
    const ho = express.homeo;
    lines.push(`MIT×${ho.mitBias} DIFF×${ho.diffBias} 幼体×${ho.juvenileBias}`);
  }
  return lines;
}

/** 96 位逐位解读 */
export function interpretDnaPositions(sequence) {
  const seq = String(sequence ?? '').slice(0, DNA_LENGTH);
  const out = [];
  for (let i = 0; i < seq.length; i++) {
    const base = seq[i];
    const zoneKey = zoneKeyForIndex(i);
    const meta = ZONE_CN[zoneKey];
    const local = i - DNA_ZONES[zoneKey].start;
    out.push({
      index: i,
      base,
      zone: zoneKey,
      zoneName: meta.name,
      localIndex: local,
      meaning: `${meta.name}·位${local}·${quadrantMeaning(meta.tag, base)}`,
    });
  }
  return out;
}

/** Z1–Z6 区段汇总 */
export function interpretDnaZones(sequence, beingId = '') {
  const seq = String(sequence ?? '');
  const express = buildDnaExpression({ sequence: seq }, beingId);
  return Object.keys(DNA_ZONES).map((zoneKey) => {
    const meta = ZONE_CN[zoneKey];
    const z = DNA_ZONES[zoneKey];
    const slice = zoneSlice(seq, zoneKey);
    return {
      zone: zoneKey,
      name: meta.name,
      role: meta.role,
      start: z.start,
      end: z.end,
      slice,
      expressLines: zoneExpressSummary(zoneKey, seq, beingId, express),
    };
  });
}

/** 完整体检解读快照 */
export function interpretFullDna(sequence, beingId = '') {
  const seq = String(sequence ?? '').slice(0, DNA_LENGTH);
  const express = buildDnaExpression({ sequence: seq }, beingId);
  return {
    sequence: seq,
    length: seq.length,
    fingerprint: dnaFingerprint(seq),
    templateCode: null,
    zones: interpretDnaZones(seq, beingId),
    positions: interpretDnaPositions(seq),
    express,
  };
}
