/** Phase 104 — 智慧语言约定迹观察面板（类比 UI，不进 CODEX） */

import { semEnabled, semFeedbackEnabled } from '../world/sem.js';
import { semLineageEnabled } from '../world/sem-lineage.js';

function countKind(entries, kind) {
  return (entries ?? []).filter((e) => e.meta?.kind === kind).length;
}

function meanAlive(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  if (!alive.length) return 0;
  return +(alive.reduce((s, b) => s + pick(b), 0) / alive.length).toFixed(4);
}

export function buildSemStackSummary(world, recorder) {
  const profile = world.envProfile ?? {};
  const entries = recorder?.entries ?? [];
  const beings = world.beings ?? [];
  const alive = beings.filter((b) => b.alive);

  const enabled = {
    sem: semEnabled(profile),
    feedback: semFeedbackEnabled(profile),
    lineage: semLineageEnabled(profile),
  };

  const topPairs = [];
  if (world.semTopTxByRx?.size) {
    const sorted = [...world.semTopTxByRx.entries()]
      .map(([rx, hit]) => ({ rx, tx: hit.txKey, count: hit.count ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
    topPairs.push(...sorted);
  }

  return {
    enabled,
    anyEnabled: enabled.sem,
    pairKinds: world.semPairCounts?.size ?? 0,
    topPairs,
    logs: {
      sem: countKind(entries, 'SEM'),
      semLin: countKind(entries, 'SEM-LIN'),
    },
    cohort: {
      meanPairTally: meanAlive(beings, (b) => b.semPairTally ?? 0),
      meanFbHits: meanAlive(beings, (b) => b.semFbHits ?? 0),
      meanTraceWeight: meanAlive(beings, (b) => b.semTraceWeight ?? 0),
      withTrace: alive.filter((b) => (b.semTrace?.length ?? 0) > 0).length,
    },
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
 * @param {ReturnType<typeof buildSemStackSummary>} stack
 * @param {{ label: Function, semViewModeHint: Function }} fmt
 */
export function renderSemStackPanel(stack, fmt) {
  const { label, semViewModeHint } = fmt;

  if (!stack?.anyEnabled) {
    return `
      <section class="panel env-stack-panel sem-stack-panel">
        <div class="env-stack-head">
          <h2>${escapeHtml(label('semStack'))}</h2>
          <span class="env-stack-meta">${escapeHtml(semViewModeHint())}</span>
        </div>
        <p class="panel-hint muted">${escapeHtml(label('semStackOff'))}</p>
      </section>`;
  }

  const flags = [
    badge('SEM', stack.enabled.sem),
    badge('FB', stack.enabled.feedback),
    badge('LIN', stack.enabled.lineage),
  ].join('');

  const topBlock =
    stack.topPairs.length > 0
      ? stack.topPairs
          .map((p) => row(label('semPair'), `${p.rx}→${p.tx} ×${p.count}`))
          .join('')
      : row(label('semPair'), '—', true);

  const cohort = stack.cohort ?? {};

  return `
    <section class="panel env-stack-panel sem-stack-panel">
      <div class="env-stack-head">
        <h2>${escapeHtml(label('semStack'))}</h2>
        <span class="env-stack-meta">${escapeHtml(semViewModeHint())}</span>
      </div>
      <div class="env-stack-badges">${flags}</div>
      <div class="env-stack-grid env-stack-grid-3">
        <div class="env-stack-col">
          <h3 class="env-stack-col-title">${escapeHtml(label('semStats'))}</h3>
          ${row(label('semCount'), stack.logs.sem)}
          ${row(label('semLinCount'), stack.logs.semLin)}
          ${row(label('semPairKinds'), stack.pairKinds)}
          ${row(label('semCondTop'), stack.topPairs[0] ? `${stack.topPairs[0].rx}→${stack.topPairs[0].tx}` : '—')}
        </div>
        <div class="env-stack-col">
          <h3 class="env-stack-col-title">${escapeHtml(label('semCohort'))}</h3>
          ${row(label('semPairTally'), cohort.meanPairTally ?? 0)}
          ${row(label('semFbHits'), cohort.meanFbHits ?? 0)}
          ${row(label('semTraceWeight'), cohort.meanTraceWeight ?? 0)}
          ${row(label('semWithTrace'), cohort.withTrace ?? 0)}
        </div>
        <div class="env-stack-col">
          <h3 class="env-stack-col-title">${escapeHtml(label('semTopPairs'))}</h3>
          ${topBlock}
        </div>
      </div>
    </section>`;
}
