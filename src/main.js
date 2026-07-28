import { ObserverApp } from './ui/observer.js';
import { initOfflineBadge } from './pwa.js';

try {
  const root = document.getElementById('app');
  if (!root) throw new Error('找不到 #app');
  new ObserverApp(root);
  initOfflineBadge();
} catch (err) {
  document.body.innerHTML = `<pre style="padding:1.5rem;color:#f87171;background:#0a0c12">ElecDog 加载失败：${err.message}\n请硬刷新（Ctrl+Shift+R）或清除站点数据。</pre>`;
  console.error(err);
}
