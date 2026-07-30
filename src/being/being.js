// 公理: A2 A3 — 个体内在流与对外行为；场压反馈（Phase 17）

import { hashString, mulberry32 } from '../core/hash.js';
import { assignSocialSlot } from '../world/social.js';
import { assessStress, externalThreshold, preferAct } from '../world/viability.js';
import { assignCellBoundary } from '../world/cell.js';
import { effectiveCoupling } from '../world/register-profile.js';
import { applySemPayloadHint } from '../world/sem.js';
import {
  internalTxCouplingEnabled,
  deriveInternalTxCoupling,
  applyInternalTxCoupling,
} from '../world/internal-tx-coupling.js';
import {
  substantiveSignalOnly,
  deriveSubstantiveExternal,
  appendMulticellIntraTx,
  multicellIntraTxEnabled,
} from '../world/substantive-signal.js';

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
    this.coopMode = 'S0';
    this.coopModeAt = 0;
    this.coopTransitions = 0;
    this.socRx = 0;
    this.socCrossRx = 0;
    this.socTx = 0;
    this.socAct = 0;
    this.socContest = 0;
    this.rprOrigin = 'SEED';
    this.rprMode = 'R0';
    this.rprModeAt = 0;
    this.rprTransitions = 0;
    this.rprFissAsParent = 0;
    this.rprLineageAsParent = 0;
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
    const txBoost = experienceBias?.txBoost ?? 0;
    const threshold = Math.max(0.18, Math.min(0.95, externalThreshold(stress, lowStreak) + thresholdDelta));
    if (this.rng() > threshold) {
      return [];
    }
    const r = this.registers[Math.floor(this.rng() * this.registers.length)];
    let op = toHexByte(r);
    let payload = toHexByte(this.rng());
    let chk = toHexByte(this.rng());
    const actBias = preferAct(stress, lowStreak);
    const actRoll = 0.32 - actBoost;
    let kind;
    if (actBias && this.rng() > actRoll) {
      kind = 'ACT';
    } else {
      kind = this.rng() > 0.5 - txBoost ? 'TX' : 'ACT';
    }
    if (kind === 'TX' && experienceBias?.internalTxCoupling) {
      const coupled = applyInternalTxCoupling(
        op,
        payload,
        chk,
        experienceBias.internalTxCoupling,
        () => this.rng()
      );
      if (coupled.applied) {
        op = coupled.op;
        payload = coupled.payload;
        chk = coupled.chk;
        this.internalTxHits = (this.internalTxHits ?? 0) + 1;
        this.internalTxLoad = coupled.load ?? 0;
        this.lastInternalTxSource = coupled.sourceInternal;
        this.internalTxAppliedTick = true;
      }
    }
    if (kind === 'TX' && experienceBias?.txPayloadHint) {
      const hinted = applySemPayloadHint(
        op,
        payload,
        chk,
        experienceBias.txPayloadHint,
        experienceBias.semLoad ?? 0,
        () => this.rng()
      );
      op = hinted.op;
      payload = hinted.payload;
      chk = hinted.chk;
      if (hinted.applied) {
        this.semFbHits = (this.semFbHits ?? 0) + 1;
      }
    }
    return [`[${kind}] 0x${op} 0x${payload} 0x${chk}`];
  }

  tick(worldTick, { heardSignals = [], substrate = null, experienceBias = null, profile = null, world = null } = {}) {
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
    let internal = this.emitInternal();

    if (heardSignals.length > 0) {
      const mix = hashString(heardSignals.map((s) => s.content).join('|') + this.id);
      const local = mulberry32(mix);
      internal.push(
        `0x${toHexByte(local())} 0x${toHexByte(local())} 0x${toHexByte(local())}`
      );
    }

    if (profile && multicellIntraTxEnabled(profile)) {
      internal = appendMulticellIntraTx(internal, this);
    }

    let tickBias = experienceBias;
    if (profile && internalTxCouplingEnabled(profile)) {
      const coupling = deriveInternalTxCoupling(internal, this, profile, experienceBias);
      if (coupling) {
        tickBias = { ...(experienceBias ?? {}), internalTxCoupling: coupling };
      }
    }

    let external;
    if (profile && substantiveSignalOnly(profile) && world) {
      external = deriveSubstantiveExternal(this, world, profile, {
        stress,
        lowStreak: this.lowStreak,
        experienceBias: tickBias,
        heardSignals,
        internal,
      });
    } else {
      external = this.emitExternal({
        stress,
        lowStreak: this.lowStreak,
        experienceBias: tickBias,
      });
    }
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
