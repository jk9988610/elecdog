// 田野统计记录器 — 聚合计数，仅保留进化/终止等关键事件

const KEEP_CHANNELS = new Set(['evolution', 'viability', 'population']);

export class StatsRecorder {
  constructor({ turbo = false } = {}) {
    this.turbo = turbo === true;
    this.counts = {};
    this.endReasons = {};
    this.entries = [];
    this.seq = 0;
  }

  _bump(channel, meta = {}) {
    const kind = meta.kind ?? channel;
    const key = `${channel}:${kind}`;
    this.counts[key] = (this.counts[key] ?? 0) + 1;
    if (channel === 'viability' && meta.kind === 'END' && meta.reason) {
      this.endReasons[meta.reason] = (this.endReasons[meta.reason] ?? 0) + 1;
    }
    return kind;
  }

  log({ tick, channel, beingId, content, meta = {} }) {
    this._bump(channel, meta);
    if (this.turbo) return null;
    if (!KEEP_CHANNELS.has(channel)) return null;
    if (channel === 'viability' && meta.kind !== 'END') return null;

    const entry = {
      id: ++this.seq,
      tick,
      channel,
      beingId: beingId ?? null,
      content,
      meta,
    };
    this.entries.push(entry);
    return entry;
  }

  ritual() {
    return null;
  }

  system(tick, content, meta = {}) {
    return this.log({ tick, channel: 'system', content, meta });
  }

  internal() {}
  external() {}
  state() {}
  environment(tick, content, meta = {}) {
    return this.log({ tick, channel: 'environment', content, meta });
  }
  memory() {}
  substrate() {}
  metabolism(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'metabolism', beingId, content, meta });
  }
  nodes() {}
  social(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'social', beingId, content, meta });
  }
  viability(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'viability', beingId, content, meta });
  }
  population(tick, content, meta = {}) {
    return this.log({ tick, channel: 'population', content, meta });
  }
  cell(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'cell', beingId, content, meta });
  }
  evolution(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'evolution', beingId, content, meta });
  }
  experience() {}
  register() {}

  count(channel, kind) {
    return this.counts[`${channel}:${kind}`] ?? 0;
  }

  evo(kind) {
    return this.count('evolution', kind);
  }

  exportJson() {
    return JSON.stringify({ counts: this.counts, endReasons: this.endReasons, kept: this.entries.length }, null, 2);
  }
}
