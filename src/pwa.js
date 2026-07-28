/** PWA 注册、离线状态与版本缓存自愈 */

import { VERSION } from './version.js';

let refreshing = false;

export async function initPwa() {
  if ('serviceWorker' in navigator) {
    const swUrl = new URL('../sw.js', import.meta.url);
    const scope = new URL('../', import.meta.url).pathname;

    try {
      await navigator.serviceWorker.register(swUrl, { scope });
    } catch {
      /* 非 HTTPS 或本地 file:// 时跳过 */
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  await healStaleCache();

  const badge = document.getElementById('offline-badge');
  const sync = () => {
    if (badge) badge.hidden = navigator.onLine;
  };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}

/** meta 版本与缓存模块不一致时清除旧 SW/缓存 */
async function healStaleCache() {
  const meta = document.querySelector('meta[name="elecdog-version"]')?.content?.trim();
  if (!meta || meta === VERSION) return;
  if (!('caches' in window)) return;

  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  window.location.reload();
}
