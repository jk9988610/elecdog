import { createWorld } from '../world/world.js';
import { performBirthRitual } from '../birth/ritual.js';
import { stepWorld } from '../kernel/engine.js';
import { Recorder } from '../recorder/logger.js';
import { buildDashboardStats } from './stats.js';
import { VERSION } from '../version.js';

const SEED_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const SEED_ID = '0120260729010001';

export class ObserverApp {
  constructor(root) {
    this.root = root;
    this.world = null;
    this.recorder = new Recorder();
    this.timer = null;
    this.speed = 200;
    this.render();
    this.bootstrapWorld();
  }

  render() {
    this.root.innerHTML = `
      <header class="header">
        <h1>ElecDog</h1>
        <p class="subtitle">世界实况 · 辞典统计 <span class="version">v${VERSION}</span> <span id="offline-badge" class="offline-badge" hidden>离线</span></p>
      </header>

      <section class="toolbar">
        <button id="btn-run" type="button">运行</button>
        <button id="btn-pause" type="button" disabled>暂停</button>
        <label class="speed-label">间隔 <input id="speed" type="number" value="200" min="50" max="2000" step="50" /></label>
        <span id="tick-display" class="tick">tick 0</span>
        <span id="place-display" class="place"></span>
      </section>

      <main class="dashboard" id="dashboard"></main>
    `;

    this.$ = {
      btnRun: this.root.querySelector('#btn-run'),
      btnPause: this.root.querySelector('#btn-pause'),
      speed: this.root.querySelector('#speed'),
      tickDisplay: this.root.querySelector('#tick-display'),
      placeDisplay: this.root.querySelector('#place-display'),
      dashboard: this.root.querySelector('#dashboard'),
    };

    this.$.btnRun.addEventListener('click', () => this.run());
    this.$.btnPause.addEventListener('click', () => this.pause());
  }

  bootstrapWorld() {
    this.world = createWorld('01');
    const seeds = [
      { name: '观察者', code: '001', dnaSequence: SEED_DNA, id: SEED_ID },
      { name: '002', code: '002' },
      { name: '003', code: '003' },
      { name: '001-乙', code: '001' },
    ];
    for (const s of seeds) {
      performBirthRitual(this.world, this.recorder, s);
    }
    this.refresh();
    this.run();
  }

  step() {
    if (!this.world) return;
    stepWorld(this.world, this.recorder);
    this.refresh();
  }

  run() {
    if (!this.world || this.timer) return;
    this.speed = Number(this.$.speed.value) || 200;
    this.$.btnRun.disabled = true;
    this.$.btnPause.disabled = false;
    this.timer = setInterval(() => this.step(), this.speed);
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.$.btnRun.disabled = false;
    this.$.btnPause.disabled = true;
  }

  refresh() {
    if (!this.world) return;
    const s = buildDashboardStats(this.world, this.recorder);
    this.$.tickDisplay.textContent = `tick ${s.world.tick}`;
    this.$.placeDisplay.textContent = `地点 ${s.world.birthPlace}`;
    this.$.dashboard.innerHTML = this.renderDashboard(s);
  }

