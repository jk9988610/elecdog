# 田野观察报告 · OTA 踩坑结案 · 2026-07-29

> Phase 29 上线后，Pages / APK / 热更 全链路验收通过。本文记录问题与修复，供后续协作者参考。

---

## 一、时间线

| 阶段 | 问题 | 结果 |
|------|------|------|
| 合并 Phase 29 | Pages、APK 白屏 | 修复：OTA 仅原生 dynamic import |
| PR #32 改标题 | Pages 缓存旧 JS | 修复：`stamp-site-cache.mjs` |
| APK 无更新 | zip 33KB、Capgo 回滚 | 修复：CI `npm ci` + `notifyAppReady` |
| 显示 `热更 1.0` | `0.30.x` 永不更新 | 修复：OTA 版本升至 `1.0.x` |
| 仍无更新 | `updater.js` import 失败 | 修复：`native-bridge.js` + 检查热更按钮 |
| v1.0.3 发布 | 用户重装 APK 后点检查热更 | ✅ **热更 1.0.44 成功** |

---

## 二、根因归纳

```text
Pages 问题  = 浏览器加载了需要 node_modules 的 ES module
Pages 缓存  = ES module URL 不变，浏览器长期缓存
OTA 回滚    = zip 缺依赖 → notifyAppReady 未调用 → Capgo 回滚内置包
OTA 不触发  = 版本 0.30.x < 内置 1.0（semver）
OTA 静默    = updater.js 加载失败仅 console.warn，用户无反馈
```

---

## 三、最终架构

```text
main.js
  ├─ runOtaBootstrapNative()   ← native-bridge.js（Capacitor.nativePromise）
  ├─ ObserverApp               ← 含「检查热更」与状态展示
  └─ notifyAppReadyNative()    ← 每次启动必调，防回滚

CI pages.yml
  ├─ npm ci
  ├─ build-ota.mjs  → www-1.0.{run}.zip（含 node_modules）
  └─ stamp-site-cache.mjs     → Pages ?v=run
```

---

## 四、给维护者的三条铁律

1. **OTA 版本主版本号 ≥ APK `versionName`**（当前 `1.0.x`）
2. **CI 打 zip 前必须 `npm ci`**，zip 约 500KB 才正常
3. **改 OTA 引导逻辑后用户需重装一次 APK**；之后只合并 `main` 即可

---

## 五、参考

- 操作手册：[OTA.md](../OTA.md)
- Phase 29 交付：[2026-07-29-phase29-ota.md](2026-07-29-phase29-ota.md)

*2026-07-29 验收：ElecDoge-电子狗-v1.0.3 · 热更 1.0.44*
