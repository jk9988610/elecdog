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
import { terrainNodeHitMult } from '../world/place.js';
import { tickPcp, pcpEnabled, recordPcpLow, recordPcpDrw } from '../world/pcp.js';
import { tickSeasonal, recordSeasonalLow } from '../world/seasonal.js';
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
import { tickLactationContact } from '../world/body-structures.js';
import { tickSenses } from '../world/senses.js';
import { tickHormoneSecretion } from '../world/hormone-system.js';
import { runMetabolism } from '../world/organism.js';
import { tickReservoir, reservoirEnabled } from '../world/reservoir.js';
import { tickSynth, synthEnabled } from '../world/synth.js';
import { tickSymModules, symCaptureEnabled } from '../world/sym.js';
import { tickDiurnal, diurnalEnabled, recordDiurnalLow, initDiurnalStats } from '../world/diurnal.js';
import { prepAirDiurnal, airEnabled } from '../world/air.js';
import { tickLunar, ltcEnabled } from '../world/ltc.js';
import { tickAdv, advEnabled } from '../world/adv.js';
import { tickArt, tryArtDeposit, artEnabled, artDrawBonus } from '../world/art.js';
import { tickVent, ventEnabled } from '../world/vent.js';
import { tickMigration } from '../world/mig.js';
import { meanStress } from '../world/selection.js';
import { dissipationEnabled } from '../world/dissip.js';
import { fissionGate, spawnFissionOffspring } from '../world/fission.js';
import { checkReplicationTermination } from '../world/replication.js';
import { tryRplRenew, processPledgeRenewals } from '../world/rpl-renew.js';
import { tryMeiosis, processFusions, collectOrphanPacket } from '../world/recombination.js';
import {
  pairFusInBodyEnabled,
  processPairReproduction,
  tryDockedHalf,
  annotatePairHalfMetadata,
} from '../world/pair-repro.js';
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
import {
  cooperationProfileEnabled,
  cooperationActBias,
  mergeActBias,
  processCooperationTick,
} from '../world/cooperation-profile.js';
import {
  reproductionProfileEnabled,
  reproductionActBias,
  processReproductionProfileTick,
} from '../world/reproduction-profile.js';
import {
  electronicHumanEnabled,
  electronicHumanActBias,
  processElectronicHumanTick,
} from '../world/electronic-human-profile.js';
import {
  memoryFeedbackEnabled,
  memoryActBias,
  decayMemoryLoads,
  accumulateMemoryLoads,
} from '../world/memory-feedback.js';
import { predictionEnabled, predictionFeedbackEnabled, predictionActBias, processPredictionTick } from '../world/prediction.js';
import { semEnabled, recordSemRx, recordSemTx, semFeedbackEnabled, semActBias } from '../world/sem.js';
import { internalTxCouplingEnabled } from '../world/internal-tx-coupling.js';
import {
  filterHeardSignals,
  parseDirectedTx,
  substantiveSignalOnly,
} from '../world/substantive-signal.js';
import { resolveLifeStage, tickMulticellDevelopment } from '../world/multicell-v2.js';
import {
  organPathwayExperienceBias,
  recordOrganPathwayTick,
} from '../world/organ-pathway.js';
import { recordGenealogyEnd } from '../world/genealogy-persist.js';
import {
  registerPairSpeechPRQ,
  registerPairSpeechPGR,
} from '../world/pair-repro.js';
import { noteSemDomainFromKind, noteSemDomainFromTick } from '../world/sem-domain.js';
import {
  socialKnowledgeEnabled,
  socialKnowledgeFeedbackEnabled,
  socialKnowledgeActBias,
  accumulateSocialEncode,
  processSocialKnowledgeTick,
} from '../world/social-knowledge.js';

function slotOf(world, beingId) {
  return world.beings.find((b) => b.id === beingId)?.socialSlot ?? assignSocialSlot(beingId);
}

