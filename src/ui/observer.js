import { createWorld } from '../world/world.js';
import { performBirthRitual } from '../birth/ritual.js';
import { stepWorld } from '../kernel/engine.js';
import { Recorder } from '../recorder/logger.js';

const NOTES_KEY = 'elecdog-field-notes';

export class ObserverApp {
  constructor(root) {
    this.root = root;
    this.world = null;
    this.recorder = new Recorder();
    this.timer = null;
    this.speed = 200;
    this.filterChannel = 'all';
    this.render();
    this.loadNotes();
  }

  render() {
    this.root.innerHTML = `
      <header class="header">
        <h1>ElecDog · 观察台</h1>
        <p class="subtitle">Phase 0 — 最小可观察内核</p>
      </header>

      <section class="panel controls">
        <div class="row">
          <label>世界名称 <input id="world-name" type="text" placeholder="未命名世界" /></label>
          <button id="btn-create-world" type="button">创建世界</button>
        </div>
        <div class="row" id="birth-row" hidden>
          <label>个体名 <input id="being-name" type="text" value="小狗" /></label>
          <label>代号 <input id="being-code" type="text" value="001" maxlength="8" /></label>
          <button id="btn-birth" type="button">诞生仪式</button>
        </div>
        <div class="row" id="run-row" hidden>
          <button id="btn-step" type="button">单步 tick</button>
          <button id="btn-run" type="button">运行</button>
          <button id="btn-pause" type="button" disabled>暂停</button>
          <label>间隔(ms) <input id="speed" type="number" value="200" min="50" max="2000" step="50" /></label>
          <span id="tick-display" class="tick">tick: 0</span>
        </div>
        <div class="row" id="export-row" hidden>
          <button id="btn-copy-log" type="button">复制全部输出</button>
          <button id="btn-export" type="button">导出日志 JSON</button>
          <button id="btn-clear-log" type="button">清空日志</button>
          <span id="copy-feedback" class="copy-feedback" hidden>已复制</span>
        </div>
      </section>

      <section class="panel status" id="status-panel" hidden>
        <h2>世界状态</h2>
        <pre id="world-status"></pre>
      </section>

      <section class="panel beings" id="beings-panel" hidden>
        <h2>个体</h2>
        <div id="beings-list"></div>
      </section>

      <section class="panel log-panel">
        <div class="log-header">
          <h2>观察日志</h2>
          <div class="log-actions">
            <button id="btn-copy-visible" type="button" class="btn-small">复制当前视图</button>
            <select id="channel-filter">
            <option value="all">全部通道</option>
            <option value="ritual">ritual</option>
            <option value="system">system</option>
            <option value="internal">internal（对内）</option>
            <option value="external">external（对外）</option>
            <option value="signal">signal（外来信号）</option>
            <option value="environment">environment（环境脉搏/回响）</option>
            <option value="substrate">substrate（基底场态）</option>
            <option value="nodes">nodes（世界节点）</option>
            <option value="metabolism">metabolism（基底代谢）</option>
            <option value="memory">memory（事件记忆迹）</option>
            <option value="state">state</option>
          </select>
          </div>
        </div>
        <div id="log-view" class="log-view"></div>
      </section>

      <section class="panel notes-panel">
        <h2>田野笔记</h2>
        <p class="hint">只记录可观测事实。归纳后写入 docs/OBSERVATION_LOG.md</p>
        <textarea id="field-notes" rows="8" placeholder="OBS-YYYYMMDD-01&#10;- 世界：&#10;- 个体：&#10;- tick 范围：&#10;- 事实："></textarea>
        <div class="row">
          <button id="btn-save-notes" type="button">保存笔记（本地）</button>
          <button id="btn-copy-notes" type="button">复制笔记</button>
        </div>
      </section>
    `;

    this.bind();
    this.refreshLog();
  }

  bind() {
    this.$ = {
      worldName: this.root.querySelector('#world-name'),
      btnCreateWorld: this.root.querySelector('#btn-create-world'),
      birthRow: this.root.querySelector('#birth-row'),
      beingName: this.root.querySelector('#being-name'),
      beingCode: this.root.querySelector('#being-code'),
      btnBirth: this.root.querySelector('#btn-birth'),
      runRow: this.root.querySelector('#run-row'),
      exportRow: this.root.querySelector('#export-row'),
      btnStep: this.root.querySelector('#btn-step'),
      btnRun: this.root.querySelector('#btn-run'),
      btnPause: this.root.querySelector('#btn-pause'),
      speed: this.root.querySelector('#speed'),
      tickDisplay: this.root.querySelector('#tick-display'),
      statusPanel: this.root.querySelector('#status-panel'),
      worldStatus: this.root.querySelector('#world-status'),
      beingsPanel: this.root.querySelector('#beings-panel'),
      beingsList: this.root.querySelector('#beings-list'),
      channelFilter: this.root.querySelector('#channel-filter'),
      logView: this.root.querySelector('#log-view'),
      fieldNotes: this.root.querySelector('#field-notes'),
      btnSaveNotes: this.root.querySelector('#btn-save-notes'),
      btnCopyNotes: this.root.querySelector('#btn-copy-notes'),
      btnCopyLog: this.root.querySelector('#btn-copy-log'),
      btnCopyVisible: this.root.querySelector('#btn-copy-visible'),
      copyFeedback: this.root.querySelector('#copy-feedback'),
      btnExport: this.root.querySelector('#btn-export'),
      btnClearLog: this.root.querySelector('#btn-clear-log'),
    };

    this.$.btnCreateWorld.addEventListener('click', () => this.createWorld());
    this.$.btnBirth.addEventListener('click', () => this.birth());
    this.$.btnStep.addEventListener('click', () => this.step());
    this.$.btnRun.addEventListener('click', () => this.run());
    this.$.btnPause.addEventListener('click', () => this.pause());
    this.$.channelFilter.addEventListener('change', () => {
      this.filterChannel = this.$.channelFilter.value;
      this.refreshLog();
    });
    this.$.btnSaveNotes.addEventListener('click', () => this.saveNotes());
    this.$.btnCopyNotes.addEventListener('click', () => this.copyNotes());
    this.$.btnCopyLog.addEventListener('click', () => this.copyAllLog());
    this.$.btnCopyVisible.addEventListener('click', () => this.copyVisibleLog());
    this.$.btnExport.addEventListener('click', () => this.exportLog());
    this.$.btnClearLog.addEventListener('click', () => this.clearLog());
  }

