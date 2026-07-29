/** Phase 57 — 电子人深化 [EHU-LIN] + 社会绑定 */

import { beingPersonaTransitions } from '../../src/world/persona-stack.js';
import { electronicHumanSnapshot } from '../../src/world/electronic-human-profile.js';
import { evoCount } from './event-stats.js';
import { analyzePersonaStack } from './phase56-analyze.js';

function stageHistogram(beings) {
  const hist = { H0: 0, H1: 0, H2: 0, H3: 0 };
  for (const b of beings.filter((x) => x.alive)) {
    const s = b.ehuStage ?? 'H0';
    hist[s] = (hist[s] ?? 0) + 1;
  }
  return hist;
}

export function analyzeEhuDeep(recorder, beings, world) {
  const persona = analyzePersonaStack(recorder, beings, world);
  const echoCount = beings.filter((b) => b.ehuLineageEcho).length;

  return {
    ...persona,
    ehuLinCount: evoCount(recorder, 'EHU-LIN'),
    ehuStages: stageHistogram(beings),
    echoOffspring: echoCount,
    meanSocialBind: meanField(beings, (b) => b.ehuSocialBind ?? 0),
    meanEchoCoherence: meanField(beings, (b) => b.ehuEchoCoherence ?? null),
    ehuDeepSnapshots: beings.filter((b) => b.alive).slice(0, 6).map((b) => electronicHumanSnapshot(b)),
  };
}

function meanField(beings, pick) {
  const alive = beings.filter((b) => b.alive);
  const vals = alive.map(pick).filter((v) => v != null);
  if (!vals.length) return null;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

export function compareEhuSocialBind(base, social) {
  const h3Delta = (social.ehuStages?.H3 ?? 0) - (base.ehuStages?.H3 ?? 0);
  return {
    H1_socialBind: {
      verdict: (social.meanSocialBind ?? 0) > (base.meanSocialBind ?? 0) + 0.05 ? 'support' : 'weak',
      base: base.meanSocialBind,
      social: social.meanSocialBind,
    },
    H2_h3Narrative: {
      verdict: h3Delta >= 1 ? 'support' : h3Delta >= 0 ? 'weak' : 'unsupport',
      baseH3: base.ehuStages?.H3 ?? 0,
      socialH3: social.ehuStages?.H3 ?? 0,
    },
  };
}

export function compareEhuLineageEcho(base, echo) {
  return {
    H3_lineageEchoFires: {
      verdict: (echo.ehuLinCount ?? 0) >= 8 ? 'support' : (echo.ehuLinCount ?? 0) >= 1 ? 'weak' : 'unsupport',
      base: base.ehuLinCount ?? 0,
      echo: echo.ehuLinCount ?? 0,
    },
    H4_echoOffspring: {
      verdict: (echo.echoOffspring ?? 0) >= (base.echoOffspring ?? 0) ? 'support' : 'weak',
      echoCount: echo.echoOffspring,
      meanEchoCoh: echo.meanEchoCoherence,
    },
  };
}

export function compareEhuDeepFull(social, full) {
  const personaDelta = (full.meanPersonaTransitions ?? 0) - (social.meanPersonaTransitions ?? 0);
  return {
    H5_fullCoexist: {
      verdict:
        (full.ehuLinCount ?? 0) >= 1 &&
        (full.meanSocialBind ?? 0) > 0 &&
        full.totalLayerTransitions >= 2000
          ? 'support'
          : 'weak',
      lin: full.ehuLinCount,
      bind: full.meanSocialBind,
      layers: full.totalLayerTransitions,
    },
    H6_personaArc: {
      verdict: personaDelta >= -5 ? 'support' : 'weak',
      social: social.meanPersonaTransitions,
      full: full.meanPersonaTransitions,
    },
    H7_triPath: {
      verdict: (full.fissCount ?? 0) >= 8 && (full.fusEventCount ?? 0) >= 8 ? 'support' : 'weak',
      fiss: full.fissCount,
      fus: full.fusEventCount,
    },
  };
}
