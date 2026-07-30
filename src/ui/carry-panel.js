/** Phase 109 — 观察台留置链 provenance 面板 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCarrySummary(world) {
  const beings = world?.beings ?? [];
  const carried = beings.filter((b) => b.carryProvenance || b.cohortTag === 'carry');
  const chains = carried.map((b) => {
    const p = b.carryProvenance ?? {};
    const chain = p.chain ?? [];
    return {
      id: b.id?.slice(-6) ?? '—',
      name: b.name,
      generation: b.generation ?? 0,
      traceWeight: +(b.semTraceWeight ?? 0).toFixed(4),
      traceLen: b.semTrace?.length ?? 0,
      chainStages: chain.length,
      chainEnvs: chain.map((c) => c.envId).filter(Boolean),
      lastStage: p.chainStage ?? '—',
      coopMode: b.coopMode ?? 'S0',
      coopTransitions: b.coopTransitions ?? 0,
      crossRx: b.socCrossRx ?? 0,
    };
  });
  return {
    count: carried.length,
    withProvenance: carried.filter((b) => b.carryProvenance).length,
    chains,
    maxChainDepth: chains.reduce((m, c) => Math.max(m, c.chainStages), 0),
  };
}

export function renderCarryPanel(summary, fmt = {}) {
  const { label = (k) => k } = fmt;
  if (!summary?.count) {
    return `
      <section class="panel env-stack-panel carry-panel">
        <h2>${escapeHtml(label('carryPanel'))}</h2>
        <p class="panel-hint muted">${escapeHtml(label('carryPanelEmpty'))}</p>
      </section>`;
  }

  const rows = summary.chains
    .map(
      (c) => `
      <div class="env-stack-row">
        <span>${escapeHtml(c.name)} · 代${c.generation}</span>
        <strong>${escapeHtml(c.chainEnvs.join('→') || c.lastStage)} · ${escapeHtml(c.coopMode)} · trace ${c.traceWeight}</strong>
      </div>`
    )
    .join('');

  return `
    <section class="panel env-stack-panel carry-panel">
      <div class="env-stack-head">
        <h2>${escapeHtml(label('carryPanel'))}</h2>
        <span class="env-stack-meta">${summary.count} 留置 · 链深 ${summary.maxChainDepth}</span>
      </div>
      ${rows}
    </section>`;
}