export function stepWorld(world, recorder) {
  world.tick++;

  const profile = world.envProfile ?? {};
  const scl = tickSeasonal(world, profile);
  const airPrep = prepAirDiurnal(world, profile);
  const dlc = tickDiurnal(world, profile, {
    solar: airPrep.solar,
    night: airPrep.night,
    airSolarMult: airPrep.air.solarAtten,
  });
  const effectiveSolar = airPrep.air.effectiveSolar;
  const air = airPrep.air;
  const pcp = tickPcp(world, profile, {
    solar: effectiveSolar,
    night: dlc?.night ?? airPrep.night,
  });
  const ltc = tickLunar(world, profile);
  const adv = tickAdv(world, profile);
  const art = tickArt(world, profile);
  const vtn = tickVent(world, profile);
  world.airMods = {
    effectiveSolar: air.effectiveSolar,
    solarAtten: air.solarAtten,
    drainMult: air.drainMult,
  };
  if (vtn?.fired && world.vent) {
    world.vent.lastInject = vtn.inject;
  }
  const alivePre = world.beings.filter((b) => b.alive);
  const meanStressVal = alivePre.length
    ? alivePre.reduce((s, b) => s + meanStress(b), 0) / alivePre.length
    : 0;
  const mig = tickMigration(world, profile, { meanStress: meanStressVal });
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
    if (dlc && world._dlcQuarter !== dlc.quarter) {
      world._dlcQuarter = dlc.quarter;
      recorder.environment(
        world.tick,
        `[DLC] ${world.birthPlace} solar ${dlc.solar.toFixed(3)} e${dlc.idx} q${dlc.quarter}`,
        { kind: 'DLC', place: world.birthPlace, ...dlc }
      );
    }
    if (airEnabled(profile) && air && world._airQuarter !== air.quarter) {
      world._airQuarter = air.quarter;
      recorder.environment(
        world.tick,
        `[AIR] ${world.birthPlace} scalar ${air.scalar} solarEff ${air.effectiveSolar} drain×${air.drainMult}`,
        { kind: 'AIR', place: world.birthPlace, ...air }
      );
    }
    if (pcp?.fired) {
      const t0 = pcp.transfers?.[0];
      recorder.environment(
        world.tick,
        `[PCP] ${world.birthPlace} burst ${pcp.burst} atmo ${pcp.atmoStore} e${t0?.idx ?? 1} +${t0?.delta ?? 0}`,
        { kind: 'PCP', place: world.birthPlace, ...pcp }
      );
    }
    if (scl?.changed) {
      recorder.environment(
        world.tick,
        `[SCL] ${world.birthPlace} phase ${scl.phase} floor×${scl.floorMult} boost×${scl.boostMult}`,
        { kind: 'SCL', place: world.birthPlace, ...scl }
      );
    }
    if (ltc?.changed) {
      recorder.environment(
        world.tick,
        `[LTC] ${world.birthPlace} phase ${ltc.phase} tide ${ltc.tide} regen×${ltc.regenMult}`,
        { kind: 'LTC', place: world.birthPlace, ...ltc }
      );
    }
    if (adv?.fired) {
      recorder.environment(
        world.tick,
        `[ADV] ${world.birthPlace} ←${adv.neighbor} e${adv.idx} ${adv.delta >= 0 ? '+' : ''}${adv.delta} flux ${adv.flux}`,
        { kind: 'ADV', place: world.birthPlace, ...adv }
      );
    }
    if (art?.active > 0 && world.tick % 120 === 0) {
      recorder.environment(
        world.tick,
        `[ART] ${world.birthPlace} active ${art.active} draw+${art.drawBonus} inject ${art.inject}`,
        { kind: 'ART', place: world.birthPlace, ...art }
      );
    }
    if (vtn?.fired && world.tick % 60 === 0) {
      const t0 = vtn.transfers?.[0];
      recorder.environment(
        world.tick,
        `[VTN] ${world.birthPlace} inject ${vtn.inject} boost×${vtn.boostMult} e${t0?.idx ?? 0}`,
        { kind: 'VTN', place: world.birthPlace, ...vtn }
      );
    }
    if (mig?.fired) {
      recorder.environment(
        world.tick,
        `[MIG] ${mig.from}→${mig.to} alt ${mig.altFrom}→${mig.altTo} tax ${mig.tax}`,
        { kind: 'MIG', place: world.birthPlace, ...mig }
      );
    }
  }

  const delivered = world.signalBus.filter((s) => s.deliverAt === world.tick);
  const tickNodeHits = new Map();
  const socialTickCtx = new Map();
  const activeBeings = world.beings.filter((b) => b.alive);

  for (const being of activeBeings) {
    resolveLifeStage(being, world, world.envProfile);
    tickMulticellDevelopment(world, recorder, being, world.envProfile);
    const heard = filterHeardSignals(delivered, being.id, world.envProfile);
    const profile = world.envProfile;
    recordOrganPathwayTick(world, recorder, being, profile);
    if (memoryFeedbackEnabled(profile)) {
      decayMemoryLoads(being);
    }
    const experienceBias = mergeActBias(
      experienceEnabled(profile) ? experienceActBias(being, profile) : null,
      cooperationProfileEnabled(profile) ? cooperationActBias(being, profile) : null,
      reproductionProfileEnabled(profile) ? reproductionActBias(being, profile) : null,
      electronicHumanEnabled(profile) ? electronicHumanActBias(being, profile) : null,
      memoryFeedbackEnabled(profile) ? memoryActBias(being, profile) : null,
      predictionFeedbackEnabled(profile) ? predictionActBias(being, profile) : null,
      socialKnowledgeFeedbackEnabled(profile) ? socialKnowledgeActBias(being, profile) : null,
      semFeedbackEnabled(profile) ? semActBias(being, world, profile) : null,
      organPathwayExperienceBias(being, profile)
    );
    const result = being.tick(world.tick, {
      heardSignals: heard,
      substrate: substrateSnap,
      experienceBias,
      profile,
      world,
    });

    if (!result.alive) continue;
    trackStressSample(being, result.stress);

    let crossRx = 0;
    for (const sig of heard) {
      if (slotOf(world, sig.fromId) !== being.socialSlot) crossRx++;
    }
    socialTickCtx.set(being.id, {
      hadRx: heard.length > 0,
      crossRx,
      hadTx: result.external.some((l) => l.startsWith('[TX]')),
      hadAct: result.external.some((l) => l.startsWith('[ACT]')),
      hadContest: false,
    });

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

    if (semEnabled(profile)) {
      recordSemRx(being, heard, world.tick);
    }

    if (!stat) recorder.internal(world.tick, being.id, result.internal);
    if (result.external.length > 0) {
      if (!stat) recorder.external(world.tick, being.id, result.external);
      else {
        being.fieldExtTicks = (being.fieldExtTicks ?? 0) + 1;
        for (const line of result.external) {
          if (line.startsWith('[ACT]')) being.fieldActCount = (being.fieldActCount ?? 0) + 1;
          else if (line.startsWith('[TX]')) being.fieldTxCount = (being.fieldTxCount ?? 0) + 1;
        }
      }
      for (const line of result.external) {
        if (line.startsWith('[TX]')) {
          const directed = parseDirectedTx(line);
          world.signalBus.push({
            fromId: being.id,
            content: line,
            emittedAt: world.tick,
            deliverAt: world.tick + 1,
            toId: directed?.toId ?? null,
            intent: directed?.intent ?? null,
          });
          if (directed?.intent === 'PRQ' && being.pairMorph === 'A') {
            registerPairSpeechPRQ(world, recorder, being, directed.toId, line);
          } else if (directed?.intent === 'PGR' && being.pairMorph === 'B') {
            registerPairSpeechPGR(world, recorder, being, directed.toId, line);
          }
          if (semEnabled(profile)) {
            recordSemTx(world, recorder, being, profile, line, { fieldStat: stat });
          }
          if (!stat) {
            recorder.memory(world.tick, being.id, `[MEM] TX t${world.tick}`, {
              kind: 'TX',
              refTick: world.tick,
              toId: directed?.toId ?? null,
              intent: directed?.intent ?? null,
            });
            recorder.social(world.tick, being.id, `[SOC] ${being.socialSlot} TX`, {
              kind: 'TX',
              slot: being.socialSlot,
              toId: directed?.toId ?? null,
              intent: directed?.intent ?? null,
            });
            if (
              (internalTxCouplingEnabled(profile) && being.internalTxAppliedTick) ||
              (substantiveSignalOnly(profile) && directed)
            ) {
              recorder.evolution(
                world.tick,
                being.id,
                `[THO] int→tx load ${being.internalTxLoad ?? 0}`,
                {
                  kind: 'THO',
                  load: being.internalTxLoad ?? 0,
                  sourceInternal: being.lastInternalTxSource ?? '',
                  txLine: line,
                  intent: directed?.intent ?? null,
                  toId: directed?.toId ?? null,
                  queryMode: directed?.queryMode ?? null,
                  substantive: substantiveSignalOnly(profile),
                }
              );
              being.internalTxAppliedTick = false;
            }
          }
        } else if (line.startsWith('[ACT]')) {
          const payload = line.slice(5);
          const target = selectActTarget(world, line, being.id, { stress: result.stress });
          const hit = applyActToNode(target, line, being.id, world.tick, {
            hitMult: terrainNodeHitMult(world, profile),
          });
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
          const deposited = tryArtDeposit(world, being, profile, { stress: result.stress });
          if (deposited && !stat) {
            recorder.cell(
              world.tick,
              being.id,
              `[ART] deposit ${deposited.id} e${deposited.channel} ttl ${deposited.ttl}`,
              { kind: 'ART', phase: 'deposit', ...deposited }
            );
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
      noteSemDomainFromKind(being, 'NUR', world.tick);
    }

    const lacEvt = tickLactationContact(world, recorder, being, profile);
    if (!stat && lacEvt?.transfers?.length) {
      recorder.metabolism(
        world.tick,
        being.id,
        `[LAC] +${lacEvt.transfers.length}ch parent ${lacEvt.parentId}`,
        { kind: 'LAC', ...lacEvt }
      );
    }

    const senseHints = {
      hadExternal: result.external.length > 0,
      hadAct: result.external.some((l) => l.startsWith('[ACT]')),
      hadDraw: result.external.some((l) => l.startsWith('[DRW]')),
      heardCount: heard.length,
      fieldTxCount: heard.filter((s) => s.content?.includes('[TX]')).length,
      symModuleCount: being.symModules?.filter((m) => m.active)?.length ?? 0,
      hadFieldExt: (being.fieldExtTicks ?? 0) > 0,
      contestHit: [...tickNodeHits.values()].some(
        (slots) => slots.length >= 2 && slots.includes(being.socialSlot)
      ),
    };
    if (!stat) tickSenses(world, recorder, being, profile, senseHints);

    const senCellCount = Object.entries(being.logicCells ?? {}).reduce(
      (n, [k, v]) => (k.startsWith('LOG-SEN-') ? n + (v?.length ?? 0) : n),
      0
    );
    if (!stat) {
      tickHormoneSecretion(world, recorder, being, profile, {
        stress: result.stress,
        senCellCount,
      });
    }

    const met = runMetabolism(world, being, {
      internalCount: result.internal.length,
      hadExternal: result.external.length > 0,
      drawMult:
        juvenileDrawMultiplier(being, world.envProfile) +
        (metabolicProfileEnabled(profile) ? metabolicDrawMultAdjust(being, profile) : 0) +
        artDrawBonus(world, profile),
    });
    if (met.draw && !stat) {
      recordPcpDrw(world, { idx: met.draw.idx });
        recorder.metabolism(
          world.tick,
          being.id,
          `[DRW] e${met.draw.idx} -${met.draw.amount.toFixed(4)} act${met.draw.activity}`,
          { kind: 'DRW', ...met.draw }
        );
        noteSemDomainFromKind(being, 'DRW', world.tick);
      if (met.draw.dsp && dissipationEnabled(profile)) {
        const d = met.draw.dsp;
        recorder.metabolism(
          world.tick,
          being.id,
          `[DSP] e${d.idx} +${d.toReg.toFixed(4)} lost ${d.lost.toFixed(4)} y${d.frac}`,
          { kind: 'DSP', ...d }
        );
      }
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
      if (dlc) recordDiurnalLow(world, { night: dlc.night });
      recordPcpLow(world, { idx: met.low.idx });
      if (scl) recordSeasonalLow(world, scl.phase);
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

    noteSemDomainFromTick(being, world, profile, {
      hadDraw: Boolean(met.draw),
      hadLow: Boolean(met.low),
      hadAct: result.external.some((l) => l.startsWith('[ACT]')),
      hadCrossBoundary: Boolean(met.crossBoundary),
      lowIntegrity: met.integrity != null && met.integrity < CELL_INTEGRITY_LOW,
      hadIntra: Boolean(met.intra?.transfers?.length),
    });

    if (reservoirEnabled(profile)) {
      const rsv = tickReservoir(being, profile, {
        stress: result.stress,
        draw: met.draw,
        hadLow: Boolean(met.low),
      });
      if (rsv?.events?.length && !stat) {
        for (const evt of rsv.events) {
          const sign = evt.phase === 'in' ? '+' : '-';
          const via = evt.via ? ` ${evt.via}` : '';
          recorder.metabolism(
            world.tick,
            being.id,
            `[RSV] ${evt.phase} e${evt.idx} ${sign}${evt.amount.toFixed(4)} sum ${rsv.reservoirSum}${via}`,
            { kind: 'RSV', ...evt, reservoirSum: rsv.reservoirSum }
          );
        }
      }
    }

    if (synthEnabled(profile)) {
      const sym = tickSynth(being, profile, {
        stress: result.stress,
        solar: effectiveSolar,
        night: dlc?.night ?? false,
        substrate: substrateSnap.channels,
      });
      if (sym?.events?.length && !stat) {
        for (const evt of sym.events) {
          const sign = evt.kind === 'synth-a' ? '+' : '→';
          recorder.cell(
            world.tick,
            being.id,
            `[SYM] ${evt.kind} e${evt.idx} ${sign}${evt.amount.toFixed(4)} rsv ${sym.reservoirSum}`,
            { kind: 'SYM', ...evt, reservoirSum: sym.reservoirSum }
          );
        }
      }
    }

    if (symCaptureEnabled(profile) || being.symModules?.length) {
      const mod = tickSymModules(being, profile, {
        stress: result.stress,
        solar: effectiveSolar,
        night: dlc?.night ?? false,
      });
      if (mod?.events?.length && !stat) {
        for (const evt of mod.events) {
          recorder.cell(
            world.tick,
            being.id,
            `[SYM] module ${evt.moduleId} ${evt.action} e${evt.idx} ${evt.amount.toFixed(4)}`,
            { kind: 'SYM', phase: 'module', ...evt, reservoirSum: mod.reservoirSum }
          );
        }
      }
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

    if (memoryFeedbackEnabled(profile)) {
      const hadTx = result.external.some((l) => l.startsWith('[TX]'));
      const hadAct = result.external.some((l) => l.startsWith('[ACT]'));
      accumulateMemoryLoads(being, {
        hadRx: heard.length > 0,
        hadTx,
        hadAct,
      });
    }

    if (registerProfileEnabled(profile)) {
      processRegisterTick(world, recorder, being, profile, substrateSnap.channels, {
        fieldStat: stat,
      });
    }

    if (predictionEnabled(profile)) {
      processPredictionTick(world, recorder, being, profile, substrateSnap.channels, {
        fieldStat: stat,
      });
    }

    if (socialKnowledgeEnabled(profile)) {
      const ctx = socialTickCtx.get(being.id);
      accumulateSocialEncode(being, {
        hadRx: ctx?.hadRx ?? heard.length > 0,
        crossRx: ctx?.crossRx ?? 0,
      });
      processSocialKnowledgeTick(world, recorder, being, profile, { fieldStat: stat });
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

    if (pairFusInBodyEnabled(world.envProfile)) {
      if (being.pairMorph === 'A') {
        tryMeiosis(world, recorder, being, { stress: result.stress, integrity: met.integrity });
        annotatePairHalfMetadata(being, world.envProfile);
      } else if (being.pairMorph === 'B') {
        tryDockedHalf(world, recorder, being, { stress: result.stress, integrity: met.integrity });
      }
    } else {
      tryMeiosis(world, recorder, being, { stress: result.stress, integrity: met.integrity });
    }

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
      recordGenealogyEnd(world, being, { ...term, stress: result.stress });
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

  if (cooperationProfileEnabled(world.envProfile)) {
    for (const being of world.beings.filter((b) => b.alive)) {
      const ctx = socialTickCtx.get(being.id);
      if (!ctx) continue;
      let hadContest = false;
      for (const slots of tickNodeHits.values()) {
        if (slots.length >= 2 && slots.includes(being.socialSlot)) {
          hadContest = true;
          break;
        }
      }
      processCooperationTick(
        world,
        recorder,
        being,
        world.envProfile,
        { ...ctx, hadContest },
        { fieldStat: stat }
      );
    }
  }

  if (reproductionProfileEnabled(world.envProfile)) {
    for (const being of world.beings.filter((b) => b.alive)) {
      processReproductionProfileTick(world, recorder, being, world.envProfile, {
        fieldStat: stat,
      });
    }
  }

  if (electronicHumanEnabled(world.envProfile)) {
    for (const being of world.beings.filter((b) => b.alive)) {
      const ctx = socialTickCtx.get(being.id);
      if (!ctx) continue;
      processElectronicHumanTick(world, recorder, being, world.envProfile, ctx, {
        fieldStat: stat,
      });
    }
  }

  processPledgeRenewals(world, recorder);
  if (pairFusInBodyEnabled(world.envProfile)) {
    processPairReproduction(world, recorder);
  } else {
    processFusions(world, recorder);
  }

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
