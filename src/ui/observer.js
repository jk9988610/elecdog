import { createWorld } from '../world/world.js';
import { performBirthRitual } from '../birth/ritual.js';
import { spawnCarriedBeing } from '../birth/spawn.js';
import { spawnBeing } from '../birth/spawn.js';
import { spawnAdultMulticellCohort } from '../birth/adult-cohort.js';
import { buildObserverNaiveSpecs } from '../carry/mixed-cohort.js';
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
  loadArchivePreview,
  saveFieldNote,
} from '../cloud/field-sync.js';
import { formatSupabaseError } from '../cloud/supabase-error.js';
import { getLogPublicUrl } from '../cloud/rest.js';
import { fetchCodexEntries } from '../cloud/codex-sync.js';
import { subscribeFieldCloud, stopFieldCloudSubscription } from '../cloud/realtime.js';
import {
  getObserverEnvId,
  observerEnvHint,
  observerEnvLabel,
  OBSERVER_ENV_IDS,
  setObserverEnvId,
} from './env-select.js';
import { applyEnvProfile, initEnvStackModules } from '../world/env-profile.js';
import {
  getViewMode,
  label,
  formatGeneration,
  formatExpStage,
  formatRegMode,
  formatMetProfile,
  formatCoopMode,
  formatRprMode,
  formatEhuStage,
  formatSlot,
  formatBand,
  formatTerrain,
  formatPatch,
  formatDiurnalQuarter,
  formatSeasonPhase,
  formatLunarPhase,
  setViewMode as saveViewMode,
  viewModeHint,
  semViewModeHint,
  wlReproViewModeHint,
  VIEW_ANALOGY,
  VIEW_NATIVE,
} from './analogy.js';
import { renderCodexPanelHTML, initCodexPanel } from './codex.js';
import { renderImmersionPanel } from './immersion.js';
import { renderEnvStackPanel } from './env-stack.js';
import { renderSemStackPanel } from './sem-stack.js';
import { renderWlReproStackPanel } from './wl-repro-stack.js';
import { renderCarryPanel } from './carry-panel.js';
import { renderCarryImportPanelHTML, initCarryImportPanel } from './carry-import.js';
import { suggestObserverEnvId } from '../carry/import-report.js';
import { renderMindStreamPanelHTML, initMindStreamPanel } from './mind-stream.js';
import { renderSemSignalStreamPanelHTML, initSemSignalStreamPanel } from './sem-signal-stream.js';
import { renderThoughtSpeechPanelHTML, initThoughtSpeechPanel } from './thought-speech.js';
import { renderGenealogyPanelHTML, initGenealogyPanel } from './genealogy-tree.js';
import {
  getObserverLayoutMode,
  setObserverLayoutMode,
  shouldShowGenealogyPanel,
  observerLayoutHint,
  LAYOUT_GENEALOGY,
  LAYOUT_CLASSIC,
} from './observer-layout.js';
import {
  renderMulticellClassicBeingCard,
  initClassicMulticellHealthButtons,
} from './observer-classic-multicell.js';
import { populationLayerEnabled } from '../world/multicell-v2.js';

const SEED_DNA =
  '300303230322133312222231123010332200320013122030231012321231020111313313212021231101211320032303';
const SEED_ID = '0120260729010001';

export class ObserverApp {
  constructor(root, options = {}) {
    this.root = root;
    this.otaLabel = options.otaLabel || '';
    this.otaStatus = options.otaStatus || '';
    this.nativeShell = Boolean(options.nativeShell);
    this.world = null;
    this.recorder = new Recorder();
    this.timer = null;
    this.speed = 200;
    this.cloudBusy = false;
    this.otaBusy = false;
    this.cloudRealtime = false;
    this.cloudUnsub = null;
    this.viewMode = getViewMode();
    this.observerLayout = getObserverLayoutMode();
    this.envProfileId = getObserverEnvId();
    this.lastArchiveId = null;
    this.render();
    this.bootstrapWorld();
    this.refreshCloudPanel();
    this.startCloudRealtime();
  }

