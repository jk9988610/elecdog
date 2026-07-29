import { ObserverApp } from './ui/observer.js';
import { getBundleVersionLabelNative, notifyAppReadyNative } from './ota/native-bridge.js';

async function bootstrap() {
  let otaLabel = '';
  if (globalThis.Capacitor?.isNativePlatform?.()) {
    try {
      const { runOtaBootstrap, getBundleVersionLabel } = await import('./ota/updater.js');
      await runOtaBootstrap();
      try {
        otaLabel = await getBundleVersionLabel();
      } catch {
        otaLabel = await getBundleVersionLabelNative();
      }
    } catch (err) {
      console.warn('[ota] bootstrap failed', err);
      otaLabel = await getBundleVersionLabelNative();
    }
  }
  new ObserverApp(document.getElementById('app'), { otaLabel });
  await notifyAppReadyNative();
}

await bootstrap();