  createWorld() {
    this.pause();
    this.recorder.clear();
    this.world = createWorld(this.$.worldName.value);
    this.recorder.system(0, `世界创建 ${this.world.name}`, {
      birthPlace: this.world.birthPlace,
    });
    this.$.birthRow.hidden = false;
    this.$.runRow.hidden = false;
    this.$.exportRow.hidden = false;
    this.$.statusPanel.hidden = false;
    this.refreshAll();
  }

  birth() {
    if (!this.world) return;
    const name = this.$.beingName.value.trim() || '小狗';
    const code = this.$.beingCode.value.trim() || '001';
    performBirthRitual(this.world, this.recorder, { name, code });
    this.$.beingsPanel.hidden = false;
    this.refreshAll();
  }

  step() {
    if (!this.world) return;
    stepWorld(this.world, this.recorder);
    this.refreshAll();
  }

  run() {
    if (!this.world || this.timer) return;
    this.speed = Number(this.$.speed.value) || 200;
    this.world.running = true;
    this.$.btnRun.disabled = true;
    this.$.btnPause.disabled = false;
    this.timer = setInterval(() => this.step(), this.speed);
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.world) this.world.running = false;
    if (this.$.btnRun) this.$.btnRun.disabled = !this.world;
    if (this.$.btnPause) this.$.btnPause.disabled = true;
  }

  refreshAll() {
    this.refreshStatus();
    this.refreshBeings();
    this.refreshLog();
  }

  refreshStatus() {
    if (!this.world) return;
    this.$.tickDisplay.textContent = `tick: ${this.world.tick}`;
    this.$.worldStatus.textContent = JSON.stringify(
      {
        name: this.world.name,
        birthPlace: this.world.birthPlace,
        tick: this.world.tick,
        beings: this.world.beings.length,
      },
      null,
      2
    );
  }

  refreshBeings() {
    if (!this.world) return;
    this.$.beingsList.innerHTML = this.world.beings
      .map(
        (b) => `
      <div class="being-card">
        <strong>${b.name}</strong>（${b.code}）<br/>
        <span class="mono">ID ${b.id}</span><br/>
        <span class="mono">DNA ${b.dna.sequence.slice(0, 24)}…</span>
      </div>`
      )
      .join('');
  }

  refreshLog() {
    const channel = this.filterChannel === 'all' ? null : this.filterChannel;
    const entries = this.recorder.query({ channel, limit: 400 });
    this.$.logView.innerHTML = entries
      .map((e) => {
        const who = e.beingId ? ` <span class="who">${e.beingId}</span>` : '';
        return `<div class="log-line ch-${e.channel}"><span class="t">t${e.tick}</span> <span class="ch">${e.channel}</span>${who} <span class="c">${escapeHtml(e.content)}</span></div>`;
      })
      .join('');
    this.$.logView.scrollTop = this.$.logView.scrollHeight;
  }

  saveNotes() {
    localStorage.setItem(NOTES_KEY, this.$.fieldNotes.value);
  }

  loadNotes() {
    const saved = localStorage.getItem(NOTES_KEY);
    if (saved) this.$.fieldNotes.value = saved;
  }

  async copyNotes() {
    await this.copyText(this.$.fieldNotes.value);
  }

  async copyAllLog() {
    const text = this.recorder.exportText({ world: this.world });
    await this.copyText(text);
  }

  async copyVisibleLog() {
    const channel = this.filterChannel === 'all' ? null : this.filterChannel;
    const entries = this.recorder.query({ channel, limit: 100000 });
    const lines = entries.map((e) => {
      const who = e.beingId ? ` ${e.beingId}` : '';
      return `t${e.tick}\t${e.channel}${who}\t${e.content}`;
    });
    await this.copyText(lines.join('\n'));
  }

  async copyText(text) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    this.$.copyFeedback.hidden = false;
    clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => {
      this.$.copyFeedback.hidden = true;
    }, 2000);
  }

  exportLog() {
    const blob = new Blob([this.recorder.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elecdog-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearLog() {
    if (!confirm('清空当前观察日志？')) return;
    this.recorder.clear();
    if (this.world) {
      this.recorder.system(this.world.tick, '日志已清空');
    }
    this.refreshLog();
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
