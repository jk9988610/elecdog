# 项目状态总览

> 更新：2026-07-29 · **Phase 29 OTA 已交付**

---

## 一、当前状态（一句话）

**Phase 29**：APK 内网页热更新（合并 main 后自动拉 zip）；**Phase 28** Supabase 云同步；开放 GAP 2 条。

---

## 二、观察台、APK 与更新

| 项 | 值 |
|----|-----|
| Web 入口 | `index.html` + `src/main.js` |
| **网页热更新** | [OTA.md](OTA.md) · Pages `/updates/www.json` |
| APK 整包 | 仅壳层变更时；见 `updates/apk.json` |
| 打 APK | `npm run apk:debug` |

---

## 三、阶段完成度

| 区块 | 阶段 | 状态 |
|------|------|------|
| APK 壳 | 27 | ✅ |
| 云同步 | 28 | ✅ Supabase |
| **OTA 热更新** | **29** | ✅ Capgo zip |
| **下一** | 30+ | Realtime / 田野批处理（候选） |

---

## 四、用户操作（APK）

1. **首次**：安装含 OTA 的 APK（需重打一次并入 Phase 29）
2. **之后**：打开 App + 联网 → 自动更新观察台，**无需 Termux**

---

*随 main 分支更新*
