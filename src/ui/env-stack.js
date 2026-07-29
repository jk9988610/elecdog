/** Phase 98 — 环境栈观察面板（区带/地形/相位 · 类比 UI，不进 CODEX） */

import { solarPhase, diurnalEnabled, isNightPhase } from '../world/diurnal.js';
import { seasonPhase, seasonalEnabled, seasonMods } from '../world/seasonal.js';
import { lunarPhaseSlot, lunarTide, ltcEnabled } from '../world/ltc.js';
import { airEnabled } from '../world/air.js';
import { placeEnabled } from '../world/place.js';
import { pcpEnabled } from '../world/pcp.js';

function countKind(entries, kind) {
  return (entries ?? []).filter((e) => e.meta?.kind === kind).length;
}

export function buildEnvStackSummary(world, recorder) {
  const profile = world.envProfile ?? {};
  const tick = world.tick ?? 0;
  const place = world.place ?? {};
  const entries = recorder?.entries ?? [];

  const enabled = {
    place: placeEnabled(profile),
    diurnal: diurnalEnabled(profile),
    seasonal: seasonalEnabled(profile),
    ltc: ltcEnabled(profile),
    air: airEnabled(profile),
    pcp: pcpEnabled(profile),
  };
  const anyEnabled = Object.values(enabled).some(Boolean);

  const diurnalPeriod = profile.diurnalPeriod ?? 240;
  const seasonalPeriod = profile.seasonalPeriod ?? 960;
  const lunarPeriod = profile.ltcPeriod ?? 28;

  const solar = enabled.diurnal ? solarPhase(tick, diurnalPeriod) : null;
  const diurnal = enabled.diurnal
    ? {
        quarter: Math.floor(((tick % diurnalPeriod) / diurnalPeriod) * 4),
        solar: +solar.toFixed(4),
        night: isNightPhase(solar, profile.diurnalNightThreshold ?? 0.08),
        period: diurnalPeriod,
        dayTicks: world.diurnalStats?.dayTicks ?? 0,
        nightTicks: world.diurnalStats?.nightTicks ?? 0,
      }
    : null;

  const seasonSlot = enabled.seasonal ? seasonPhase(tick, seasonalPeriod) : null;
  const seasonal = enabled.seasonal
    ? {
        phase: seasonSlot,
        period: seasonalPeriod,
        mods: seasonMods(seasonSlot),
        live: world.seasonal?.phase ?? seasonSlot,
      }
    : null;

  const lunar = enabled.ltc
    ? {
        phase: lunarPhaseSlot(tick, lunarPeriod),
        tide: +lunarTide(tick, lunarPeriod).toFixed(4),
        period: lunarPeriod,
        live: world.lunar?.phase,
      }
    : null;

  const air = enabled.air
    ? {
        scalar: +(world.air?.scalar ?? profile.airInit ?? 0.5).toFixed(4),
        effectiveSolar: world.airMods?.effectiveSolar ?? null,
        drainMult: world.airMods?.drainMult ?? null,
      }
    : null;

  const pcp = enabled.pcp
    ? {
        atmoStore: +(world.pcp?.atmoStore ?? 0).toFixed(4),
        terrain: place.terrain ?? profile.placeTerrain ?? 'L',
      }
    : null;

  return {
    enabled,
    anyEnabled,
    birthPlace: world.birthPlace,
    place: {
      band: place.band ?? profile.placeBand ?? null,
      patch: place.patch ?? profile.placePatch ?? null,
      terrain: place.terrain ?? profile.placeTerrain ?? null,
      legacy: place.legacy === true,
    },
    diurnal,
    seasonal,
    lunar,
    air,
    pcp,
    logs: {
      dlc: countKind(entries, 'DLC'),
      scl: countKind(entries, 'SCL'),
      ltc: countKind(entries, 'LTC'),
      air: countKind(entries, 'AIR'),
      pcp: countKind(entries, 'PCP'),
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
 * @param {ReturnType<typeof buildEnvStackSummary>} stack
 * @param {{ label: Function, formatBand: Function, formatTerrain: Function, formatPatch: Function, formatDiurnalQuarter: Function, formatSeasonPhase: Function, formatLunarPhase: Function, viewModeHint: Function }} fmt
 */
export function renderEnvStackPanel(stack, fmt) {
  const { label, formatBand, formatTerrain, formatPatch, formatDiurnalQuarter, formatSeasonPhase, formatLunarPhase, viewModeHint } =
    fmt;

  if (!stack?.anyEnabled) {
    return `
      <section class="panel env-stack-panel">
        <div class="env-stack-head">
          <h2>${escapeHtml(label('envStack'))}</h2>
          <span class="env-stack-meta">${escapeHtml(viewModeHint())}</span>
        </div>
        <p class="panel-hint muted">${escapeHtml(label('envStackOff'))}</p>
      </section>`;
  }

  const flags = [
    badge('PLACE', stack.enabled.place),
    badge('DLC', stack.enabled.diurnal),
    badge('PCP', stack.enabled.pcp),
    badge('SCL', stack.enabled.seasonal),
    badge('AIR', stack.enabled.air),
    badge('LTC', stack.enabled.ltc),
  ].join('');

  const placeBlock = stack.enabled.place
    ? `
      <div class="env-stack-col">
        <h3 class="env-stack-col-title">${escapeHtml(label('envPlace'))}</h3>
        ${row(label('birthPlace'), stack.birthPlace ?? '—')}
        ${row(label('envBand'), formatBand(stack.place.band))}
        ${row(label('envPatch'), formatPatch(stack.place.patch))}
        ${row(label('envTerrain'), formatTerrain(stack.place.terrain ?? 'L'))}
      </div>`
    : '';

  const phaseBlock = `
    <div class="env-stack-col">
      <h3 class="env-stack-col-title">${escapeHtml(label('envPhases'))}</h3>
      ${
        stack.diurnal
          ? row(
              label('envDiurnal'),
              `${formatDiurnalQuarter(stack.diurnal.quarter)} · solar ${stack.diurnal.solar} · ${stack.diurnal.night ? label('envNight') : label('envDay')}`
            )
          : row(label('envDiurnal'), '—', true)
      }
      ${
        stack.seasonal
          ? row(
              label('envSeasonal'),
              `${formatSeasonPhase(stack.seasonal.phase)} · floor×${stack.seasonal.mods.floorMult}`
            )
          : row(label('envSeasonal'), '—', true)
      }
      ${
        stack.lunar
          ? row(label('envLunar'), `${formatLunarPhase(stack.lunar.phase)} · tide ${stack.lunar.tide}`)
          : row(label('envLunar'), '—', true)
      }
      ${
        stack.air
          ? row(label('envAir'), `scalar ${stack.air.scalar}`)
          : row(label('envAir'), '—', true)
      }
      ${
        stack.pcp ? row(label('envPcp'), `atmo ${stack.pcp.atmoStore}`) : row(label('envPcp'), '—', true)
      }
    </div>`;

  const logBlock = `
    <div class="env-stack-col">
      <h3 class="env-stack-col-title">${escapeHtml(label('envLogs'))}</h3>
      ${row('DLC', stack.logs.dlc)}
      ${row('SCL', stack.logs.scl)}
      ${row('LTC', stack.logs.ltc)}
      ${row('AIR', stack.logs.air)}
      ${row('PCP', stack.logs.pcp)}
      ${
        stack.diurnal
          ? row(label('envDiurnalStats'), `${stack.diurnal.dayTicks} / ${stack.diurnal.nightTicks}`)
          : ''
      }
    </div>`;

  return `
    <section class="panel env-stack-panel">
      <div class="env-stack-head">
        <h2>${escapeHtml(label('envStack'))}</h2>
        <span class="env-stack-meta">${escapeHtml(viewModeHint())}</span>
      </div>
      <div class="env-stack-badges">${flags}</div>
      <div class="env-stack-grid">
        ${placeBlock}
        ${phaseBlock}
        ${logBlock}
      </div>
    </section>`;
}
