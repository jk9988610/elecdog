// 公理: A9 — 时钟；场压；谱系；剧变；生物圈；种群结构；细胞边界

import {
  advanceSubstrate,
  ambienceLine,
  perturbFromAct,
  substrateSnapshot,
} from '../world/substrate.js';
import {
  advanceNodes,
  selectActTarget,
  applyActToNode,
  formatNodesState,
  nodesSnapshot,
} from '../world/nodes.js';
import { assignSocialSlot } from '../world/social.js';
import { shouldTerminate, updateStressStreak } from '../world/viability.js';
import { spawnLineageOffspring } from '../world/lineage.js';
import { trackStressSample, recordSelection } from '../world/selection.js';
import { advanceCatastrophe } from '../world/catastrophe.js';
import { accumulateBiotic, applyBioticCycle } from '../world/biotic.js';
import { compositionSnapshot, shouldRecordComposition } from '../world/composition.js';
import { CELL_INTEGRITY_LOW } from '../world/cell.js';
import { juvenileDrawMultiplier } from '../world/env-profile.js';
import { tickNurture } from '../world/nurture.js';
import { runMetabolism } from '../world/organism.js';
import { fissionGate, spawnFissionOffspring } from '../world/fission.js';
import { checkReplicationTermination } from '../world/replication.js';
import { tryRplRenew, processPledgeRenewals } from '../world/rpl-renew.js';
import { tryMeiosis, processFusions, collectOrphanPacket } from '../world/recombination.js';
import {
  experienceEnabled,
  experienceActBias,
  processExperienceTick,
} from '../world/experience.js';
import {
  registerProfileEnabled,
  processRegisterTick,
} from '../world/register-profile.js';
import {
  metabolicProfileEnabled,
  metabolicDrawMultAdjust,
  processMetabolicProfileTick,
} from '../world/metabolic-profile.js';

function slotOf(world, beingId) {
  return world.beings.find((b) => b.id === beingId)?.socialSlot ?? assignSocialSlot(beingId);
}

