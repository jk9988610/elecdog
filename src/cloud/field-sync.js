/**
 * 田野归档与笔记云同步 — ElecDog Phase 28
 */
import { buildDashboardStats } from '../ui/stats.js';
import { buildGenealogyArchive, applyGenealogyArchive, applyArchiveBeingSnapshots } from '../world/genealogy-persist.js';
import { isReproEvolutionEntry } from '../ui/repro-evolution-stream.js';
import { getObserverLabel } from './config.js';
import {
  insertFieldRun,
  listFieldNotes,
  listFieldRuns,
  uploadLogBlob,
  upsertFieldNote,
  fetchLogArchive,
} from './rest.js';
import { formatSupabaseError } from './supabase-error.js';

function buildRunSummary(world, recorder) {
  const stats = buildDashboardStats(world, recorder);
  return {
    world: stats.world,
    population: stats.population,
    environment: {
      amb: stats.environment.amb,
      ptb: stats.environment.ptb,
      bio: stats.environment.bio,
      shk: stats.environment.shk,
    },
    logCount: recorder.entries.length,
    exportedAt: new Date().toISOString(),
  };
}

function buildLogArchive(world, recorder) {
  const alive = world.beings.filter((b) => b.alive);
  const genealogy = buildGenealogyArchive(world);
  return {
    exportedAt: new Date().toISOString(),
    kind: 'observer-run',
    world: {
      name: world.name,
      birthPlace: world.birthPlace,
      tick: world.tick,
      createdAt: world.createdAt,
      beingCount: world.beings.length,
      aliveCount: alive.length,
      endedCount: world.beings.filter((b) => !b.alive).length,
      beings: world.beings.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        familyName: b.familyName ?? null,
        givenName: b.givenName ?? null,
        lineageHeadId: b.lineageHeadId ?? b.id,
        generation: b.generation,
        socialSlot: b.socialSlot,
        alive: b.alive,
        pairMorph: b.pairMorph ?? null,
        partnerId: b.partnerId ?? null,
        pairParentA: b.pairParentA ?? b.fissionParent ?? null,
        pairParentB: b.pairParentB ?? null,
        endedAtTick: b.endedAtTick ?? null,
        endReason: b.endReason ?? null,
        lifeStage: b.lifeStage ?? null,
        devStage: b.devStage ?? null,
      })),
    },
    genealogy,
    summary: buildRunSummary(world, recorder),
    entries: recorder.entries,
  };
}

export async function archiveCurrentRun(world, recorder) {
  const runId = crypto.randomUUID();
  const logPath = `runs/${runId}.json`;
  const archive = buildLogArchive(world, recorder);
  const blob = new Blob([JSON.stringify(archive)], { type: 'application/json' });
  await uploadLogBlob(logPath, blob);

  const summary = buildRunSummary(world, recorder);
  const alive = world.beings.filter((b) => b.alive);
  const genealogy = buildGenealogyArchive(world);
  const row = await insertFieldRun({
    id: runId,
    place: world.birthPlace,
    world_name: world.name,
    tick: world.tick,
    alive_count: alive.length,
    total_beings: world.beings.length,
    observer_label: getObserverLabel(),
    summary: {
      ...summary,
      genealogy: {
        nodeCount: genealogy.nodeCount,
        endedCount: genealogy.endedCount,
      },
    },
    log_path: logPath,
  });
  return { ...row, logUrl: logPath };
}

export async function saveFieldNote({ obsId, content, relatedRunId = null, tags = [] }) {
  const trimmedId = obsId?.trim();
  const trimmedContent = content?.trim();
  if (!trimmedId) throw new Error('请填写 OBS 编号（如 OBS-20260729-64）');
  if (!trimmedContent) throw new Error('请填写田野笔记内容');

  try {
    return await upsertFieldNote({
      obs_id: trimmedId,
      content: trimmedContent,
      related_run_id: relatedRunId,
      author_label: getObserverLabel(),
      tags: Array.isArray(tags) ? tags : [],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    throw new Error(formatSupabaseError(err));
  }
}

export async function fetchRecentArchives(limit = 10) {
  return listFieldRuns({ limit });
}

export async function fetchRecentNotes(limit = 20) {
  return listFieldNotes({ limit });
}

export async function loadArchivePreview(logPath, { entryLimit = 40 } = {}) {
  const archive = await fetchLogArchive(logPath);
  const entries = archive.entries ?? [];
  const report = archive.report ?? null;
  const world = archive.world ?? null;
  const summary = archive.summary ?? archive.report?.extension ?? null;

  return {
    kind: archive.kind ?? (report ? 'field-batch' : 'observer-run'),
    world,
    genealogy: archive.genealogy ?? null,
    summary,
    report,
    entryCount: entries.length,
    previewEntries: entries.slice(-entryLimit),
    exportedAt: archive.exportedAt ?? archive.report?.runAt ?? null,
    archive,
  };
}

/** 云归档繁殖进化流条目并入当前 recorder（[MEI]/[DCK]） */
export function mergeArchiveReproEvolution(recorder, entries) {
  if (!recorder || !entries?.length) return { merged: 0 };
  let merged = 0;
  for (const e of entries) {
    if (!isReproEvolutionEntry(e)) continue;
    recorder.evolution(e.tick, e.beingId, e.content, e.meta ?? {});
    merged += 1;
  }
  return { merged };
}

/** 观察台复盘：族谱登记 + 个体快照 + 繁殖进化流日志 */
export function applyObserverArchiveReplay(world, recorder, archive) {
  const genealogy = archive?.genealogy ?? null;
  const genResult = genealogy ? applyGenealogyArchive(world, genealogy) : { applied: 0 };
  const beingResult = archive?.world
    ? applyArchiveBeingSnapshots(world, archive.world)
    : { applied: 0 };
  const reproResult = mergeArchiveReproEvolution(recorder, archive?.entries);
  return {
    genealogy: genResult,
    beingSnapshots: beingResult,
    reproEvolution: reproResult,
  };
}
