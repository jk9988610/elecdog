import { createWorld } from '../world/world.js';
import { performBirthRitual } from '../birth/ritual.js';
import { stepWorld } from '../kernel/engine.js';
import { Recorder } from '../recorder/logger.js';
import { buildDashboardStats } from './stats.js';
import {
  getCloudConfig,
  getObserverLabel,
  hasBuiltInCloudConfig,
  isCloudEnabled,
  setCloudConfig,
  setObserverLabel,
} from '../cloud/config.js';
import {
  archiveCurrentRun,
  fetchRecentArchives,
  fetchRecentNotes,
  saveFieldNote,
} from '../cloud/field-sync.js';
import { formatSupabaseError } from '../cloud/supabase-error.js';
import { getLogPublicUrl } from '../cloud/rest.js';

const SEED_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const SEED_ID = '0120260729010001';

export class ObserverApp {
  constructor(root, options = {}) {
    this.root = root;
    this.otaLabel = options.otaLabel || '';
    this.world = null;
    this.recorder = new Recorder();
    this.timer = null;
    this.speed = 200;
    this.cloudBusy = false;
    this.lastArchiveId = null;
    this.render();
    this.bootstrapWorld();
    this.refreshCloudPanel();
  }

  render() {
    this.root.innerHTML = `
      <header class="header">
        <h1>ElecDoge-电子狗-v1.0.1</h1>
        <p class="subtitle">世界实况 · 辞典统计</p>
      </header>

      <section class="toolbar">
        <button id="btn-run" type="button">运行</button>
        <button id="btn-pause" type="button" disabled>暂停</button>
        <label class="speed-label">间隔 <input id="speed" type="number" value="200" min="50" max="2000" step="50" /></label>
        <span id="tick-display" class="tick">tick 0</span>
        <span id="place-display" class="place"></span>
        ${this.otaLabel ? `<span id="ota-version" class="ota-version" title="当前网页热更新版本">${escapeHtml(this.otaLabel)}</span>` : ''}
        <span class="toolbar-spacer"></span>
        <span id="cloud-status" class="cloud-status" title="云同步状态">云 · 检测中</span>
        <button id="btn-cloud-archive" type="button" class="btn-secondary" disabled>上传田野归档</button>
        <button id="btn-cloud-toggle" type="button" class="btn-ghost">云设置</button>
      </section>

      <section id="cloud-panel" class="cloud-panel hidden">
        <div class="cloud-panel-grid">
          <div class="cloud-card">
            <h3>观察者</h3>
            <label class="cloud-field">昵称 <input id="observer-label" type="text" value="${escapeHtml(getObserverLabel())}" /></label>
            <button id="btn-save-observer" type="button" class="btn-secondary">保存昵称</button>
          </div>
          <div class="cloud-card">
            <h3>田野笔记</h3>
            <label class="cloud-field">OBS 编号 <input id="obs-id" type="text" placeholder="OBS-20260729-64" /></label>
            <label class="cloud-field">内容 <textarea id="obs-content" rows="3" placeholder="记录你看到的…"></textarea></label>
            <button id="btn-save-note" type="button" class="btn-secondary">保存笔记到云</button>
          </div>
          <div class="cloud-card cloud-card-wide">
            <h3>Supabase 连接</h3>
            <p class="cloud-hint">${hasBuiltInCloudConfig() ? '已内置与 Beat-Battle / Card-World 共用的 Supabase 项目。' : '请填写 Supabase URL 与 anon key。'}</p>
            <label class="cloud-field">Project URL <input id="sb-url" type="url" value="${escapeHtml(getCloudConfig().url)}" placeholder="https://xxx.supabase.co" /></label>
            <label class="cloud-field">anon key <input id="sb-key" type="password" value="${escapeHtml(getCloudConfig().anonKey)}" autocomplete="off" /></label>
            <div class="cloud-actions">
              <button id="btn-save-cloud" type="button" class="btn-secondary">保存配置</button>
              <button id="btn-refresh-cloud" type="button" class="btn-ghost">刷新列表</button>
            </div>
          </div>
        </div>
        <div class="cloud-lists">
          <div class="cloud-list-block">
            <h3>最近田野归档</h3>
            <ul id="cloud-runs" class="cloud-list"><li class="muted">加载中…</li></ul>
          </div>
          <div class="cloud-list-block">
            <h3>最近田野笔记</h3>
            <ul id="cloud-notes" class="cloud-list"><li class="muted">加载中…</li></ul>
          </div>
        </div>
        <p id="cloud-message" class="cloud-message" aria-live="polite"></p>
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
      cloudStatus: this.root.querySelector('#cloud-status'),
      btnCloudArchive: this.root.querySelector('#btn-cloud-archive'),
      btnCloudToggle: this.root.querySelector('#btn-cloud-toggle'),
      cloudPanel: this.root.querySelector('#cloud-panel'),
      observerLabel: this.root.querySelector('#observer-label'),
      btnSaveObserver: this.root.querySelector('#btn-save-observer'),
      obsId: this.root.querySelector('#obs-id'),
      obsContent: this.root.querySelector('#obs-content'),
      btnSaveNote: this.root.querySelector('#btn-save-note'),
      sbUrl: this.root.querySelector('#sb-url'),
      sbKey: this.root.querySelector('#sb-key'),
      btnSaveCloud: this.root.querySelector('#btn-save-cloud'),
      btnRefreshCloud: this.root.querySelector('#btn-refresh-cloud'),
      cloudRuns: this.root.querySelector('#cloud-runs'),
      cloudNotes: this.root.querySelector('#cloud-notes'),
      cloudMessage: this.root.querySelector('#cloud-message'),
    };

    this.$.btnRun.addEventListener('click', () => this.run());
    this.$.btnPause.addEventListener('click', () => this.pause());
    this.$.btnCloudToggle.addEventListener('click', () => this.toggleCloudPanel());
    this.$.btnCloudArchive.addEventListener('click', () => this.uploadArchive());
    this.$.btnSaveObserver.addEventListener('click', () => this.saveObserverLabel());
    this.$.btnSaveNote.addEventListener('click', () => this.saveNote());
    this.$.btnSaveCloud.addEventListener('click', () => this.saveCloudConfig());
    this.$.btnRefreshCloud.addEventListener('click', () => this.refreshCloudPanel());
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
    this.updateCloudStatus();
  }

  toggleCloudPanel() {
    this.$.cloudPanel.classList.toggle('hidden');
    if (!this.$.cloudPanel.classList.contains('hidden')) {
      this.refreshCloudPanel();
    }
  }

  setCloudMessage(text, isError = false) {
    this.$.cloudMessage.textContent = text || '';
    this.$.cloudMessage.classList.toggle('error', Boolean(isError));
  }

  updateCloudStatus() {
    const enabled = isCloudEnabled();
    this.$.cloudStatus.textContent = enabled ? '云 · 已连接' : '云 · 未配置';
    this.$.cloudStatus.classList.toggle('online', enabled);
    this.$.btnCloudArchive.disabled = !enabled || this.cloudBusy || !this.world;
  }

  async refreshCloudPanel() {
    this.updateCloudStatus();
    if (!isCloudEnabled()) {
      this.$.cloudRuns.innerHTML = '<li class="muted">请先配置 Supabase</li>';
      this.$.cloudNotes.innerHTML = '<li class="muted">请先配置 Supabase</li>';
      return;
    }
    try {
      const [runs, notes] = await Promise.all([fetchRecentArchives(8), fetchRecentNotes(8)]);
      this.$.cloudRuns.innerHTML = this.renderRunList(runs);
      this.$.cloudNotes.innerHTML = this.renderNoteList(notes);
      this.setCloudMessage('');
    } catch (err) {
      this.$.cloudRuns.innerHTML = '<li class="muted">加载失败</li>';
      this.$.cloudNotes.innerHTML = '<li class="muted">加载失败</li>';
      this.setCloudMessage(formatSupabaseError(err), true);
    }
  }

  renderRunList(runs) {
    if (!runs?.length) return '<li class="muted">暂无归档</li>';
    return runs
      .map((r) => {
        const logUrl = r.log_path ? getLogPublicUrl(r.log_path) : '';
        const link = logUrl
          ? `<a href="${escapeHtml(logUrl)}" target="_blank" rel="noopener">日志</a>`
          : '';
        return `<li>
          <span class="cloud-list-title">${escapeHtml(r.world_name || '世界')} · tick ${r.tick}</span>
          <span class="cloud-list-meta">${escapeHtml(r.observer_label || '—')} · 存活 ${r.alive_count}/${r.total_beings} · ${fmtDate(r.created_at)} ${link}</span>
        </li>`;
      })
      .join('');
  }

  renderNoteList(notes) {
    if (!notes?.length) return '<li class="muted">暂无笔记</li>';
    return notes
      .map(
        (n) => `<li>
          <span class="cloud-list-title">${escapeHtml(n.obs_id)}</span>
          <span class="cloud-list-meta">${escapeHtml(n.author_label || '—')} · ${fmtDate(n.created_at)}</span>
          <span class="cloud-list-body">${escapeHtml(n.content.slice(0, 120))}${n.content.length > 120 ? '…' : ''}</span>
        </li>`
      )
      .join('');
  }

  saveObserverLabel() {
    try {
      setObserverLabel(this.$.observerLabel.value);
      this.setCloudMessage('观察者昵称已保存');
    } catch (err) {
      this.setCloudMessage(err.message, true);
    }
  }

  saveCloudConfig() {
    setCloudConfig({ url: this.$.sbUrl.value, anonKey: this.$.sbKey.value });
    this.updateCloudStatus();
    this.setCloudMessage('云配置已保存');
    this.refreshCloudPanel();
  }

  async uploadArchive() {
    if (!this.world || this.cloudBusy) return;
    this.cloudBusy = true;
    this.updateCloudStatus();
    this.setCloudMessage('正在上传田野归档…');
    try {
      const row = await archiveCurrentRun(this.world, this.recorder);
      this.lastArchiveId = row.id;
      this.setCloudMessage(`归档成功 · tick ${row.tick} · ${row.log_path || ''}`);
      await this.refreshCloudPanel();
    } catch (err) {
      this.setCloudMessage(formatSupabaseError(err), true);
    } finally {
      this.cloudBusy = false;
      this.updateCloudStatus();
    }
  }

  async saveNote() {
    this.setCloudMessage('正在保存笔记…');
    try {
      await saveFieldNote({
        obsId: this.$.obsId.value,
        content: this.$.obsContent.value,
        relatedRunId: this.lastArchiveId,
      });
      this.$.obsContent.value = '';
      this.setCloudMessage('田野笔记已保存到云');
      await this.refreshCloudPanel();
    } catch (err) {
      this.setCloudMessage(formatSupabaseError(err), true);
    }
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
          <div class="stat-row"><span>筛选 SEL</span><strong>${s.population.selection}</strong></div>
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

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return iso;
  }
}
