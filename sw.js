// 自毁型 SW：清除旧缓存并注销自身（修复历史空白页）
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
