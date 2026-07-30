import { ObserverApp } from './ui/observer.js';
import {
  getBundleVersionLabelNative,
  isNativeShell,
  notifyAppReadyNative,
  runOtaBootstrapNative,
  checkWebOtaStatus,
} from './ota/native-bridge.js';
import { SITE_OTA_VERSION } from './site-build.js';

async function bootstrap() {
  let otaLabel = '';
  let otaStatus = '';
  const native = isNativeShell();

  if (native) {
    const ota = await runOtaBootstrapNative();
    if (ota.updated) return;
    otaLabel = ota.label || (await getBundleVersionLabelNative());
    otaStatus = ota.status || '';
  } else {
    const web = await checkWebOtaStatus(SITE_OTA_VERSION);
    otaLabel = web.local !== 'dev' ? `网页 ${web.local}` : '';
    otaStatus = web.status;
  }

  new ObserverApp(document.getElementById('app'), {
    otaLabel,
    otaStatus,
    nativeShell: native,
  });
  await notifyAppReadyNative();
}

await bootstrap();
