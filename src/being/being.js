// 公理: A2 A3 — 个体内在流与对外行为；场压反馈（Phase 17）

import { hashString, mulberry32 } from '../core/hash.js';
import { assignSocialSlot } from '../world/social.js';
import { assessStress, externalThreshold, preferAct } from '../world/viability.js';
import { assignCellBoundary } from '../world/cell.js';
import { effectiveCoupling } from '../world/register-profile.js';

function dnaToRegisters(dna, count = 8) {
  const rng = mulberry32(hashString(dna));
  return Array.from({ length: count }, () => rng());
}

function toHexByte(n) {
  return Math.floor((n * 255) % 256)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export class Being {
  constructor({ name, code, dna, id }) {
    this.name = name;
    this.code = code;
    this.dna = dna;
    this.id = id;
    this.socialSlot = assignSocialSlot(id);
    this.bornAtTick = null;
    this.registers = dnaToRegisters(dna.sequence);
    this.rng = mulberry32(hashString(`${dna.sequence}:${id}`));
    this.tickCount = 0;
    this.alive = true;
    this.lowStreak = 0;
    this.stressStreak = 0;
    this.generation = 0;
    this.lineageParent = null;
    this.lastFissionTick = 0;
    this.fissionCount = 0;
    this.fissionParent = null;
    this.fissionLine = null;
    this.lastRenTick = -999;
    this.renCount = 0;
    this.plgCount = 0;
    this.renewTickDebt = 0;
    this.renewCostCount = 0;
    this.meiPacket = null;
    this.lastMeiTick = -999;
    this.meiCount = 0;
    this.fusCount = 0;
    this.fusParentA = null;
    this.fusParentB = null;
    this.recombined = false;
    this.cellBoundary = assignCellBoundary(dna.sequence, id);
    this.expStage = 'E0';
    this.expStress = 0;
    this.expLow = 0;
    this.expSocial = 0;
    this.expAct = 0;
    this.expStageAt = 0;
    this.expTransitions = 0;
    this.regMode = 'SYNC';
    this.regModeAt = 0;
    this.regTransitions = 0;
    this.regPrevRegisters = null;
    this.regGapMean = 0;
    this.regDriftVel = 0;
    this.regVariance = 0;
    this.regDomReg = 0;
    this.regDomSub = 0;
    this.metProfile = 'N0';
    this.metDrawByChannel = null;
    this.metLowByChannel = null;
    this.metProfileAt = 0;
    this.metTransitions = 0;
    this.metDrawTotal = 0;
    this.metDominantIdx = 0;
  }

  advanceRegisters(substrate = null, profile = null) {
    const coupling = profile?.registerProfileEnabled
      ? effectiveCoupling(profile, this)
      : (profile?.registerCouplingBase ?? 0.02);
    for (let i = 0; i < this.registers.length; i++) {
      const mix = this.registers[(i + 1) % this.registers.length];
      const noise = (this.rng() - 0.5) * 0.08;
      let next = this.registers[i] * 0.97 + mix * 0.03 + noise;
      if (substrate && substrate.length === this.registers.length) {
        next += (substrate[i] - this.registers[i]) * coupling;
      }
      this.registers[i] = Math.max(0, Math.min(1, next));
    }
  }

  emitInternal() {
    const lines = [];
    const bursts = 1 + Math.floor(this.rng() * 2);
    for (let i = 0; i < bursts; i++) {
      const r = this.registers[Math.floor(this.rng() * this.registers.length)];
      const op = toHexByte(r);
      const a = toHexByte(this.rng());
      const b = toHexByte(this.rng());
      lines.push(`0x${op} 0x${a} 0x${b}`);
    }
    return lines;
  }

  emitExternal({ stress = 0, lowStreak = 0, experienceBias = null } = {}) {
    const actBoost = experienceBias?.actBoost ?? 0;
    const thresholdDelta = experienceBias?.thresholdDelta ?? 0;
    const threshold = Math.max(0.18, Math.min(0.95, externalThreshold(stress, lowStreak) + thresholdDelta));
    if (this.rng() > threshold) {
      return [];
    }
    const r = this.registers[Math.floor(this.rng() * this.registers.length)];
    const op = toHexByte(r);
    const payload = toHexByte(this.rng());
    const chk = toHexByte(this.rng());
    const actBias = preferAct(stress, lowStreak);
    const actRoll = 0.32 - actBoost;
    const kind = actBias && this.rng() > actRoll ? 'ACT' : this.rng() > 0.5 ? 'TX' : 'ACT';
    return [`[${kind}] 0x${op} 0x${payload} 0x${chk}`];
  }

  tick(worldTick, { heardSignals = [], substrate = null, experienceBias = null, profile = null } = {}) {
    if (!this.alive) {
      return {
        tick: worldTick,
        beingId: this.id,
        internal: [],
        external: [],
        registers: [...this.registers],
        stress: 0,
        alive: false,
      };
    }
    this.tickCount++;
    this.advanceRegisters(substrate, profile);
    const stress = assessStress(this.registers, substrate);
    const internal = this.emitInternal();

    if (heardSignals.length > 0) {
      const mix = hashString(heardSignals.map((s) => s.content).join('|') + this.id);
      const local = mulberry32(mix);
      internal.push(
        `0x${toHexByte(local())} 0x${toHexByte(local())} 0x${toHexByte(local())}`
      );
    }

    const external = this.emitExternal({
      stress,
      lowStreak: this.lowStreak,
      experienceBias,
    });
    return {
      tick: worldTick,
      beingId: this.id,
      internal,
      external,
      registers: [...this.registers],
      stress,
      alive: true,
    };
  }

  firstPulse() {
    const op = toHexByte(this.registers[0]);
    return [`0x${op} 0x00 0x01`];
  }
}
