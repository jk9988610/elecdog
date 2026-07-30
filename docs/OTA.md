# OTA 自动更新（Phase 29）

观察台是网页，APK 只是壳。**日常小改动走网页热更新**；只有改原生壳或 OTA 引导逻辑时才需要新 APK。

---

## 一、工作流（已验收 ✅）

```text
合并 main
  → CI：npm ci → build-ota.mjs → Pages 发布 updates/www.json + zip
  → 用户打开 APK（联网）
  → 拉清单 → 下载 zip（约 500KB）→ 切换 bundle → 刷新
  → 工具栏显示「热更 x.x.xx」
```

| 角色 | 操作 |
|------|------|
| 开发者 | 改 `src/` / `index.html` → 合并 `main`，等 Pages 部署（约 1 分钟） |
| 用户（已装 APK） | 打开 App 或点 **检查热更**，**无需 Termux、无需重装** |
| 壳层变更 | 提高 `versionCode`、更新 `apk.json`、重打 APK |

---

## 二、用户侧

### 自动更新

1. 打开 App（需联网）
2. 启动时自动拉取 `https://jk9988610.github.io/elecdog/updates/www.json`
3. 若线上版本 **大于** 本机 bundle 版本：下载 zip → 校验 → 切换 → 刷新
4. 每次成功启动后调用 `notifyAppReady()`（见下文「经验」）

### 手动检查

工具栏 **检查热更** 按钮会显示状态，例如：

- `本机 1.0 → 线上 1.0.44 · 已最新`
- `本机 1.0 → 线上 1.0.44 · 下载中…`
- `失败: …`（便于排查）

版本徽章：**热更 内置**（APK 自带网页）或 **热更 1.0.xx**（已应用热更包）。

### APK 整包（少见）

若 `apk.json` 里 `versionCode` 大于本机且 `apkUrl` 非空：弹窗提示下载新 APK。

---

## 三、发布侧

### CI（每次 push `main`）

`.github/workflows/pages.yml`：

1. `npm ci`（**必须**，否则 OTA zip 缺 Capacitor 依赖）
2. `node scripts/build-ota.mjs`
3. 复制 `_site` 并 `stamp-site-cache.mjs`（Pages 防缓存）

产出：

- `updates/www.json` — 版本号、zip URL、sha256 checksum
- `updates/www-<版本>.zip` — 完整 `www/`（含 `node_modules` + import map）

### 版本号规则

```text
OTA 版本 = 1.0.${GITHUB_RUN_NUMBER}   # 见 scripts/build-ota.mjs
```

**必须与 APK 壳版本同主版本**：内置 bundle 显示 `热更 1.0`（对应 `versionName 1.0`）时，OTA 须为 `1.0.x`。  
若使用 `0.30.x`，semver 会认为 `0.30 < 1.0`，**永远不会更新**。

本地手动：

```bash
npm install
npm run ota:build
# 或指定版本
OTA_VERSION=1.0.99 node scripts/build-ota.mjs
```

### 何时 bump APK（`updates/apk.json`）

编辑 `updates/apk.json`：

```json
{
  "versionCode": 2,
  "apkUrl": "https://github.com/jk9988610/elecdog/releases/download/.../app-debug.apk",
  "message": "壳层更新，请安装新 APK"
}
```

同时把 `android/app/build.gradle` 的 `versionCode` 改为 `2`，重新 `npm run apk:debug`。

**还需重装 APK 的情况：**

- 修改 `android/`、Capacitor 插件、`src/ota/native-bridge.js` 或 `src/main.js` 的 OTA 引导逻辑
- 首次安装含 OTA 的壳

---

## 四、技术实现要点

| 文件 | 作用 |
|------|------|
| `src/ota/native-bridge.js` | **主路径**：`Capacitor.nativePromise` 调 Capgo，不依赖 npm import |
| `src/ota/updater.js` | 备用（含 `@capgo/*` import，仅内置 www 有 node_modules 时可用） |
| `src/main.js` | 启动 → `runOtaBootstrapNative()` → `ObserverApp` → `notifyAppReadyNative()` |
| `scripts/prepare-www.mjs` | 复制 www + Capacitor 依赖 + import map（打 APK 用） |
| `scripts/build-ota.mjs` | Capgo CLI 打 zip + 写 `www.json` |
| `scripts/stamp-site-cache.mjs` | Pages 部署给 JS/CSS 加 `?v=run` 防浏览器缓存 |