export function stepWorld(world, recorder) {
  world.tick++;

  advanceSubstrate(world);
  advanceNodes(world);
  const catastrophes = advanceCatastrophe(world);
  for (const evt of catastrophes) {
    if (evt.kind === 'SHK') {
      const sign = evt.delta >= 0 ? '+' : '';
      recorder.environment(
        world.tick,
        `[SHK] ${world.birthPlace} e${evt.idx} ${sign}${evt.delta.toFixed(3)} after ${evt.after.toFixed(3)}`,
        { kind: 'SHK', place: world.birthPlace, ...evt }
      );
      recorder.substrate(world.tick, substrateSnapshot(world), {
        place: world.birthPlace,
        afterShock: true,
        pulse: evt.pulse,
      });
    } else if (evt.kind === 'NPL') {
      const sign = evt.delta >= 0 ? '+' : '';
      recorder.environment(
        world.tick,
        `[NPL] ${evt.nodeId} ${sign}${evt.delta.toFixed(3)} lvl ${evt.after.toFixed(3)}`,
        { kind: 'NPL', place: world.birthPlace, ...evt }
      );
      if (evt.depleted) {
        recorder.environment(world.tick, `[DEP] ${evt.nodeId} at ${world.birthPlace}`, {
          kind: 'DEP',
          nodeId: evt.nodeId,
          place: world.birthPlace,
          fromPulse: true,
        });
      }
      recorder.nodes(world.tick, formatNodesState(world.nodes), {
        place: world.birthPlace,
        afterPulse: true,
        pulse: evt.pulse,
      });
    }
  }
  const substrateSnap = substrateSnapshot(world);
  const lite = world.envProfile?.fieldLiteLog;
  const stat = world.envProfile?.fieldStatMode;
  if (!lite && !stat) {
    recorder.substrate(world.tick, substrateSnap, { place: world.birthPlace });
    recorder.nodes(world.tick, formatNodesState(world.nodes), {
      place: world.birthPlace,
      nodes: nodesSnapshot(world),
    });
    recorder.environment(world.tick, ambienceLine(world), { kind: 'AMB', place: world.birthPlace });
  }

  const delivered = world.signalBus.filter((s) => s.deliverAt === world.tick);
  const tickNodeHits = new Map();
  const activeBeings = world.beings.filter((b) => b.alive);

  for (const being of activeBeings) {
    const heard = delivered.filter((s) => s.fromId !== being.id);
    const profile = world.envProfile;
    const experienceBias = experienceEnabled(profile) ? experienceActBias(being, profile) : null;
    const result = being.tick(world.tick, {
      heardSignals: heard,
      substrate: substrateSnap,
      experienceBias,
      profile,
    });

    if (!result.alive) continue;
    trackStressSample(being, result.stress);

    for (const sig of heard) {
      if (!stat) {
        recorder.log({
          tick: world.tick,
          channel: 'signal',
          beingId: being.id,
          content: `[RX] ${sig.fromId} ${sig.content}`,
          meta: { fromId: sig.fromId, emittedAt: sig.emittedAt },
        });
        recorder.memory(world.tick, being.id, `[MEM] RX t${sig.emittedAt} ${sig.fromId}`, {
          kind: 'RX',
          refTick: sig.emittedAt,
          fromId: sig.fromId,
        });
        const recvSlot = being.socialSlot;
        const emitSlot = slotOf(world, sig.fromId);
        recorder.social(
          world.tick,
          being.id,
          `[SOC] ${recvSlot} RX ${emitSlot} t${sig.emittedAt}`,
          { kind: 'RX', recvSlot, emitSlot, fromId: sig.fromId, emittedAt: sig.emittedAt }
        );
      }
    }

    if (!stat) recorder.internal(world.tick, being.id, result.internal);
    if (result.external.length > 0) {
      if (!stat) recorder.external(world.tick, being.id, result.external);
      for (const line of result.external) {
        if (line.startsWith('[TX]')) {
          world.signalBus.push({
            fromId: being.id,
            content: line,
            emittedAt: world.tick,
            deliverAt: world.tick + 1,
          });
          if (!stat) {
            recorder.memory(world.tick, being.id, `[MEM] TX t${world.tick}`, {
              kind: 'TX',
              refTick: world.tick,
            });
            recorder.social(world.tick, being.id, `[SOC] ${being.socialSlot} TX`, {
              kind: 'TX',
              slot: being.socialSlot,
            });
          }
        } else if (line.startsWith('[ACT]')) {
          const payload = line.slice(5);
          const target = selectActTarget(world, line, being.id, { stress: result.stress });
          const hit = applyActToNode(target, line, being.id, world.tick);
          if (!stat) {
            recorder.environment(world.tick, `[RES] ${world.birthPlace} ${being.id} ${payload}`, {
              fromId: being.id,
              act: line,
              place: world.birthPlace,
              kind: 'RES',
              targetId: hit.nodeId,
            });
            recorder.environment(
              world.tick,
              `[TGT] ${hit.nodeId} -${hit.delta.toFixed(3)} ref ${being.id} lvl ${hit.after.toFixed(3)}`,
              { kind: 'TGT', ...hit, fromId: being.id, place: world.birthPlace }
            );
            if (hit.depleted) {
              recorder.environment(world.tick, `[DEP] ${hit.nodeId} at ${world.birthPlace}`, {
                kind: 'DEP',
                nodeId: hit.nodeId,
                fromId: being.id,
                place: world.birthPlace,
              });
            }
            recorder.nodes(world.tick, formatNodesState(world.nodes), {
              place: world.birthPlace,
              nodes: nodesSnapshot(world),
              afterAct: true,
              fromId: being.id,
            });
            const ptb = perturbFromAct(world, line, being.id);
            recorder.environment(
              world.tick,
              `[PTB] ${world.birthPlace} e${ptb.idx} +${ptb.delta.toFixed(3)} ref ${being.id}`,
              { kind: 'PTB', ...ptb, fromId: being.id, place: world.birthPlace }
            );
            recorder.substrate(world.tick, substrateSnapshot(world), {
              place: world.birthPlace,
              afterAct: true,
              fromId: being.id,
            });
            recorder.memory(world.tick, being.id, `[MEM] ACT t${world.tick}`, {
              kind: 'ACT',
              refTick: world.tick,
            });
            recorder.social(
              world.tick,
              being.id,
              `[SOC] ${being.socialSlot} TGT ${hit.nodeId}`,
              { kind: 'TGT', slot: being.socialSlot, nodeId: hit.nodeId }
            );
          } else {
            perturbFromAct(world, line, being.id);
          }
          const hits = tickNodeHits.get(hit.nodeId) ?? [];
          hits.push(being.socialSlot);
          tickNodeHits.set(hit.nodeId, hits);
        }
      }
    }
    accumulateBiotic(world, being, {
      internalCount: result.internal.length,
      hadExternal: result.external.length > 0,
    });

    const nurtureEvt = tickNurture(world, being);
    if (!stat && nurtureEvt?.transfers?.length) {
      for (const t of nurtureEvt.transfers) {
        recorder.metabolism(
          world.tick,
          being.id,
          `[NUR] e${t.idx} +${t.amount.toFixed(4)} reserve ${nurtureEvt.reserveLeft}`,
          {
            kind: 'NUR',
            phase: 'tick',
            ...t,
            reserveLeft: nurtureEvt.reserveLeft,
            parentId: nurtureEvt.parentId,
          }
        );
      }
      if (nurtureEvt.becameIndependent) {
        recorder.metabolism(world.tick, being.id, `[NUR] independent t${being.tickCount}`, {
          kind: 'NUR',
          phase: 'independent',
          tickCount: being.tickCount,
        });
      }
    }

    const met = runMetabolism(world, being, {
      internalCount: result.internal.length,
      hadExternal: result.external.length > 0,
      drawMult:
        juvenileDrawMultiplier(being, world.envProfile) +
        (metabolicProfileEnabled(profile) ? metabolicDrawMultAdjust(being, profile) : 0),
    });
    if (met.draw && !stat) {
      recorder.metabolism(
        world.tick,
        being.id,
        `[DRW] e${met.draw.idx} -${met.draw.amount.toFixed(4)} act${met.draw.activity}`,
        { kind: 'DRW', ...met.draw }
      );
      if (met.draw.subCellId) {
        recorder.cell(
          world.tick,
          being.id,
          `[INTRA] ${met.draw.subCellId}/${met.draw.subRole} draw e${met.draw.idx}`,
          {
            kind: 'INTRA',
            phase: 'draw',
            subCellId: met.draw.subCellId,
            subRole: met.draw.subRole,
            idx: met.draw.idx,
          }
        );
      }
      if (met.crossBoundary) {
        recorder.cell(
          world.tick,
          being.id,
          `[MBR] e${met.draw.idx} cross domain ${being.cellBoundary.join(',')}`,
          {
            kind: 'MBR',
            idx: met.draw.idx,
            boundary: being.cellBoundary,
            integrity: met.integrity,
          }
        );
      }
    }
    if (met.low) {
      being.lowStreak++;
      if (!stat) {
        recorder.metabolism(
          world.tick,
          being.id,
          `[LOW] e${met.low.idx} ${met.low.value.toFixed(4)}`,
          { kind: 'LOW', ...met.low }
        );
      }
    } else {
      being.lowStreak = 0;
    }

    if (experienceEnabled(profile)) {
      const hadTx = result.external.some((l) => l.startsWith('[TX]'));
      const hadAct = result.external.some((l) => l.startsWith('[ACT]'));
      processExperienceTick(
        world,
        recorder,
        being,
        profile,
        {
          stress: result.stress,
          hadLow: Boolean(met.low),
          hadRx: heard.length > 0,
          hadTx,
          hadAct,
        },
        { fieldStat: stat }
      );
    }

    if (registerProfileEnabled(profile)) {
      processRegisterTick(world, recorder, being, profile, substrateSnap.channels, {
        fieldStat: stat,
      });
    }

    if (metabolicProfileEnabled(profile) && met.draw) {
      processMetabolicProfileTick(
        world,
        recorder,
        being,
        profile,
        {
          idx: met.draw.idx,
          amount: met.draw.amount ?? 0,
          hadLow: Boolean(met.low),
          lowIdx: met.low?.idx ?? null,
        },
        { fieldStat: stat }
      );
    }

    if (!stat && met.intra?.transfers?.length) {
      for (const tr of met.intra.transfers) {
        recorder.cell(
          world.tick,
          being.id,
          `[INTRA] ${tr.fromSub}→${tr.toSub} e${tr.srcIdx}→e${tr.dstIdx} ${tr.amount.toFixed(4)}`,
          { kind: 'INTRA', phase: 'transfer', ...tr }
        );
      }
    }

    const fis = fissionGate(world, being, { stress: result.stress, integrity: met.integrity });
    if (fis) {
      spawnFissionOffspring(world, recorder, being, fis);
    }

    tryRplRenew(world, recorder, being, { stress: result.stress });

    tryMeiosis(world, recorder, being, { stress: result.stress, integrity: met.integrity });

    if (
      !stat &&
      met.integrity != null &&
      (met.crossBoundary || (met.integrity < CELL_INTEGRITY_LOW && world.tick % 25 === 0))
    ) {
      recorder.cell(
        world.tick,
        being.id,
        `[CEL] integrity ${met.integrity.toFixed(3)} domain e${being.cellBoundary.join(' e')}`,
        {
          kind: 'CEL',
          integrity: met.integrity,
          boundary: being.cellBoundary,
          crossBoundary: met.crossBoundary,
        }
      );
    }

    updateStressStreak(being, result.stress);

    if (!stat && (result.stress > 0.12 || met.low)) {
      recorder.viability(
        world.tick,
        being.id,
        `[SVV] stress ${result.stress.toFixed(3)} lowStreak ${being.lowStreak}`,
        {
          kind: 'SVV',
          stress: result.stress,
          lowStreak: being.lowStreak,
          stressStreak: being.stressStreak,
        }
      );
    }

    if (!world.envProfile?.fieldLiteLog) {
      recorder.state(world.tick, being.id, result.registers);
    }

    const term =
      shouldTerminate(being, result.stress) ??
      checkReplicationTermination(being, world.envProfile);
    if (term) {
      collectOrphanPacket(world, being, world.envProfile);
      being.alive = false;
      recorder.viability(world.tick, being.id, `[END] ${term.reason}`, {
        kind: 'END',
        ...term,
        stress: result.stress,
        generation: being.generation,
      });
      recordSelection(recorder, world, being, result.stress);
      spawnLineageOffspring(world, recorder, being);
    }
  }

  processPledgeRenewals(world, recorder);
  processFusions(world, recorder);

  if (!stat) {
    for (const [nodeId, slots] of tickNodeHits) {
      if (slots.length >= 2) {
        recorder.social(
          world.tick,
          null,
          `[SOC] contest ${nodeId} ${slots.join(' ')}`,
          { kind: 'CONTEST', nodeId, slots }
        );
      }
    }
  }

  const biotic = applyBioticCycle(world);
  if (!stat && biotic) {
    for (const evt of biotic.events) {
      const sign = evt.delta >= 0 ? '+' : '';
      recorder.environment(
        world.tick,
        `[BIO] pop ${biotic.alive} e${evt.idx} ${sign}${evt.delta.toFixed(4)} after ${evt.after.toFixed(4)}`,
        { kind: 'BIO', place: world.birthPlace, pop: biotic.alive, ...evt }
      );
    }
    if (biotic.events.length) {
      recorder.substrate(world.tick, substrateSnapshot(world), {
        place: world.birthPlace,
        afterBiotic: true,
        pop: biotic.alive,
      });
    }
  }

  if (shouldRecordComposition(world)) {
    const cmp = compositionSnapshot(world);
    if (cmp) {
      recorder.population(
        world.tick,
        `[CMP] pop ${cmp.pop} codes ${cmp.codes} roots ${cmp.lineageRoots} genMax ${cmp.maxGen} hom ${cmp.codeHom} lhom ${cmp.lineageHom} spread ${cmp.spread} struct ${cmp.structIdx}`,
        { kind: 'CMP', place: world.birthPlace, ...cmp }
      );
    }
  }

  world.signalBus = world.signalBus.filter((s) => s.deliverAt > world.tick);

  return world.tick;
}
