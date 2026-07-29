/**
 * Supabase Realtime — 多设备田野归档/笔记同步
 * 模式参考 Beat-Battle subscribeSeasonChanges
 */
import { getCloudConfig, isCloudEnabled } from './config.js';

const SUPABASE_CDN_URLS = [
  'https://esm.sh/@supabase/supabase-js@2.49.1?bundle',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm',
];

let libPromise = null;
let activeUnsub = null;

async function loadClient() {
  if (!isCloudEnabled()) return null;
  if (!libPromise) {
    libPromise = (async () => {
      let lastErr;
      for (const url of SUPABASE_CDN_URLS) {
        try {
          const mod = await import(url);
          const { url: sbUrl, anonKey } = getCloudConfig();
          return mod.createClient(sbUrl, anonKey);
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr || new Error('Supabase SDK 无法加载');
    })();
  }
  return libPromise;
}

/**
 * @param {{
 *   onArchive?: (row: object) => void,
 *   onNote?: (row: object) => void,
 *   onCodex?: (row: object) => void,
 *   onStatus?: (status: string) => void,
 * }} handlers
 * @returns {() => void} unsubscribe
 */
export async function subscribeFieldCloud(handlers = {}) {
  if (!isCloudEnabled()) return () => {};

  if (activeUnsub) {
    activeUnsub();
    activeUnsub = null;
  }

  const sb = await loadClient();
  if (!sb) return () => {};

  const channel = sb
    .channel('elecdog-field-cloud')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'field_runs' },
      (payload) => handlers.onArchive?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'field_notes' },
      (payload) => handlers.onNote?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'field_notes' },
      (payload) => handlers.onNote?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'codex_entries' },
      (payload) => handlers.onCodex?.(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'codex_entries' },
      (payload) => handlers.onCodex?.(payload.new)
    )
    .subscribe((status) => handlers.onStatus?.(status));

  const unsub = () => {
    sb.removeChannel(channel);
    if (activeUnsub === unsub) activeUnsub = null;
  };
  activeUnsub = unsub;
  return unsub;
}

export function stopFieldCloudSubscription() {
  if (activeUnsub) {
    activeUnsub();
    activeUnsub = null;
  }
}
