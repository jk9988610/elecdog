/** 社会位 / 社会迹分析 */

export function analyzeSocial(entries, beings) {
  const slotMap = Object.fromEntries(beings.map((b) => [b.id, b.socialSlot]));
  const bySlot = {};
  for (const slot of new Set(Object.values(slotMap))) {
    bySlot[slot] = { tx: 0, tgt: 0, rx: 0, tgtNodes: {} };
  }

  const socials = entries.filter((e) => e.channel === 'social');
  const contests = socials.filter((e) => e.meta?.kind === 'CONTEST');
  const rxLinks = {};

  for (const s of socials) {
    if (s.meta?.kind === 'TX' && s.meta?.slot) bySlot[s.meta.slot].tx++;
    if (s.meta?.kind === 'TGT' && s.meta?.slot) {
      bySlot[s.meta.slot].tgt++;
      const n = s.meta.nodeId;
      bySlot[s.meta.slot].tgtNodes[n] = (bySlot[s.meta.slot].tgtNodes[n] || 0) + 1;
    }
    if (s.meta?.kind === 'RX' && s.meta?.recvSlot) {
      bySlot[s.meta.recvSlot].rx++;
      const key = `${s.meta.emitSlot}→${s.meta.recvSlot}`;
      rxLinks[key] = (rxLinks[key] || 0) + 1;
    }
  }

  const slotSpread = Object.values(bySlot).map((v) => v.tx + v.tgt);
  const maxSpread = Math.max(...slotSpread);
  const minSpread = Math.min(...slotSpread);

  return {
    slotMap,
    bySlot,
    contestCount: contests.length,
    rxLinks,
    divisionSkew: maxSpread - minSpread,
    hasPersistentSlots: beings.every((b) => b.socialSlot?.startsWith('S')),
  };
}
