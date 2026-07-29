/**
 * Capgo 原生桥接 — 不依赖 node_modules，内置包与热更包均可运行
 */

import { OTA_WWW_MANIFEST } from './config.js';

function cap() {
  return globalThis.Capacitor;
}

export function isNativeShell() {
  return cap()?.isNativePlatform?.() === true;
}

async function nativeCall(method, options = {}) {
  const c = cap();
  if (!c) throw new Error('Capacitor 不可用');
  if (typeof c.nativePromise === 'function') {
    return c.nativePromise('CapacitorUpdater', method, options);
  }
  const plugin = c.Plugins?.CapacitorUpdater;
  if (plugin?.[method]) return plugin[method](options);
  throw new Error(`CapacitorUpdater.${method} 不可用`);
}

function semverGt(a, b) {
  const pa = String(a || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

async function currentBundleInfo() {
  try {
    return (await nativeCall('current')) || {};
  } catch {
    return {};
  }
}

function formatLabel(cur) {
  const v = cur?.bundle?.version;
  return v ? `热更 ${v}` : '热更 内置';
}

export async function getBundleVersionLabelNative() {
  if (!isNativeShell()) return '';
  return formatLabel(await currentBundleInfo());
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

/**
 * 检查并应用网页热更新
 * @returns {{ updated: boolean, label: string, status: string }}
 */
export async function runOtaBootstrapNative() {
  if (!isNativeShell()) {
    return { updated: false, label: '', status: '' };
  }

  let status = '';
  try {
    const cur = await currentBundleInfo();
    const current = cur?.bundle?.version || '0.0.0';
    const label = formatLabel(cur);

    const res = await fetch(OTA_WWW_MANIFEST, { cache: 'no-store' });
    if (!res.ok) {
      return { updated: false, label, status: `清单 HTTP ${res.status}` };
    }

    const manifest = await res.json();
    if (!manifest?.version || !manifest?.url) {
      return { updated: false, label, status: '清单格式错误' };
    }

    status = `本机 ${current} → 线上 ${manifest.version}`;

    if (!semverGt(manifest.version, current)) {
      return { updated: false, label, status: `${status} · 已最新` };
    }

    status = `${status} · 下载中…`;
    const bundle = await nativeCall('download', {
      version: manifest.version,
      url: manifest.url,
      checksum: manifest.checksum,
    });

    status = `${status} · 切换中…`;
    await nativeCall('set', bundle);
    return { updated: true, label: `热更 ${manifest.version}`, status: `${status} · 完成` };
  } catch (err) {
    const label = await getBundleVersionLabelNative();
    const msg = err?.message || String(err);
    return { updated: false, label, status: status ? `${status} · 失败: ${msg}` : `失败: ${msg}` };
  }
}
