/** Phase 96 — W6 全栈耦合验收田野分析 */

import { evoCount } from './event-stats.js';
import { analyzeWisdomOpenField } from './phase77-analyze.js';
import { evaluateAcceptancePerRun } from './phase82-analyze.js';
import { dspYieldRatio } from '../../src/world/dissip.js';

const W6_LAYER_KEYS = [
  'rsv',
  'synth',
  'sym',
  'env',
  'art',
  'vent',
  'mig',
  'dsp',
  'wisdom',
];

function countKind(entries, kind) {
  return entries.filter((e) => e.meta?.kind === kind).length;
}

function layerFlags(recorder, beings, world) {
  const entries = recorder.entries ?? [];
  const alive = beings.filter((b) => b.alive);
  const rsvIn = beings.reduce((s, b) => s + (b.rsvInTotal ?? 0), 0);
  const synthA = beings.reduce((s, b) => s + (b.synthAInTotal ?? 0), 0);
  const symCap = world.symCaptureTotal ?? beings.reduce((s, b) => s + (b.symCaptureCount ?? 0), 0);
  const artDep = countKind(entries, 'ART');
  const vtn = countKind(entries, 'VTN');
  const mig = countKind(entries, 'MIG');
  const dsp = countKind(entries, 'DSP');
  const dspLost = world.dsp?.lostTotal ?? beings.reduce((s, b) => s + (b.dspLostTotal ?? 0), 0);
  const envActive =
    (world.diurnalStats?.ticks ?? 0) > 0 ||
    (world.seasonalStats?.ticks ?? 0) > 0 ||
    (world.air?.level ?? 0) > 0 ||
    countKind(entries, 'ADV') > 0 ||
    countKind(entries, 'LTC') > 0;

  const layers = {
    rsv: rsvIn > 0 || countKind(entries, 'RSV') > 0,
    synth: synthA > 0.05,
    sym: symCap > 0 || countKind(entries, 'SYM') > 0,
    env: envActive,
    art: artDep > 0,
    vent: vtn > 0,
    mig: mig > 0,
    dsp: dsp > 0 || dspLost > 0.1,
    wisdom:
      evoCount(recorder, 'PRD') >= 20 &&
      evoCount(recorder, 'SOC-ENC') >= 10 &&
      evoCount(recorder, 'COOP') >= 3,
  };

  const layersActive = W6_LAYER_KEYS.filter((k) => layers[k]).length;
  return { layers, layersActive };
}

export function analyzeW6StackField(recorder, beings, world, { ticks } = {}) {
  const wisdom = analyzeWisdomOpenField(recorder, beings, world, { ticks });
  const acceptance = evaluateAcceptancePerRun(wisdom);
  const { layers, layersActive } = layerFlags(recorder, beings, world);
  const entries = recorder.entries ?? [];
  const dsp = world.dsp ?? {};

  return {
    ...wisdom,
    w6StackEnabled: world.envProfile?.w6StackEnabled === true,
    layers,
    layersActive,
    layerCounts: {
      rsv: countKind(entries, 'RSV'),
      sym: countKind(entries, 'SYM'),
      art: countKind(entries, 'ART'),
      vtn: countKind(entries, 'VTN'),
      mig: countKind(entries, 'MIG'),
      dsp: countKind(entries, 'DSP'),
      prd: wisdom.prdCount,
      socEnc: wisdom.socEncCount,
      coop: wisdom.coopCount,
    },
    dspYieldRatio: +dspYieldRatio(world).toFixed(4),
    dspLostTotal: +(dsp.lostTotal ?? 0).toFixed(4),
    acceptance,
  };
}

export function compareW6Stack(offMetrics, onMetrics) {
  const layerDelta = onMetrics.layersActive - offMetrics.layersActive;
  const aliveOk = (onMetrics.aliveTotal ?? 0) >= 4;
  const wisdomOk =
    onMetrics.acceptance?.W5_openScale?.verdict !== 'unsupport' &&
    onMetrics.acceptance?.W1_memoryLoop?.verdict !== 'unsupport';
  const stackLayers = onMetrics.layersActive ?? 0;

  let verdict = 'pending';
  if (layerDelta >= 4 && stackLayers >= 6 && aliveOk && wisdomOk) verdict = 'support';
  else if (layerDelta >= 2 && stackLayers >= 4 && aliveOk) verdict = 'weak';
  else if (!onMetrics.w6StackEnabled) verdict = 'no_stack';
  else verdict = 'unsupport';

  return {
    layerDelta,
    offLayers: offMetrics.layersActive,
    onLayers: onMetrics.layersActive,
    aliveTotal: onMetrics.aliveTotal,
    wisdomVerdict: onMetrics.acceptance?.W5_openScale?.verdict,
    verdict,
  };
}

export function verifyPhase96Batch(runsByTreatment) {
  const seeds = runsByTreatment.w6_stack_off?.length ?? 0;
  const comparisons = [];
  let support = 0;

  for (let i = 0; i < seeds; i++) {
    const off = runsByTreatment.w6_stack_off[i]?.metrics;
    const on = runsByTreatment.w6_stack_on[i]?.metrics;
    if (!off || !on) continue;
    const cmp = compareW6Stack(off, on);
    comparisons.push({ seed: i, ...cmp });
    if (cmp.verdict === 'support') support++;
  }

  const stackObserved = comparisons.some((c) => c.onLayers >= 4);
  const wisdomSustained = comparisons.filter((c) => (c.aliveTotal ?? 0) >= 4).length;

  let verdict = 'unsupport';
  if (support >= 3 && stackObserved && wisdomSustained >= 3) verdict = 'support';
  else if ((support >= 2 || comparisons.some((c) => c.verdict === 'weak')) && stackObserved)
    verdict = 'weak';
  else if (!stackObserved) verdict = 'no_stack_observed';

  const onRuns = runsByTreatment.w6_stack_on ?? [];
  const wGoals = ['W1_memoryLoop', 'W3_prediction', 'W4_social', 'W5_openScale'];
  const supportByGoal = Object.fromEntries(
    wGoals.map((g) => [
      g,
      onRuns.filter((r) => r.metrics?.acceptance?.[g]?.verdict === 'support').length,
    ])
  );

  return {
    seedsCompared: comparisons.length,
    stackSupport: support,
    comparisons,
    stackObserved,
    wisdomSustained,
    supportByGoal,
    verdict,
    w6Status: verdict === 'support' ? 'w6_stack_coupled' : 'w6_record_layer',
  };
}
