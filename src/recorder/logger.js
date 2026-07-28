// 公理: A7 — 全量可记录

export class Recorder {
  constructor() {
    this.entries = [];
    this.seq = 0;
  }

  log({ tick, channel, beingId, content, meta = {} }) {
    const entry = {
      id: ++this.seq,
      tick,
      channel,
      beingId: beingId ?? null,
      content,
      meta,
      at: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  ritual(tick, content, meta = {}) {
    return this.log({ tick, channel: 'ritual', content, meta });
  }

  system(tick, content, meta = {}) {
    return this.log({ tick, channel: 'system', content, meta });
  }

  internal(tick, beingId, lines) {
    lines.forEach((line) => {
      this.log({ tick, channel: 'internal', beingId, content: line });
    });
  }

  external(tick, beingId, lines) {
    lines.forEach((line) => {
      this.log({ tick, channel: 'external', beingId, content: line });
    });
  }

  state(tick, beingId, registers) {
    this.log({
      tick,
      channel: 'state',
      beingId,
      content: registers.map((v, i) => `r${i}=${v.toFixed(4)}`).join(' '),
      meta: { registers },
    });
  }

  query({ channel, beingId, tickFrom, tickTo, limit = 500 }) {
    let result = this.entries;
    if (channel) result = result.filter((e) => e.channel === channel);
    if (beingId) result = result.filter((e) => e.beingId === beingId);
    if (tickFrom != null) result = result.filter((e) => e.tick >= tickFrom);
    if (tickTo != null) result = result.filter((e) => e.tick <= tickTo);
    if (result.length > limit) {
      return result.slice(-limit);
    }
    return result;
  }

  exportJson() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        count: this.entries.length,
        entries: this.entries,
      },
      null,
      2
    );
  }

  clear() {
    this.entries = [];
    this.seq = 0;
  }
}