  renderDashboard(s) {
    const cmp = s.population.cmp;
    const cmpBlock = cmp
      ? `
        <div class="stat-row"><span>存活</span><strong>${cmp.pop ?? s.population.alive}</strong></div>
        <div class="stat-row"><span>代号种数</span><strong>${cmp.codes ?? '—'}</strong></div>
        <div class="stat-row"><span>谱系根</span><strong>${cmp.lineageRoots ?? '—'}</strong></div>
        <div class="stat-row"><span>结构指数</span><strong>${cmp.structIdx ?? '—'}</strong></div>
        <div class="stat-row"><span>代号同质</span><strong>${cmp.codeHom ?? '—'}</strong></div>
        <div class="stat-row"><span>谱系同质</span><strong>${cmp.lineageHom ?? '—'}</strong></div>
      `
      : `<div class="stat-row"><span>存活</span><strong>${s.population.alive}</strong></div>`;

    const slotLines = Object.entries(s.population.slots)
      .map(([slot, n]) => `<div class="stat-row"><span>${slot}</span><strong>${n}</strong></div>`)
      .join('');

    const beingCards = s.beings
      .map(
        (b) => `
      <article class="being-card">
        <header class="being-head">
          <span class="being-id">${b.id.slice(-8)}</span>
          <span class="being-meta">${b.code} · ${b.slot} · 代${b.generation}</span>
        </header>
        <div class="being-grid">
          <div class="stat-row"><span>场压</span><strong>${fmt(b.stress)}</strong></div>
          <div class="stat-row"><span>LOW 连击</span><strong>${b.lowStreak}</strong></div>
          <div class="stat-row"><span>对外率</span><strong>${pct(b.extRate)}</strong></div>
          <div class="stat-row"><span>TX / ACT</span><strong>${b.tx} / ${b.act}</strong></div>
          <div class="stat-row"><span>摄取 DRW</span><strong>${b.drw}</strong></div>
          <div class="stat-row"><span>匮乏 LOW</span><strong>${b.low}</strong></div>
          <div class="stat-row"><span>膜完整性</span><strong>${fmt(b.integrity)}</strong></div>
          <div class="stat-row"><span>跨域 MBR</span><strong>${b.mbr}</strong></div>
        </div>
        <div class="being-domain">代谢域 e${b.cellBoundary.join(' e')}</div>
        <div class="being-regs" title="寄存器漂移">r ${b.registers.join(' ')}</div>
      </article>`
      )
      .join('');

    return `
      <section class="panel env-panel">
        <h2>环境</h2>
        <h3 class="term">数字基底场</h3>
        <pre class="field-state">${s.environment.substrate}</pre>
        <h3 class="term">行动标靶</h3>
        <pre class="field-state">${s.environment.nodes}</pre>
        <h3 class="term">环境脉搏与反馈</h3>
        <div class="stat-grid">
          <div class="stat-row"><span>脉搏 AMB</span><strong>${s.environment.amb}</strong></div>
          <div class="stat-row"><span>扰动 PTB</span><strong>${s.environment.ptb}</strong></div>
          <div class="stat-row"><span>回响 RES</span><strong>${s.environment.res}</strong></div>
          <div class="stat-row"><span>标靶 TGT</span><strong>${s.environment.tgt}</strong></div>
          <div class="stat-row"><span>枯竭 DEP</span><strong>${s.environment.dep}</strong></div>
          <div class="stat-row"><span>剧变 SHK</span><strong>${s.environment.shk}</strong></div>
          <div class="stat-row"><span>节点脉冲 NPL</span><strong>${s.environment.npl}</strong></div>
          <div class="stat-row"><span>生物圈 BIO</span><strong>${s.environment.bio}</strong></div>
        </div>
      </section>

      <section class="panel pop-panel">
        <h2>种群</h2>
        <h3 class="term">种群结构迹</h3>
        ${cmpBlock}
        <h3 class="term">存续与谱系</h3>
        <div class="stat-grid">
          <div class="stat-row"><span>存活 / 总量</span><strong>${s.population.alive} / ${s.population.total}</strong></div>
          <div class="stat-row"><span>终止 END</span><strong>${s.population.ended}</strong></div>
          <div class="stat-row"><span>续行 LINEAGE</span><strong>${s.population.lineage}</strong></div>
          <div class="stat-row"><span>争夺 contest</span><strong>${s.population.contest}</strong></div>
        </div>
        <h3 class="term">社会位</h3>
        <div class="stat-grid">${slotLines || '<div class="muted">—</div>'}</div>
      </section>

      <section class="panel beings-panel">
        <h2>个体</h2>
        <p class="panel-hint">自助求生 · 基底代谢 · 细胞边界 · 对外双型 · 寄存器漂移</p>
        <div class="beings-grid">${beingCards || '<p class="muted">无存活个体</p>'}</div>
      </section>
    `;
  }
}

function fmt(n) {
  if (n == null) return '—';
  return typeof n === 'number' ? n.toFixed(3) : String(n);
}

function pct(n) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}
