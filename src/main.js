import { ObserverApp } from './ui/observer.js';

async function bootstrap() {
  let otaLabel = '';
  // OTA 仅原生壳需要；浏览器/Pages 不加载 Capacitor 依赖，避免白屏
  if (globalThis.Capacitor?.isNativePlatform?.()) {
    try {
      const { runOtaBootstrap, getBundleVersionLabel } = await import('./ota/updater.js');
      await runOtaBootstrap();
      otaLabel = await getBundleVersionLabel();
    } catch (err) {
      console.warn('[ota] bootstrap failed', err);
    }
  }
  new ObserverApp(document.getElementById('app'), { otaLabel });
}

await bootstrap();
