/**
 * 不依赖 node_modules 的 Capgo 原生桥接（OTA 包内可能没有 @capgo/*）
 */

function cap() {
  return globalThis.Capacitor;
}

export function isNativeShell() {
  return cap()?.isNativePlatform?.() === true;
}

async function nativeCall(method, options = {}) {
  const c = cap();
  if (!c) return null;
  if (typeof c.nativePromise === 'function') {
    return c.nativePromise('CapacitorUpdater', method, options);
  }
  const plugin = c.Plugins?.CapacitorUpdater;
  if (plugin?.[method]) return plugin[method](options);
  return null;
}

/** 必须在每次成功启动后调用，否则 Capgo 会回滚热更包 */
export async function notifyAppReadyNative() {
  if (!isNativeShell()) return;
  try {
    await nativeCall('notifyAppReady');
  } catch (err) {
    console.warn('[ota] notifyAppReady failed', err);
  }
}

export async function getBundleVersionLabelNative() {
  if (!isNativeShell()) return '';
  try {
    const cur = await nativeCall('current');
    const v = cur?.bundle?.version;
    return v ? `热更 ${v}` : '热更 内置';
  } catch {
    return '热更 内置';
  }
}
