import { ObserverApp } from './ui/observer.js';

async function bootstrap() {
  // OTA 仅原生壳需要；浏览器/Pages 不加载 Capacitor 依赖，避免白屏
  if (globalThis.Capacitor?.isNativePlatform?.()) {
    try {
      const { runOtaBootstrap } = await import('./ota/updater.js');
      await runOtaBootstrap();
    } catch (err) {
      console.warn('[ota] bootstrap failed', err);
    }
  }
  new ObserverApp(document.getElementById('app'));
}

await bootstrap();
