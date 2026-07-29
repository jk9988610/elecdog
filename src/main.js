import { ObserverApp } from './ui/observer.js';
import {
  getBundleVersionLabelNative,
  isNativeShell,
  notifyAppReadyNative,
  runOtaBootstrapNative,
} from './ota/native-bridge.js';

async function bootstrap() {
  let otaLabel = '';
  let otaStatus = '';
  const native = isNativeShell();

  if (native) {
    const ota = await runOtaBootstrapNative();
    if (ota.updated) return;
    otaLabel = ota.label || (await getBundleVersionLabelNative());
    otaStatus = ota.status || '';
  }

  new ObserverApp(document.getElementById('app'), {
    otaLabel,
    otaStatus,
    nativeShell: native,
  });
  await notifyAppReadyNative();
}

await bootstrap();
