/** PWA 注册与离线状态 — 轻量，不阻塞应用启动 */

export function initPwa() {
  if ('serviceWorker' in navigator) {
    const swUrl = new URL('../sw.js', import.meta.url);
    const scope = new URL('../', import.meta.url).pathname;
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {});
  }

  const badge = document.getElementById('offline-badge');
  if (!badge) return;
  const sync = () => {
    badge.hidden = navigator.onLine;
  };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}
