/**
 * 网页热更新（Capgo）+ APK 整包更新提示
 * 仅原生壳运行；浏览器访问时跳过
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { OTA_APK_MANIFEST, OTA_WWW_MANIFEST } from './config.js';

function semverGt(a, b) {
  const pa = String(a || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function currentBundleVersion() {
  try {
    const cur = await CapacitorUpdater.current();
    // 只比较网页 bundle 版本，不用 APK 壳 versionName（如 1.0），否则 0.29.x 永远判为更旧
    return cur?.bundle?.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function maybeApplyWebUpdate() {
  const manifest = await fetchJson(OTA_WWW_MANIFEST);
  if (!manifest?.version || !manifest.url || !manifest.checksum) return false;

  const current = await currentBundleVersion();
  if (!semverGt(manifest.version, current)) return false;

  const bundle = await CapacitorUpdater.download({
    version: manifest.version,
    url: manifest.url,
    checksum: manifest.checksum,
  });
  await CapacitorUpdater.set(bundle);
  return true;
}

async function maybePromptApkUpdate() {
  const manifest = await fetchJson(OTA_APK_MANIFEST);
  if (!manifest?.versionCode || !manifest.apkUrl) return;

  const info = await App.getInfo();
  const localCode = parseInt(info.build, 10) || 0;
  if (manifest.versionCode <= localCode) return;

  const msg = manifest.message || '发现新版本安装包，是否下载安装？';
  if (typeof window !== 'undefined' && window.confirm(msg)) {
    window.open(manifest.apkUrl, '_system');
  }
}

/**
 * 启动前检查热更新；若已应用新包会 reload，不再继续
 */
export async function runOtaBootstrap() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const updated = await maybeApplyWebUpdate();
    if (updated) return;
    await maybePromptApkUpdate();
  } catch (err) {
    console.warn('[ota]', err);
  } finally {
    await CapacitorUpdater.notifyAppReady();
  }
}

/** 供界面显示当前网页 bundle 版本（仅原生壳） */
export async function getBundleVersionLabel() {
  if (!Capacitor.isNativePlatform()) return '';
  try {
    const cur = await CapacitorUpdater.current();
    const v = cur?.bundle?.version;
    return v ? `热更 ${v}` : '热更 内置';
  } catch {
    return '';
  }
}
