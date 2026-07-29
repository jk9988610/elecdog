// GAP-11+ Phase 95 — [DSP] 耗散定律：DRW 分流 toReg / lost

export const DEFAULT_DSP_YIELD = 0.3;

export function dissipationEnabled(profile) {
  return profile?.dissipationEnabled === true;
}

export function drawYieldFrac(profile) {
  if (!dissipationEnabled(profile)) return DEFAULT_DSP_YIELD;
  return profile.dspYieldFrac ?? DEFAULT_DSP_YIELD;
}

export function initDissipationStats(world) {
  world.dsp = {
    toRegTotal: 0,
    lostTotal: 0,
    drawCount: 0,
  };
}

/** 将 DRW 量拆为寄存器入账与耗散；返回通量事实 */
export function applyDissipation(world, being, draw, profile) {
  const frac = drawYieldFrac(profile);
  const toReg = draw.amount * frac;
  const lost = draw.amount - toReg;

  being.registers[draw.idx] = Math.max(0, Math.min(1, being.registers[draw.idx] + toReg));

  if (dissipationEnabled(profile)) {
    being.dspToRegTotal = (being.dspToRegTotal ?? 0) + toReg;
    being.dspLostTotal = (being.dspLostTotal ?? 0) + lost;
    if (world.dsp) {
      world.dsp.toRegTotal += toReg;
      world.dsp.lostTotal += lost;
      world.dsp.drawCount += 1;
    }
  }

  return {
    idx: draw.idx,
    amount: draw.amount,
    toReg: +toReg.toFixed(6),
    lost: +lost.toFixed(6),
    frac: +frac.toFixed(4),
  };
}

export function dspYieldRatio(world) {
  const d = world.dsp ?? {};
  const sum = (d.toRegTotal ?? 0) + (d.lostTotal ?? 0);
  if (sum < 0.0001) return 0;
  return +((d.toRegTotal ?? 0) / sum).toFixed(4);
}
