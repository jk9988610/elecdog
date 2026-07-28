import { ObserverApp } from './ui/observer.js';
import { initPwa } from './pwa.js';

const root = document.getElementById('app');
if (!root) {
  document.body.textContent = 'ElecDog：页面结构异常，请硬刷新或清除站点数据后重试。';
} else {
  new ObserverApp(root);
  initPwa();
}
