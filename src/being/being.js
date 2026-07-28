// 公理: A2 A3 A5 — 个体内在流与对外行为；过程由 DNA 初始化，不预设语义

import { hashString, mulberry32 } from '../core/hash.js';

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
    this.bornAtTick = null;
    this.registers = dnaToRegisters(dna.sequence);
    this.rng = mulberry32(hashString(`${dna.sequence}:${id}`));
    this.tickCount = 0;
  }

  advanceRegisters() {
    for (let i = 0; i < this.registers.length; i++) {
      const mix = this.registers[(i + 1) % this.registers.length];
      const noise = (this.rng() - 0.5) * 0.08;
      this.registers[i] = Math.max(0, Math.min(1, this.registers[i] * 0.97 + mix * 0.03 + noise));
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

  emitExternal() {
    if (this.rng() > 0.55) {
      return [];
    }
    const r = this.registers[Math.floor(this.rng() * this.registers.length)];
    const op = toHexByte(r);
    const payload = toHexByte(this.rng());
    const chk = toHexByte(this.rng());
    const kind = this.rng() > 0.5 ? 'TX' : 'ACT';
    return [`[${kind}] 0x${op} 0x${payload} 0x${chk}`];
  }

  tick(worldTick, { heardSignals = [] } = {}) {
    this.tickCount++;
    this.advanceRegisters();
    const internal = this.emitInternal();

    if (heardSignals.length > 0) {
      const mix = hashString(heardSignals.map((s) => s.content).join('|') + this.id);
      const local = mulberry32(mix);
      internal.push(
        `0x${toHexByte(local())} 0x${toHexByte(local())} 0x${toHexByte(local())}`
      );
    }

    const external = this.emitExternal();
    return {
      tick: worldTick,
      beingId: this.id,
      internal,
      external,
      registers: [...this.registers],
    };
  }

  firstPulse() {
    const op = toHexByte(this.registers[0]);
    return [`0x${op} 0x00 0x01`];
  }
}
