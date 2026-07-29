# 项目状态总览

> 更新：2026-07-29 · **Phase 29 OTA 已验收（热更 1.0.44 ✅）**

---

## 一、当前状态（一句话）

**Phase 29**：APK 网页热更新已在真机验收；合并 `main` 后用户打开 App 即可拉 zip。**Phase 28** Supabase 云同步；开放 GAP 2 条。

---

## 二、观察台、APK 与更新

| 项 | 值 |
|----|-----|
| Web 入口 | `index.html` + `src/main.js` |
| **网页热更新** | [OTA.md](OTA.md)（含踩坑经验）· Pages `/updates/www.json` |
| 热更验收 | 工具栏 **检查热更** · 徽章 `热更 1.0.xx` |
| APK 整包 | 仅壳层变更时；见 `updates/apk.json` |
| 打 APK | `npm run apk:debug` |

---

## 三、阶段完成度

| 区块 | 阶段 | 状态 |
|------|------|------|
| APK 壳 | 27 | ✅ |
| 云同步 | 28 | ✅ Supabase |
| **OTA 热更新** | **29** | ✅ 真机验收 |
| **下一** | 30+ | Realtime / 田野批处理（候选） |

---

## 四、用户操作（APK）

1. **首次**：安装含 OTA 的 APK（`npm run apk:debug`）
2. **之后**：打开 App + 联网 → 自动热更，或点 **检查热更**；**无需 Termux**
3. **仅当**：改 `android/` 或 OTA 引导逻辑时需重装 APK

---

*随 main 分支更新*
