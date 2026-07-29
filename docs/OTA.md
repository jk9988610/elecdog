# OTA 自动更新（Phase 29）

观察台是网页，APK 只是壳。**日常小改动走网页热更新**；只有改原生壳时才需要新 APK。

## 用户侧（已安装 APK）

1. 打开 App（需联网）
2. 自动拉取 `https://jk9988610.github.io/elecdog/updates/www.json`
3. 若有新版本：下载 zip → 校验 → 切换 → 自动刷新
4. 若 `apk.json` 里 `versionCode` 大于本机：弹窗提示下载整包（少见）

**无需 Termux、无需重装 APK**（除非壳层升级）。

## 发布侧（你 / CI）

每次合并 `main`：

1. GitHub Actions `pages.yml` 自动执行 `node scripts/build-ota.mjs`
2. 产出 `updates/www.json` + `updates/www-<版本>.zip` 部署到 Pages

本地手动：

```bash
npm run ota:build
# 或指定版本
OTA_VERSION=0.29.5 node scripts/build-ota.mjs
```

## 何时 bump APK（`updates/apk.json`）

编辑 `updates/apk.json`：

```json
{
  "versionCode": 2,
  "apkUrl": "https://github.com/jk9988610/elecdog/releases/download/.../app-debug.apk",
  "message": "壳层更新，请安装新 APK"
}
```

同时把 `android/app/build.gradle` 的 `versionCode` 改为 `2`，重新打 APK 并上传。

## 首次安装

仍需在 Termux/电脑打一次 APK 并安装；之后网页更新自动完成。

## 技术栈

- [@capgo/capacitor-updater](https://github.com/Cap-go/capacitor-updater) 手动热更新
- 清单托管：GitHub Pages `/updates/`
