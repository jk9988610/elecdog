// 公理: A9 — 时钟与 tick；A1 基底场；TX 次 tick 投递

import {
  advanceSubstrate,
  ambienceLine,
  perturbFromAct,
  substrateSnapshot,
  metabolicExchange,
} from '../world/substrate.js';
import {
  advanceNodes,
  selectActTarget,
  applyActToNode,
  formatNodesState,
  nodesSnapshot,
} from '../world/nodes.js';
import { assignSocialSlot } from '../world/social.js';

function slotOf(world, beingId) {
  return world.beings.find((b) => b.id === beingId)?.socialSlot ?? assignSocialSlot(beingId);
}

export function stepWorld(world, recorder) {
  world.tick++;

  advanceSubstrate(world);
  advanceNodes(world);
  const substrateSnap = substrateSnapshot(world);
  recorder.substrate(world.tick, substrateSnap, { place: world.birthPlace });
  recorder.nodes(world.tick, formatNodesState(world.nodes), {
    place: world.birthPlace,
    nodes: nodesSnapshot(world),
  });
  recorder.environment(world.tick, ambienceLine(world), { kind: 'AMB', place: world.birthPlace });

  const delivered = world.signalBus.filter((s) => s.deliverAt === world.tick);
  const tickNodeHits = new Map();

  for (const being of world.beings) {
    const heard = delivered.filter((s) => s.fromId !== being.id);
    const result = being.tick(world.tick, {
      heardSignals: heard,
      substrate: substrateSnap,
    });

    for (const sig of heard) {
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

    recorder.internal(world.tick, being.id, result.internal);
    if (result.external.length > 0) {
      recorder.external(world.tick, being.id, result.external);
      for (const line of result.external) {
        if (line.startsWith('[TX]')) {
          world.signalBus.push({
            fromId: being.id,
            content: line,
            emittedAt: world.tick,
            deliverAt: world.tick + 1,
          });
          recorder.memory(world.tick, being.id, `[MEM] TX t${world.tick}`, {
            kind: 'TX',
            refTick: world.tick,
          });
          recorder.social(world.tick, being.id, `[SOC] ${being.socialSlot} TX`, {
            kind: 'TX',
            slot: being.socialSlot,
          });
        } else if (line.startsWith('[ACT]')) {
          const payload = line.slice(5);
          const target = selectActTarget(world, line, being.id);
          const hit = applyActToNode(target, line, being.id, world.tick);
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
          const hits = tickNodeHits.get(hit.nodeId) ?? [];
          hits.push(being.socialSlot);
          tickNodeHits.set(hit.nodeId, hits);
        }
      }
    }
    const met = metabolicExchange(world, being, {
      internalCount: result.internal.length,
      hadExternal: result.external.length > 0,
    });
    if (met.draw) {
      recorder.metabolism(
        world.tick,
        being.id,
        `[DRW] e${met.draw.idx} -${met.draw.amount.toFixed(4)} act${met.draw.activity}`,
        { kind: 'DRW', ...met.draw }
      );
    }
    if (met.low) {
      recorder.metabolism(
        world.tick,
        being.id,
        `[LOW] e${met.low.idx} ${met.low.value.toFixed(4)}`,
        { kind: 'LOW', ...met.low }
      );
    }
    recorder.state(world.tick, being.id, result.registers);
  }

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

  world.signalBus = world.signalBus.filter((s) => s.deliverAt > world.tick);

  return world.tick;
}
