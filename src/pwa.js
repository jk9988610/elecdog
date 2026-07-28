/** 离线状态徽章 — 不注册 Service Worker */

export function initOfflineBadge() {
  const badge = document.getElementById('offline-badge');
  if (!badge) return;
  const sync = () => {
    badge.hidden = navigator.onLine;
  };
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
  sync();
}
