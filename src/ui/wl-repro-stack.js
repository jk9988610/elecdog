/** Phase 135 — WL-R 繁殖载荷域观察面板（类比 UI + CODEX 联动） */

import {
  semDomainTagEnabled,
  semFourDomainCoupleEnabled,
  semDomainCountsFromBeings,
  fourDomainCoupleCountsFromBeings,
} from '../world/sem-domain.js';
import { semReproLineageEnabled, reproTraceWeight } from '../world/sem-lineage.js';

export const WLR_CODEX_ENTRIES = [
  { id: 'repro-payload-domain-trace', title: '繁殖载荷域迹' },
  { id: 'sem-payload-cooccurrence', title: '载荷共现迹' },
];

function countReproLin(entries) {
  return (entries ?? []).filter(
    (e) => e.channel === 'evolution' && e.meta?.kind === 'SEM-LIN' && e.meta?.reproTrace === true
  ).length;
}

function meanAlive(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return 0;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function buildWlReproStackSummary(world, recorder) {
  const profile = world.envProfile ?? {};
  const beings = world.beings ?? [];
  const entries = recorder?.entries ?? [];
  const enabled = {
    domain: semDomainTagEnabled(profile),
    reproLin: semReproLineageEnabled(profile),
    fourCouple: semFourDomainCoupleEnabled(profile),
  };
  const domain = semDomainCountsFromBeings(beings, profile);
  const four = fourDomainCoupleCountsFromBeings(beings);
  const semTotal = beings.reduce((s, b) => s + (b.semPairTally ?? 0), 0);
  const coreR = domain['CORE-R'] ?? 0;

  return {
    enabled,
    anyEnabled: enabled.domain,
    domain,
    four,
    semTotal,
    coreR,
    coreRRatio: semTotal ? +(coreR / semTotal).toFixed(4) : 0,
    couplePairs: four.couplePairs ?? 0,
    logs: { semLinRepro: countReproLin(entries) },
    cohort: {
      meanReproTrace: meanAlive(beings, (b) => b.reproTraceWeight ?? reproTraceWeight(b.semTrace)),
      withReproTrace: beings.filter((b) => b.alive && (b.reproTraceWeight ?? 0) > 0).length,
    },
    codex: WLR_CODEX_ENTRIES,
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label, value, muted = false) {
  const cls = muted ? 'env-stack-row muted' : 'env-stack-row';
  return `<div class="${cls}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function badge(text, on) {
  const cls = on ? 'env-stack-badge on' : 'env-stack-badge off';
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

/**
 * @param {ReturnType<typeof buildWlReproStackSummary>} stack
 * @param {{ label: Function, wlReproViewModeHint: Function }} fmt
 */
export function renderWlReproStackPanel(stack, fmt) {
  const { label, wlReproViewModeHint } = fmt;

  if (!stack?.anyEnabled) {
    return `
      <section class="panel env-stack-panel wl-repro-stack-panel">
        <div class="env-stack-head">
          <h2>${escapeHtml(label('wlReproStack'))}</h2>
          <span class="env-stack-meta">${escapeHtml(wlReproViewModeHint())}</span>
        </div>
        <p class="panel-hint muted">${escapeHtml(label('wlReproStackOff'))}</p>
      </section>`;
  }

  const flags = [
    badge('DOM', stack.enabled.domain),
    badge('LIN-R', stack.enabled.reproLin),
    badge('4DC', stack.enabled.fourCouple),
  ].join('');

  const d = stack.domain ?? {};
  const f = stack.four ?? {};
  const cohort = stack.cohort ?? {};

  const codexLinks = (stack.codex ?? [])
    .map(
      (e) =>
        `<button type="button" class="btn-ghost btn-codex-link" data-codex-entry="${escapeHtml(e.id)}">${escapeHtml(e.title)}</button>`
    )
    .join(' ');

  return `
    <section class="panel env-stack-panel wl-repro-stack-panel">
      <div class="env-stack-head">
        <h2>${escapeHtml(label('wlReproStack'))}</h2>
        <span class="env-stack-meta">${escapeHtml(wlReproViewModeHint())}</span>
      </div>
      <div class="env-stack-badges">${flags}</div>
      <div class="env-stack-grid env-stack-grid-3">
        <div class="env-stack-col">
          <h3 class="env-stack-col-title">${escapeHtml(label('wlReproDomains'))}</h3>
          ${row(label('wlReproCore'), d['CORE-R'] ?? 0)}
          ${row(label('wlYi'), d.YI ?? 0)}
          ${row(label('wlShi'), d.SHI ?? 0)}
          ${row(label('wlZhu'), d.ZHU ?? 0)}
          ${row(label('wlXing'), d.XING ?? 0)}
          ${row(label('wlCoreRRatio'), stack.coreRRatio ?? 0)}
        </div>
        <div class="env-stack-col">
          <h3 class="env-stack-col-title">${escapeHtml(label('wlReproCouple'))}</h3>
          ${row(label('wlFourCouplePairs'), stack.couplePairs ?? 0)}
          ${row(label('wlFourYi'), f.YI ?? 0)}
          ${row(label('wlFourShi'), f.SHI ?? 0)}
          ${row(label('wlFourZhu'), f.ZHU ?? 0)}
          ${row(label('wlFourXing'), f.XING ?? 0)}
        </div>
        <div class="env-stack-col">
          <h3 class="env-stack-col-title">${escapeHtml(label('wlReproLin'))}</h3>
          ${row(label('wlSemLinRepro'), stack.logs?.semLinRepro ?? 0)}
          ${row(label('wlReproTraceMean'), cohort.meanReproTrace ?? 0)}
          ${row(label('wlReproTraceCount'), cohort.withReproTrace ?? 0)}
        </div>
      </div>
      <div class="wl-repro-codex-links panel-hint">
        <span>${escapeHtml(label('wlReproCodex'))}</span>
        ${codexLinks}
      </div>
    </section>`;
}
