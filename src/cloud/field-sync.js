/**
 * 田野归档与笔记云同步 — ElecDog Phase 28
 */
import { buildDashboardStats } from '../ui/stats.js';
import { getObserverLabel } from './config.js';
import {
  insertFieldRun,
  listFieldNotes,
  listFieldRuns,
  uploadLogBlob,
  upsertFieldNote,
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
  return {
    exportedAt: new Date().toISOString(),
    world: {
      name: world.name,
      birthPlace: world.birthPlace,
      tick: world.tick,
      createdAt: world.createdAt,
      beingCount: world.beings.length,
      aliveCount: alive.length,
      beings: alive.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        generation: b.generation,
        socialSlot: b.socialSlot,
      })),
    },
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
  const row = await insertFieldRun({
    id: runId,
    place: world.birthPlace,
    world_name: world.name,
    tick: world.tick,
    alive_count: alive.length,
    total_beings: world.beings.length,
    observer_label: getObserverLabel(),
    summary,
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
