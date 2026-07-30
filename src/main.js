import { ObserverApp } from './ui/observer.js';
import {
  getBundleVersionLabelNative,
  isNativeShell,
  notifyAppReadyNative,
  runOtaBootstrapNative,
  checkWebOtaStatus,
} from './ota/native-bridge.js';
import { SITE_OTA_VERSION } from './site-build.js';

function showBootError(err) {
  const root = document.getElementById('app');
  if (!root) return;
  const msg = err?.message || String(err);
  root.innerHTML = `
    <section class="boot-error panel" style="margin:1rem;padding:1rem">
      <h2>观察台启动失败</h2>
      <p>${msg}</p>
      <p class="muted">请强制刷新；APK 可点「检查热更」或重装壳层。</p>
    </section>
  `;
}

async function bootstrap() {
  let otaLabel = '';
  let otaStatus = '';
  const native = isNativeShell();

  if (native) {
    const ota = await runOtaBootstrapNative();
    if (ota.updated) {
      window.location.reload();
      return;
    }
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

try {
  await bootstrap();
} catch (err) {
  console.error('[boot] failed', err);
  showBootError(err);
}