`capacitor.config.json`：`CapacitorUpdater.autoUpdate: false`（手动模式，由 `main.js` 控制）。

---

## 五、踩坑与经验（2026-07-29 实测）

### 1. Pages 白屏

**现象**：GitHub Pages 与旧 APK 均空白。  
**原因**：`main.js` 顶层 `import './ota/updater.js'`，浏览器无法解析 `@capacitor/*`。  
**修复**：仅原生壳 `dynamic import` OTA；Pages 直接启动 `ObserverApp`。

### 2. Pages 合并后标题不变

**现象**：服务端已更新，浏览器仍显示旧标题。  
**原因**：ES module 被浏览器长期缓存（只改 `observer.js` 时 URL 未变）。  
**修复**：CI 部署时 `stamp-site-cache.mjs` 给资源加 `?v=$GITHUB_RUN_NUMBER`；用户无痕或强制刷新。

### 3. OTA zip 过小（~33KB）导致回滚

**现象**：APK 无任何更新迹象。  
**原因**：CI 未 `npm ci`，zip 无 `node_modules`；热更后 `updater.js` 加载失败 → 未 `notifyAppReady` → Capgo **回滚**到内置包。  
**修复**：`pages.yml` 在 `build-ota` 前 `npm ci`；zip 约 **500KB** 为正常。

### 4. 版本号 `0.30.x` 无法覆盖 `1.0`

**现象**：显示 `热更 1.0`，合并 main 后仍不更新。  
**原因**：内置 bundle 版本为 `1.0`（APK `versionName`），`0.30.42 < 1.0`。  
**修复**：OTA 版本改为 `1.0.${run}`。

### 5. `updater.js` 静默失败

**现象**：已装新 APK，仍不更新。  
**原因**：内置 www 中 `import '@capgo/*'` 失败时，`main.js` 仅 `console.warn`，用户无感知。  
**修复**：OTA 逻辑迁至 `native-bridge.js`；工具栏 **检查热更** + 状态文案。

### 6. `notifyAppReady` 必须每次启动调用

Capgo 规定：当前 bundle 加载成功后必须 `notifyAppReady()`，否则下次启动**回滚**到上一成功版本。  
现在在 `main.js` 末尾通过 `native-bridge` 调用，热更包内无 npm 也能执行。

### 7. 清单 CDN 缓存（2026-07-30）

**现象**：合并 main 后 10 分钟内 App 仍显示「已最新」。  
**原因**：`updates/www.json` 在 GitHub Pages CDN 上 `cache-control: max-age=600`。  
**修复**：`native-bridge.js` 拉清单时加 `?nocache=` 时间戳；切换 bundle 后 `location.reload()`。

网页版（非 APK）用工具栏 **检查线上版本** 对比 `site-build.js` 与线上清单；有新版时 **Ctrl+Shift+R** 强制刷新。

---

## 六、验收清单

### 服务端

```bash
curl -s https://jk9988610.github.io/elecdog/updates/www.json
# 应有 version、url、checksum

curl -sI https://jk9988610.github.io/elecdog/updates/www-1.0.44.zip | head -3
# HTTP 200，content-length 约 5e5（500KB 量级）
```

### APK

| 检查项 | 通过标准 |
|--------|----------|
| 启动 | 不白屏，有 ElecDog 界面 |
| 检查热更 | 显示 `本机 x → 线上 y` |
| 有新版时 | 标题/内容变化，徽章为 `热更 y` |
| Pages 对照 | 无痕打开 Pages，内容与 App 一致 |

### 发布一次可见改动（推荐流程）

1. 改 `src/ui/observer.js` 标题等可见文案
2. 合并 `main`，等 CI 完成
3. App 联网 → **检查热更** 或重启
4. 确认标题与 `热更 版本号` 更新

---

## 七、调试

- **Chrome 远程调试**：`chrome://inspect` → 查看 Network（`www.json`、zip）与 Console（`[ota]`）
- **工具栏状态**：点 **检查热更** 看失败原因（网络、校验、版本等）
- **zip 体积**：若只有几十 KB，说明 CI 未装依赖，需检查 `pages.yml`

---

## 八、相关链接

- [Capgo capacitor-updater](https://github.com/Cap-go/capacitor-updater) · [无云模式文档](https://capgo.app/docs/plugin/cloud-mode/getting-started/)
- 田野报告：[2026-07-29-phase29-ota.md](REPORTS/2026-07-29-phase29-ota.md) · [OTA 踩坑结案](REPORTS/2026-07-29-ota-lessons.md)