  render() {
    this.root.innerHTML = `
      <header class="header">
        <h1>ElecDoge-电子狗-v1.0.3</h1>
        <p class="subtitle">世界实况 · 意识观察</p>
      </header>

      <section class="toolbar">
        <button id="btn-run" type="button">运行</button>
        <button id="btn-pause" type="button" disabled>暂停</button>
        <label class="speed-label">间隔 <input id="speed" type="number" value="200" min="50" max="2000" step="50" /></label>
        <span id="tick-display" class="tick">tick 0</span>
        <span id="place-display" class="place"></span>
        ${this.otaLabel ? `<span id="ota-version" class="ota-version" title="当前网页热更新版本">${escapeHtml(this.otaLabel)}</span>` : ''}
        ${this.nativeShell ? `<button id="btn-ota-check" type="button" class="btn-ghost">检查热更</button>` : `<button id="btn-ota-check" type="button" class="btn-ghost">检查线上版本</button>`}
        <span id="ota-status" class="ota-status" title="热更新/线上版本状态">${escapeHtml(this.otaStatus)}</span>
        <span class="toolbar-spacer"></span>
        <label class="env-label" title="切换后重置世界并应用环境规则">
          环境
          <select id="env-profile" class="env-select"></select>
        </label>
        <button id="btn-reset-world" type="button" class="btn-ghost">重置世界</button>
        <span class="toolbar-spacer"></span>
        <span class="view-mode-group" title="${escapeHtml(viewModeHint())}">
          <button id="btn-view-native" type="button" class="btn-ghost view-mode-btn ${this.viewMode === VIEW_NATIVE ? 'active' : ''}">原版</button>
          <button id="btn-view-analogy" type="button" class="btn-ghost view-mode-btn ${this.viewMode === VIEW_ANALOGY ? 'active' : ''}">类比</button>
        </span>
        <span id="observer-layout-group" class="view-mode-group hidden" title="${escapeHtml(observerLayoutHint())}">
          <button id="btn-layout-genealogy" type="button" class="btn-ghost view-mode-btn ${this.observerLayout === LAYOUT_GENEALOGY ? 'active' : ''}">族谱</button>
          <button id="btn-layout-classic" type="button" class="btn-ghost view-mode-btn ${this.observerLayout === LAYOUT_CLASSIC ? 'active' : ''}">经典卡片</button>
        </span>
        <span id="cloud-status" class="cloud-status" title="云同步状态">云 · 检测中</span>
        <button id="btn-cloud-archive" type="button" class="btn-secondary" disabled>上传田野归档</button>
        <button id="btn-cloud-toggle" type="button" class="btn-ghost">云设置</button>
        <button id="btn-codex-toggle" type="button" class="btn-ghost">辞典</button>
        <button id="btn-carry-import-toggle" type="button" class="btn-ghost">导入留置</button>
        <button id="btn-mind-stream-toggle" type="button" class="btn-ghost">内在流</button>
        <button id="btn-sem-signal-toggle" type="button" class="btn-ghost">信号类比</button>
        <button id="btn-thought-speech-toggle" type="button" class="btn-ghost">思考外化</button>
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
            <p class="cloud-hint">${hasBuiltInCloudConfig() ? '已内置与 Beat-Battle / Card-World 共用的 Supabase 项目。开启 Realtime 后，其他设备上传归档或笔记会自动刷新列表。' : '请填写 Supabase URL 与 anon key。'}</p>
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
        <div id="cloud-preview" class="cloud-preview hidden">
          <div class="cloud-preview-head">
            <h3 id="cloud-preview-title">归档预览</h3>
            <button id="btn-close-preview" type="button" class="btn-ghost">关闭</button>
          </div>
          <pre id="cloud-preview-body" class="cloud-preview-body"></pre>
        </div>
        <p id="cloud-message" class="cloud-message" aria-live="polite"></p>
      </section>

      ${renderCodexPanelHTML()}

      ${renderCarryImportPanelHTML()}

      ${renderMindStreamPanelHTML()}

      ${renderSemSignalStreamPanelHTML()}

      ${renderThoughtSpeechPanelHTML()}

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
      cloudPreview: this.root.querySelector('#cloud-preview'),
      cloudPreviewTitle: this.root.querySelector('#cloud-preview-title'),
      cloudPreviewBody: this.root.querySelector('#cloud-preview-body'),
      btnClosePreview: this.root.querySelector('#btn-close-preview'),
      cloudMessage: this.root.querySelector('#cloud-message'),
      btnOtaCheck: this.root.querySelector('#btn-ota-check'),
      otaStatus: this.root.querySelector('#ota-status'),
      otaVersion: this.root.querySelector('#ota-version'),
      btnViewNative: this.root.querySelector('#btn-view-native'),
      btnViewAnalogy: this.root.querySelector('#btn-view-analogy'),
      observerLayoutGroup: this.root.querySelector('#observer-layout-group'),
      btnLayoutGenealogy: this.root.querySelector('#btn-layout-genealogy'),
      btnLayoutClassic: this.root.querySelector('#btn-layout-classic'),
      envProfile: this.root.querySelector('#env-profile'),
      btnResetWorld: this.root.querySelector('#btn-reset-world'),
      btnCodexToggle: this.root.querySelector('#btn-codex-toggle'),
      btnCarryImportToggle: this.root.querySelector('#btn-carry-import-toggle'),
      btnMindStreamToggle: this.root.querySelector('#btn-mind-stream-toggle'),
      btnSemSignalToggle: this.root.querySelector('#btn-sem-signal-toggle'),
      btnThoughtSpeechToggle: this.root.querySelector('#btn-thought-speech-toggle'),
    };

    this.codexPanel = initCodexPanel(this.root, {
      onClose: () => this.closeCodexPanel(),
      fetchCloudEntries: () => fetchCodexEntries(),
    });

    this.mindStreamPanel = initMindStreamPanel(this.root, {
      getRecorder: () => this.recorder,
      getWorld: () => this.world,
      onClose: () => this.closeMindStreamPanel(),
    });

    this.semSignalPanel = initSemSignalStreamPanel(this.root, {
      getRecorder: () => this.recorder,
      getWorld: () => this.world,
      onClose: () => this.closeSemSignalPanel(),
    });

    this.thoughtSpeechPanel = initThoughtSpeechPanel(this.root, {
      getRecorder: () => this.recorder,
      getWorld: () => this.world,
      onClose: () => this.closeThoughtSpeechPanel(),
    });

    this.carryImportPanel = initCarryImportPanel(this.root, {
      onImport: ({ entry, report }) => {
        const envId = suggestObserverEnvId(report, entry);
        this.bootstrapWithCarries([entry.snapshot], {
          envId,
          phase: entry.phase,
          treatmentId: entry.treatmentId,
          seed: entry.seed,
        });
        this.closeCarryImportPanel();
      },
      onImportMixed: ({ entries, report, runGroup, naiveCount, seed }) => {
        const envId = suggestObserverEnvId(report, entries[0]);
        this.bootstrapMixedImport({
          carrySnapshots: entries.map((e) => e.snapshot),
          naiveCount,
          seed,
          envId,
          phase: runGroup.phase,
          treatmentId: runGroup.treatmentId,
        });
        this.closeCarryImportPanel();
      },
      onClose: () => this.closeCarryImportPanel(),
    });

    this.renderEnvOptions();

    this.$.btnRun.addEventListener('click', () => this.run());
    this.$.btnPause.addEventListener('click', () => this.pause());
    if (this.$.btnOtaCheck) {
      this.$.btnOtaCheck.addEventListener('click', () => this.checkOta());
    }
    this.$.btnCloudToggle.addEventListener('click', () => this.toggleCloudPanel());
    this.$.btnCloudArchive.addEventListener('click', () => this.uploadArchive());
    this.$.btnSaveObserver.addEventListener('click', () => this.saveObserverLabel());
    this.$.btnSaveNote.addEventListener('click', () => this.saveNote());
    this.$.btnSaveCloud.addEventListener('click', () => this.saveCloudConfig());
    this.$.btnRefreshCloud.addEventListener('click', () => this.refreshCloudPanel());
    this.$.cloudRuns.addEventListener('click', (e) => this.onCloudRunClick(e));
    this.$.btnClosePreview?.addEventListener('click', () => this.closeArchivePreview());
    this.$.btnViewNative?.addEventListener('click', () => this.switchViewMode(VIEW_NATIVE));
    this.$.btnViewAnalogy?.addEventListener('click', () => this.switchViewMode(VIEW_ANALOGY));
    this.$.btnLayoutGenealogy?.addEventListener('click', () => this.switchObserverLayout(LAYOUT_GENEALOGY));
    this.$.btnLayoutClassic?.addEventListener('click', () => this.switchObserverLayout(LAYOUT_CLASSIC));
    this.$.envProfile?.addEventListener('change', () => this.onEnvProfileChange());
    this.$.btnResetWorld?.addEventListener('click', () => this.resetWorld());
    this.$.btnCodexToggle?.addEventListener('click', () => this.toggleCodexPanel());
    this.$.btnCarryImportToggle?.addEventListener('click', () => this.toggleCarryImportPanel());
    this.$.btnMindStreamToggle?.addEventListener('click', () => this.toggleMindStreamPanel());
    this.$.btnSemSignalToggle?.addEventListener('click', () => this.toggleSemSignalPanel());
    this.$.btnThoughtSpeechToggle?.addEventListener('click', () => this.toggleThoughtSpeechPanel());
  }

  toggleCarryImportPanel() {
    if (!this.carryImportPanel) return;
    if (this.carryImportPanel.isOpen()) {
      this.closeCarryImportPanel();
    } else {
      this.$.cloudPanel?.classList.add('hidden');
      this.closeCodexPanel();
      this.closeMindStreamPanel();
      this.closeSemSignalPanel();
      this.closeThoughtSpeechPanel();
      this.carryImportPanel.open();
      this.$.btnCarryImportToggle?.classList.add('active');
    }
  }

  closeCarryImportPanel() {
    this.carryImportPanel?.close();
    this.$.btnCarryImportToggle?.classList.remove('active');
  }

  toggleMindStreamPanel() {
    if (!this.mindStreamPanel) return;
    if (this.mindStreamPanel.isOpen()) {
      this.closeMindStreamPanel();
    } else {
      this.$.cloudPanel?.classList.add('hidden');
      this.closeCodexPanel();
      this.closeSemSignalPanel();
      this.closeThoughtSpeechPanel();
      this.mindStreamPanel.open();
      this.$.btnMindStreamToggle?.classList.add('active');
    }
  }

  closeMindStreamPanel() {
    this.mindStreamPanel?.close();
    this.$.btnMindStreamToggle?.classList.remove('active');
  }

  toggleSemSignalPanel() {
    if (!this.semSignalPanel) return;
    if (this.semSignalPanel.isOpen()) {
      this.closeSemSignalPanel();
    } else {
      this.$.cloudPanel?.classList.add('hidden');
      this.closeCodexPanel();
      this.closeMindStreamPanel();
      this.closeThoughtSpeechPanel();
      this.semSignalPanel.open();
      this.$.btnSemSignalToggle?.classList.add('active');
    }
  }

  closeSemSignalPanel() {
    this.semSignalPanel?.close();
    this.$.btnSemSignalToggle?.classList.remove('active');
  }

  toggleThoughtSpeechPanel() {
    if (!this.thoughtSpeechPanel) return;
    if (this.thoughtSpeechPanel.isOpen()) {
      this.closeThoughtSpeechPanel();
    } else {
      this.$.cloudPanel?.classList.add('hidden');
      this.closeCodexPanel();
      this.closeMindStreamPanel();
      this.closeSemSignalPanel();
      this.thoughtSpeechPanel.open();
      this.$.btnThoughtSpeechToggle?.classList.add('active');
    }
  }

  closeThoughtSpeechPanel() {
    this.thoughtSpeechPanel?.close();
    this.$.btnThoughtSpeechToggle?.classList.remove('active');
  }

  toggleCodexPanel() {
    if (!this.codexPanel) return;
    if (this.codexPanel.isOpen()) {
      this.closeCodexPanel();
    } else {
      this.$.cloudPanel?.classList.add('hidden');
      this.closeMindStreamPanel();
      this.closeSemSignalPanel();
      this.closeThoughtSpeechPanel();
      this.codexPanel.open();
      this.$.btnCodexToggle?.classList.add('active');
    }
  }

  closeCodexPanel() {
    this.codexPanel?.close();
    this.$.btnCodexToggle?.classList.remove('active');
  }

  renderEnvOptions() {
    if (!this.$.envProfile) return;
    this.$.envProfile.innerHTML = OBSERVER_ENV_IDS.map(
      (id) =>
        `<option value="${id}" title="${escapeHtml(observerEnvHint(id))}">${escapeHtml(observerEnvLabel(id))}</option>`
    ).join('');
    this.$.envProfile.value = this.envProfileId;
  }

  onEnvProfileChange() {
    const id = this.$.envProfile?.value;
    if (!id || id === this.envProfileId) return;
    try {
      setObserverEnvId(id);
      this.envProfileId = id;
      this.resetWorld();
    } catch (err) {
      this.$.envProfile.value = this.envProfileId;
      alert(err.message);
    }
  }

  resetWorld() {
    this.pause();
    this.recorder.clear();
    this.bootstrapWorld();
    this.run();
  }

  switchObserverLayout(mode) {
    this.observerLayout = setObserverLayoutMode(mode);
    this.$.btnLayoutGenealogy?.classList.toggle('active', mode === LAYOUT_GENEALOGY);
    this.$.btnLayoutClassic?.classList.toggle('active', mode === LAYOUT_CLASSIC);
    this.refresh();
  }

  switchViewMode(mode) {
    saveViewMode(mode);
    this.viewMode = mode;
    this.$.btnViewNative?.classList.toggle('active', mode === VIEW_NATIVE);
    this.$.btnViewAnalogy?.classList.toggle('active', mode === VIEW_ANALOGY);
    this.renderEnvOptions();
    if (this.$.envProfile) this.$.envProfile.value = this.envProfileId;
    this.refresh();
  }

  bootstrapWorld() {
    this.bootstrapWithCarries(null);
  }

  bootstrapWithCarries(snapshots, meta = {}) {
    this.pause();
    this.recorder.clear();
    this._applyObserverEnv(meta.envId);

    this.world = createWorld('01');
    applyEnvProfile(this.world, this.envProfileId);
    initEnvStackModules(this.world);

    if (snapshots?.length) {
      this.recorder.system(
        0,
        `[观察台] 留置导入 p${meta.phase ?? '?'} ${meta.treatmentId ?? ''} seed${meta.seed ?? ''}`
      );
      snapshots.forEach((snap, i) => {
        spawnCarriedBeing(this.world, this.recorder, snap, {
          cohortTag: 'carry',
          fixedId: `01imp${String(i + 1).padStart(3, '0')}`,
        });
      });
    } else if (this.envProfileId === 'multicell_v2_world') {
      this.recorder.system(0, `[观察台] 环境 ${this.envProfileId} · 8 成体（4雄4雌）`);
      spawnAdultMulticellCohort(this.world, this.recorder, { males: 4, females: 4 });
    } else {
      this.recorder.system(0, `[观察台] 环境 ${this.envProfileId}`);
      const seeds = [
        { name: '观察者', code: '001', dnaSequence: SEED_DNA, id: SEED_ID, pairMorph: 'A' },
        { name: '002', code: '002', pairMorph: 'B' },
        { name: '003', code: '003', pairMorph: 'A' },
        { name: '001-乙', code: '001', pairMorph: 'B' },
      ];
      for (const s of seeds) {
        performBirthRitual(this.world, this.recorder, s);
      }
    }

    this.refresh();
    this.run();
  }

  bootstrapMixedImport({ carrySnapshots = [], naiveCount = 4, seed = 0, envId, phase, treatmentId } = {}) {
    this.pause();
    this.recorder.clear();
    this._applyObserverEnv(envId);

    this.world = createWorld('01');
    applyEnvProfile(this.world, this.envProfileId);
    initEnvStackModules(this.world);

    this.recorder.system(
      0,
      `[观察台] 混编导入 p${phase ?? '?'} ${treatmentId ?? ''} seed${seed} · ${naiveCount} naive + ${carrySnapshots.length} carry`
    );

    for (const spec of buildObserverNaiveSpecs(seed, naiveCount, this.world.envProfile)) {
      spawnBeing(this.world, this.recorder, spec);
    }

    carrySnapshots.forEach((snap, i) => {
      spawnCarriedBeing(this.world, this.recorder, snap, {
        cohortTag: 'carry',
        fixedId: `01carry${seed}${String(i + 1).padStart(3, '0')}`,
      });
    });

    this.refresh();
    this.run();
  }

  _applyObserverEnv(envId) {
    if (envId && envId !== this.envProfileId && OBSERVER_ENV_IDS.includes(envId)) {
      setObserverEnvId(envId);
      this.envProfileId = envId;
      this.renderEnvOptions();
      if (this.$.envProfile) this.$.envProfile.value = envId;
    }
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
    const envTag = s.world.envLabel ? ` · ${s.world.envLabel}` : '';
    this.$.placeDisplay.textContent = `地点 ${s.world.birthPlace}${envTag}`;
    this.$.dashboard.innerHTML = this.renderDashboard(s);
    this.$.dashboard.querySelectorAll('[data-codex-entry]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-codex-entry');
        this.codexPanel?.openEntry?.(id);
      });
    });
    this.mindStreamPanel?.refresh();
    this.semSignalPanel?.refresh();
    this.thoughtSpeechPanel?.refresh();
    if (shouldShowGenealogyPanel(this.world?.envProfile, this.observerLayout)) {
      this.genealogyPanel = initGenealogyPanel(this.$.dashboard, {
        getWorld: () => this.world,
      });
      this.genealogyPanel?.paint();
    } else if (
      this.world?.envProfile &&
      !populationLayerEnabled(this.world.envProfile) &&
      this.observerLayout === LAYOUT_CLASSIC
    ) {
      initClassicMulticellHealthButtons(this.$.dashboard, { getWorld: () => this.world });
    }
    this.$.observerLayoutGroup?.classList.toggle(
      'hidden',
      !s.world.multicellV2Observer
    );
    this.updateCloudStatus();
  }

  toggleCloudPanel() {
    this.$.cloudPanel.classList.toggle('hidden');
    if (!this.$.cloudPanel.classList.contains('hidden')) {
      this.closeCodexPanel();
      this.closeMindStreamPanel();
      this.refreshCloudPanel();
    }
  }

  async checkOta() {
    if (this.otaBusy) return;
    this.otaBusy = true;
    if (this.$.btnOtaCheck) this.$.btnOtaCheck.disabled = true;
    this.setOtaStatus('检查中…');
    try {
      if (this.nativeShell) {
        const { runOtaBootstrapNative } = await import('../ota/native-bridge.js');
        const ota = await runOtaBootstrapNative();
        if (ota.updated) return;
        if (this.$.otaVersion && ota.label) this.$.otaVersion.textContent = ota.label;
        this.setOtaStatus(ota.status || '完成');
      } else {
        const { checkWebOtaStatus } = await import('../ota/native-bridge.js');
        const { SITE_OTA_VERSION } = await import('../site-build.js');
        const web = await checkWebOtaStatus(SITE_OTA_VERSION);
        if (this.$.otaVersion) {
          this.$.otaVersion.textContent = web.local !== 'dev' ? `网页 ${web.local}` : '网页 dev';
        }
        this.setOtaStatus(web.status);
        if (web.newer) {
          this.setOtaStatus(`${web.status} · 可 Ctrl+Shift+R 强制刷新`);
        }
      }
    } catch (err) {
      this.setOtaStatus(`失败: ${err?.message || err}`);
    } finally {
      this.otaBusy = false;
      if (this.$.btnOtaCheck) this.$.btnOtaCheck.disabled = false;
    }
  }

  setOtaStatus(text) {
    if (!this.$.otaStatus) {
      const toolbar = this.root.querySelector('.toolbar');
      if (!toolbar || !text) return;
      const span = document.createElement('span');
      span.id = 'ota-status';
      span.className = 'ota-status';
      span.title = '热更新状态';
      toolbar.insertBefore(span, toolbar.querySelector('.toolbar-spacer'));
      this.$.otaStatus = span;
    }
    if (this.$.otaStatus) this.$.otaStatus.textContent = text;
  }

  setCloudMessage(text, isError = false) {
    this.$.cloudMessage.textContent = text || '';
    this.$.cloudMessage.classList.toggle('error', Boolean(isError));
  }

  updateCloudStatus() {
    const enabled = isCloudEnabled();
    if (enabled) {
      this.$.cloudStatus.textContent = this.cloudRealtime ? '云 · 实时' : '云 · 已连接';
    } else {
      this.$.cloudStatus.textContent = '云 · 未配置';
    }
    this.$.cloudStatus.classList.toggle('online', enabled);
    this.$.cloudStatus.classList.toggle('realtime', enabled && this.cloudRealtime);
    this.$.btnCloudArchive.disabled = !enabled || this.cloudBusy || !this.world;
  }

  async startCloudRealtime() {
    if (!isCloudEnabled()) return;
    try {
      this.cloudUnsub = await subscribeFieldCloud({
        onArchive: (row) => this.onRealtimeArchive(row),
        onNote: (row) => this.onRealtimeNote(row),
        onCodex: (row) => this.onRealtimeCodex(row),
        onStatus: (status) => {
          if (status === 'SUBSCRIBED') {
            this.cloudRealtime = true;
            this.updateCloudStatus();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.cloudRealtime = false;
            this.updateCloudStatus();
          }
        },
      });
    } catch {
      this.cloudRealtime = false;
      this.updateCloudStatus();
    }
  }

  stopCloudRealtime() {
    stopFieldCloudSubscription();
    this.cloudUnsub = null;
    this.cloudRealtime = false;
    this.updateCloudStatus();
  }

  onRealtimeArchive(row) {
    const title = row?.world_name || '归档';
    const who = row?.observer_label || '—';
    this.setCloudMessage(`实时：${who} 上传了 ${title} · tick ${row?.tick ?? '—'}`);
    this.refreshCloudPanel();
  }

  onRealtimeNote(row) {
    const id = row?.obs_id || '笔记';
    const who = row?.author_label || '—';
    this.setCloudMessage(`实时：${who} 保存了 ${id}`);
    this.refreshCloudPanel();
  }

  onRealtimeCodex(row) {
    const title = row?.title || row?.id || '辞典';
    this.setCloudMessage(`实时：辞典更新 ${title}`);
    this.codexPanel?.refreshFromCloud?.();
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
          ? `<a href="${escapeHtml(logUrl)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">原始 JSON</a>`
          : '';
        const kind =
          r.summary?.kind === 'field-consciousness-manifest'
            ? '意识归档'
            : r.summary?.kind === 'field-full-stack-manifest'
              ? '全栈归档'
              : r.summary?.kind === 'field-stack-manifest'
                ? '栈归档'
                : r.summary?.kind === 'field-batch'
                  ? '批处理'
                  : '观察台';
        return `<li class="cloud-run-item" data-log-path="${escapeHtml(r.log_path || '')}" data-run-title="${escapeHtml(r.world_name || '归档')}">
          <span class="cloud-list-title">${escapeHtml(r.world_name || '世界')} · tick ${r.tick} <span class="cloud-tag">${kind}</span></span>
          <span class="cloud-list-meta">${escapeHtml(r.observer_label || '—')} · 存活 ${r.alive_count}/${r.total_beings} · ${fmtDate(r.created_at)} · ${link} · <button type="button" class="link-btn" data-preview>预览</button></span>
        </li>`;
      })
      .join('');
  }

  onCloudRunClick(e) {
    const btn = e.target.closest('[data-preview]');
    const item = e.target.closest('.cloud-run-item');
    if (!btn && !item) return;
    const path = item?.dataset?.logPath;
    const title = item?.dataset?.runTitle || '归档';
    if (path) this.previewArchive(title, path);
  }

  closeArchivePreview() {
    this.$.cloudPreview?.classList.add('hidden');
    this.$.cloudPreviewBody.textContent = '';
  }

  async previewArchive(title, logPath) {
    this.$.cloudPreview?.classList.remove('hidden');
    this.$.cloudPreviewTitle.textContent = `归档预览 · ${title}`;
    this.$.cloudPreviewBody.textContent = '加载中…';
    this.setCloudMessage('');
    try {
      const preview = await loadArchivePreview(logPath);
      const lines = [];
      lines.push(`类型: ${preview.kind}`);
      if (preview.exportedAt) lines.push(`导出: ${preview.exportedAt}`);
      if (preview.world) {
        lines.push(`世界: ${preview.world.name} · tick ${preview.world.tick} · 存活 ${preview.world.aliveCount ?? '—'}/${preview.world.beingCount ?? '—'}`);
        if (preview.world.endedCount != null) {
          lines.push(`END 登记: ${preview.world.endedCount}`);
        }
      }
      if (preview.genealogy?.nodeCount != null) {
        lines.push(
          `族谱: ${preview.genealogy.nodeCount} 节点 · 存活 ${preview.genealogy.aliveCount ?? '—'} · END ${preview.genealogy.endedCount ?? '—'}`
        );
      }
      const sum = preview.summary ?? preview.report?.summary;
      if (sum?.phase) {
        lines.push(`Phase: ${sum.phase} · ${sum.extension ?? ''}`);
        if (sum.cohort) lines.push(`队列: ${sum.cohort} · ${sum.seedCount ?? '—'} 种子`);
        if (sum.headline) {
          lines.push(
            `指标: ${sum.headline.metric}=${sum.headline.value} (${sum.headline.treatmentLabel ?? sum.headline.treatmentId})`
          );
        }
        if (sum.headlines?.length) {
          const title =
            sum.kind === 'field-consciousness-manifest' ? '— 意识线指标 —' : '— 栈指标 —';
          lines.push(title);
          for (const h of sum.headlines) {
            lines.push(`  P${h.phase} ${h.metric}=${h.value} · ${h.treatment}`);
          }
        }
        if (sum.treatments?.length) {
          lines.push('— 处理组均值 —');
          for (const t of sum.treatments) {
            const bits = Object.entries(t)
              .filter(([k, v]) => k.startsWith('mean') && v != null)
              .map(([k, v]) => `${k.replace(/^mean/, '').toUpperCase()}=${v}`);
            lines.push(`  ${t.label ?? t.id}: ${bits.join(' · ')}`);
          }
        } else if (sum.keys?.length) {
          lines.push(`键: ${sum.keys.join(', ')}`);
        }
      }
      lines.push(`日志条目: ${preview.entryCount}`);
      lines.push('');
      if (preview.report && !sum?.treatments?.length && !sum?.headlines?.length) {
        lines.push('— 批处理报告摘要 —');
        const body =
          preview.report.phases || preview.report.aggregate
            ? {
                phase: preview.report.phase,
                extension: preview.report.extension,
                aggregate: preview.report.aggregate,
                headlines: preview.report.headlines,
                phases: preview.report.phases,
              }
            : preview.report;
        lines.push(JSON.stringify(body, null, 2).slice(0, 4000));
        if (JSON.stringify(body).length > 4000) lines.push('…（已截断，点「原始 JSON」查看完整）');
      }
      if (preview.previewEntries.length) {
        lines.push('');
        lines.push(`— 最近 ${preview.previewEntries.length} 条日志 —`);
        for (const entry of preview.previewEntries) {
          const who = entry.beingId ? ` ${entry.beingId.slice(-8)}` : '';
          lines.push(`t${entry.tick}\t${entry.channel}${who}\t${entry.content}`);
        }
      }
      this.$.cloudPreviewBody.textContent = lines.join('\n');
    } catch (err) {
      this.$.cloudPreviewBody.textContent = '';
      this.setCloudMessage(formatSupabaseError(err), true);
    }
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
    this.stopCloudRealtime();
    this.updateCloudStatus();
    this.setCloudMessage('云配置已保存');
    this.refreshCloudPanel();
    this.startCloudRealtime();
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
      .map(([slot, n]) => `<div class="stat-row"><span>${formatSlot(slot)}</span><strong>${n}</strong></div>`)
      .join('');

    const statsById = new Map(s.beings.map((b) => [b.id, b]));
    const useMulticellClassic =
      !populationLayerEnabled(this.world?.envProfile) && this.observerLayout === LAYOUT_CLASSIC;

    const beingCards = useMulticellClassic
      ? (this.world?.beings.filter((b) => b.alive) ?? [])
          .map((being) =>
            renderMulticellClassicBeingCard(being, this.world, statsById.get(being.id))
          )
          .join('')
      : s.beings
          .map(
            (b) => `
      <article class="being-card">
        <header class="being-head">
          <span class="being-id">${b.id.slice(-8)}</span>
          <span class="being-meta">${b.code} · ${formatSlot(b.slot)} · ${formatGeneration(b.generation)} · ${label('aliveTicks')} ${b.tickCount}${b.devStage ? ` · ${b.devStage}` : ''}</span>
        </header>
        <div class="being-grid">
          <div class="stat-row"><span>${label('stress')}</span><strong>${fmt(b.stress)}</strong></div>
          <div class="stat-row"><span>${label('lowStreak')}</span><strong>${b.lowStreak}</strong></div>
          <div class="stat-row"><span>${label('extRate')}</span><strong>${pct(b.extRate)}</strong></div>
          <div class="stat-row"><span>TX / ACT</span><strong>${b.tx} / ${b.act}</strong></div>
          <div class="stat-row"><span>${label('drw')}</span><strong>${b.drw}</strong></div>
          <div class="stat-row"><span>${label('low')}</span><strong>${b.low}</strong></div>
          <div class="stat-row"><span>${label('integrity')}</span><strong>${fmt(b.integrity)}</strong></div>
          <div class="stat-row"><span>${label('mbr')}</span><strong>${b.mbr}</strong></div>
          ${b.organismType === 'multicell' ? `<div class="stat-row"><span>ORG</span><strong>multicell · ${escapeHtml(b.pairMorph ?? '—')}</strong></div>` : ''}
          <div class="stat-row"><span>${label('fiss')}</span><strong>${b.fissionCount ?? 0}</strong></div>
          <div class="stat-row"><span>${label('rpl')}</span><strong>${b.rplRemaining != null ? `${b.rplRemaining}/${b.rplMax}${b.rplScope ? ` (${b.rplScope})` : ''}` : '—'}</strong></div>
          <div class="stat-row"><span>${label('ren')}</span><strong>${b.renCount ?? 0}</strong></div>
          <div class="stat-row"><span>${label('plg')}</span><strong>${b.plgCount ?? 0}</strong></div>
          <div class="stat-row"><span>${label('rco')}</span><strong>${b.renewCostCount ?? 0}</strong></div>
          <div class="stat-row"><span>${label('mei')}</span><strong>${b.meiCount ?? 0}${b.hasMeiPacket ? '·包' : ''}</strong></div>
          <div class="stat-row"><span>${label('fus')}</span><strong>${b.fusCount ?? 0}</strong></div>
          <div class="stat-row"><span>${label('expStage')}</span><strong>${formatExpStage(b.expStage)}</strong></div>
          <div class="stat-row"><span>${label('exp')}</span><strong>${b.expTransitions ?? 0} · ${b.expLoad ?? 0}</strong></div>
          <div class="stat-row"><span>${label('regMode')}</span><strong>${formatRegMode(b.regMode)}</strong></div>
          <div class="stat-row"><span>${label('reg')}</span><strong>${b.regTransitions ?? 0} · gap ${b.regGapMean ?? 0}</strong></div>
          <div class="stat-row"><span>${label('metProfile')}</span><strong>${formatMetProfile(b.metProfile)}</strong></div>
          <div class="stat-row"><span>${label('mtb')}</span><strong>${b.metTransitions ?? 0} · e${b.metDomIdx ?? 0}</strong></div>
          <div class="stat-row"><span>${label('coopMode')}</span><strong>${formatCoopMode(b.coopMode)}</strong></div>
          <div class="stat-row"><span>${label('coop')}</span><strong>${b.coopTransitions ?? 0} · cross ${b.socCrossRx ?? 0}</strong></div>
          <div class="stat-row"><span>${label('lay')}</span><strong>${b.layerTransitions ?? 0}</strong></div>
          <div class="stat-row"><span>${label('rprMode')}</span><strong>${formatRprMode(b.rprMode)}</strong></div>
          <div class="stat-row"><span>${label('rpr')}</span><strong>${b.rprOrigin ?? 'SEED'} · ${b.rprTransitions ?? 0}</strong></div>
          <div class="stat-row"><span>${label('ehuStage')}</span><strong>${formatEhuStage(b.ehuStage)}</strong></div>
          <div class="stat-row"><span>${label('ehu')}</span><strong>${b.ehuTransitions ?? 0} · arc ${b.ehuArc ?? 0} · coh ${b.ehuCoherence ?? 0}</strong></div>
          <div class="stat-row"><span>${label('ehuBind')}</span><strong>${b.ehuSocialBind ?? 0}${b.ehuParentStage ? ` · lin ${b.ehuParentStage}` : ''}</strong></div>
          ${(b.ehuRenCount ?? 0) > 0 ? `<div class="stat-row"><span>${label('ehuRen')}</span><strong>${b.ehuRenCount}</strong></div>` : ''}
          <div class="stat-row"><span>${label('psn')}</span><strong>${b.personaTransitions ?? 0}</strong></div>
        </div>
        <div class="being-domain">${label('metabolismDomain')} e${b.cellBoundary.join(' e')}</div>
        <div class="being-regs" title="寄存器漂移">r ${b.registers.join(' ')}</div>
      </article>`
          )
          .join('');

    const popPanel = s.world.populationLayerEnabled
      ? `
      <section class="panel pop-panel">
        <h2>种群</h2>
        <h3 class="term">${label('popStruct')}</h3>
        ${cmpBlock}
        <h3 class="term">${label('popLife')}</h3>
        <div class="stat-grid">
          <div class="stat-row"><span>存活 / 总量</span><strong>${s.population.alive} / ${s.population.total}</strong></div>
          <div class="stat-row"><span>${label('end')}</span><strong>${s.population.ended}</strong></div>
          <div class="stat-row"><span>${label('lineage')}</span><strong>${s.population.lineage}</strong></div>
          <div class="stat-row"><span>${label('fiss')}</span><strong>${s.population.fission}</strong></div>
          <div class="stat-row"><span>${label('rpl')}</span><strong>${s.population.rpl}</strong></div>
          <div class="stat-row"><span>${label('ren')}</span><strong>${s.population.ren ?? 0}</strong></div>
          <div class="stat-row"><span>${label('plg')}</span><strong>${s.population.plg ?? 0}</strong></div>
          <div class="stat-row"><span>${label('rco')}</span><strong>${s.population.rco ?? 0}</strong></div>
          <div class="stat-row"><span>${label('mei')}</span><strong>${s.population.mei ?? 0}</strong></div>
          <div class="stat-row"><span>${label('fus')}</span><strong>${s.population.fus ?? 0}</strong></div>
          <div class="stat-row"><span>${label('bcn')}</span><strong>${s.population.bcn ?? 0}</strong></div>
          <div class="stat-row"><span>${label('exp')}</span><strong>${s.population.exp ?? 0}</strong></div>
          <div class="stat-row"><span>${label('reg')}</span><strong>${s.population.reg ?? 0}</strong></div>
          <div class="stat-row"><span>${label('mtb')}</span><strong>${s.population.mtb ?? 0}</strong></div>
          <div class="stat-row"><span>${label('coop')}</span><strong>${s.population.coop ?? 0}</strong></div>
          <div class="stat-row"><span>${label('lay')}</span><strong>${s.population.lay ?? 0}</strong></div>
          <div class="stat-row"><span>${label('rpr')}</span><strong>${s.population.rpr ?? 0}</strong></div>
          <div class="stat-row"><span>${label('sel')}</span><strong>${s.population.selection}</strong></div>
          <div class="stat-row"><span>${label('contest')}</span><strong>${s.population.contest}</strong></div>
        </div>
        <h3 class="term">${label('social')}</h3>
        <div class="stat-grid">${slotLines || '<div class="muted">—</div>'}</div>
      </section>`
      : '';

    const envProfile = this.world?.envProfile;

    return `
      ${renderImmersionPanel(s.consciousness, this.recorder, { label })}
      ${renderEnvStackPanel(s.envStack, {
        label,
        formatBand,
        formatTerrain,
        formatPatch,
        formatDiurnalQuarter,
        formatSeasonPhase,
        formatLunarPhase,
        viewModeHint,
      })}
      ${renderSemStackPanel(s.semStack, { label, semViewModeHint })}
      ${renderWlReproStackPanel(s.wlReproStack, { label, wlReproViewModeHint })}
      ${renderCarryPanel(s.carry, { label })}
      <section class="panel env-panel">
        <h2>环境</h2>
        ${s.world.envHint ? `<p class="panel-hint">${escapeHtml(s.world.envHint)}</p>` : ''}
        <h3 class="term">${label('substrate')}</h3>
        <pre class="field-state">${s.environment.substrate}</pre>
        <h3 class="term">${label('nodes')}</h3>
        <pre class="field-state">${s.environment.nodes}</pre>
        <h3 class="term">${label('envPulse')}</h3>
        <div class="stat-grid">
          <div class="stat-row"><span>${label('amb')}</span><strong>${s.environment.amb}</strong></div>
          <div class="stat-row"><span>${label('ptb')}</span><strong>${s.environment.ptb}</strong></div>
          <div class="stat-row"><span>${label('res')}</span><strong>${s.environment.res}</strong></div>
          <div class="stat-row"><span>${label('tgt')}</span><strong>${s.environment.tgt}</strong></div>
          <div class="stat-row"><span>${label('dep')}</span><strong>${s.environment.dep}</strong></div>
          <div class="stat-row"><span>${label('shk')}</span><strong>${s.environment.shk}</strong></div>
          <div class="stat-row"><span>${label('npl')}</span><strong>${s.environment.npl}</strong></div>
          <div class="stat-row"><span>${label('bio')}</span><strong>${s.environment.bio}</strong></div>
        </div>
      </section>

      ${popPanel}

      ${shouldShowGenealogyPanel(envProfile, this.observerLayout)
        ? renderGenealogyPanelHTML()
        : `
      <section class="panel beings-panel">
        <h2>${label('beings')}</h2>
        <p class="panel-hint">${s.world.multicellV2Observer ? escapeHtml(observerLayoutHint()) : viewModeHint()}</p>
        <div class="beings-grid">${beingCards || '<p class="muted">无存活个体</p>'}</div>
      </section>`}
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
