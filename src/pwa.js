/** PWA 注册与离线状态 — 不改变世界规则 */

export function initPwa() {
  if (!('serviceWorker' in navigator)) return;

  const swUrl = new URL('../sw.js', import.meta.url);
  const scope = new URL('../', import.meta.url).pathname;

  navigator.serviceWorker.register(swUrl, { scope }).catch(() => {});

  const badge = document.getElementById('offline-badge');
  const sync = () => {
    if (badge) badge.hidden = navigator.onLine;
  };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}
