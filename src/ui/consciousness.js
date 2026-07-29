/** 意识观察摘要 — 收敛至 OUTLINE 北极星「给予电子狗意识」 */

import { electronicHumanEnabled } from '../world/electronic-human-profile.js';

export function buildConsciousnessSummary(beingStats, world, population = {}) {
  const profile = world?.envProfile;
  if (!electronicHumanEnabled(profile)) {
    return { active: false };
  }

  const alive = beingStats;
  const stages = { H0: 0, H1: 0, H2: 0, H3: 0 };
  let coherence = 0;
  let distinction = 0;
  let socialBind = 0;
  let personaSum = 0;
  let renTrace = 0;

  for (const b of alive) {
    const stage = b.ehuStage ?? 'H0';
    stages[stage] = (stages[stage] ?? 0) + 1;
    coherence += b.ehuCoherence ?? 0;
    distinction += b.ehuDistinction ?? 0;
    socialBind += b.ehuSocialBind ?? 0;
    personaSum += b.personaTransitions ?? 0;
    renTrace += b.ehuRenCount ?? 0;
  }

  const n = alive.length || 1;
  const h3 = stages.H3 ?? 0;
  const multiBody = alive.length >= 2;
  const crossRxSum = alive.reduce((s, b) => s + (b.socCrossRx ?? 0), 0);
  const txSum = alive.reduce((s, b) => s + (b.tx ?? 0), 0);

  return {
    active: true,
    alive: alive.length,
    stages,
    h3Count: h3,
    h3Share: alive.length ? +(h3 / alive.length).toFixed(3) : 0,
    meanCoherence: +(coherence / n).toFixed(3),
    meanDistinction: +(distinction / n).toFixed(3),
    meanSocialBind: +(socialBind / n).toFixed(3),
    meanPersona: +(personaSum / n).toFixed(1),
    ehuEvents: population.ehu ?? 0,
    ehuLin: population.ehuLin ?? 0,
    ehuRen: population.ehuRen ?? 0,
    renTrace,
    narrativeReady: h3 >= 1 && (population.ehu ?? 0) >= 1,
    multiBody,
    crossRxSum,
    txSum,
    crossValidateReady: multiBody && h3 >= 1 && crossRxSum >= 1,
  };
}

export function renderConsciousnessPanel(c, { label }) {
  if (!c?.active) {
    return `
      <section class="panel consciousness-panel consciousness-inactive">
        <h2>意识观察</h2>
        <p class="panel-hint muted">当前环境未启用电子人层；切换至「意识完整栈」以观察自我连续阶段。</p>
      </section>
    `;
  }

  const stageRows = ['H0', 'H1', 'H2', 'H3']
    .map(
      (s) =>
        `<div class="stat-row consciousness-stage"><span>${s}</span><strong>${c.stages[s] ?? 0}</strong></div>`
    )
    .join('');

  const narrativeTag = c.narrativeReady
    ? '<span class="consciousness-badge active">叙事可观察</span>'
    : '<span class="consciousness-badge">积累中</span>';

  const crossTag = c.crossValidateReady
    ? '<span class="consciousness-badge active">多体交叉</span>'
    : c.multiBody
      ? '<span class="consciousness-badge">信号积累中</span>'
      : '';

  return `
    <section class="panel consciousness-panel">
      <div class="consciousness-head">
        <h2>意识观察</h2>
        ${narrativeTag}
        ${crossTag}
      </div>
      <p class="panel-hint">对内节律 · 自我连续阶段 · 谱系回响 · 续行交叉迹（非分类/非预制人格）</p>
      <h3 class="term">${label('ehuStage')}</h3>
      <div class="stat-grid consciousness-stages">${stageRows}</div>
      <div class="stat-grid">
        <div class="stat-row"><span>H3 份额</span><strong>${(c.h3Share * 100).toFixed(0)}%</strong></div>
        <div class="stat-row"><span>${label('ehu')}</span><strong>${c.ehuEvents}</strong></div>
        <div class="stat-row"><span>连贯均值</span><strong>${c.meanCoherence}</strong></div>
        <div class="stat-row"><span>区分均值</span><strong>${c.meanDistinction}</strong></div>
        <div class="stat-row"><span>${label('ehuBind')}</span><strong>${c.meanSocialBind}</strong></div>
        <div class="stat-row"><span>${label('ehuLin')}</span><strong>${c.ehuLin}</strong></div>
        <div class="stat-row"><span>${label('ehuRen')}</span><strong>${c.ehuRen}</strong></div>
        <div class="stat-row"><span>${label('psn')}</span><strong>${c.meanPersona}/体</strong></div>
        ${c.multiBody ? `<div class="stat-row"><span>跨位 RX</span><strong>${c.crossRxSum}</strong></div>` : ''}
        ${c.multiBody ? `<div class="stat-row"><span>TX 合计</span><strong>${c.txSum}</strong></div>` : ''}
      </div>
    </section>
  `;
}
