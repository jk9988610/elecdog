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

  environment(tick, content, meta = {}) {
    return this.log({ tick, channel: 'environment', content, meta });
  }

  memory(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'memory', beingId, content, meta });
  }

  substrate(tick, channels, meta = {}) {
    return this.log({
      tick,
      channel: 'substrate',
      content: channels.map((v, i) => `e${i}=${v.toFixed(4)}`).join(' '),
      meta: { channels, ...meta },
    });
  }

  metabolism(tick, beingId, content, meta = {}) {
    return this.log({ tick, channel: 'metabolism', beingId, content, meta });
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

  exportText({ world = null } = {}) {
    const lines = [];
    if (world) {
      lines.push(`# ElecDog 观察输出`);
      lines.push(`世界: ${world.name}`);
      lines.push(`地点: ${world.birthPlace}`);
      lines.push(`tick: ${world.tick}`);
      lines.push(`个体数: ${world.beings.length}`);
      lines.push(`导出条目: ${this.entries.length}`);
      lines.push(`时间: ${new Date().toISOString()}`);
      lines.push('');
    }
    for (const e of this.entries) {
      const who = e.beingId ? ` ${e.beingId}` : '';
      lines.push(`t${e.tick}\t${e.channel}${who}\t${e.content}`);
    }
    return lines.join('\n');
  }

  clear() {
    this.entries = [];
    this.seq = 0;
  }
}
