# 项目状态总览

> 更新：2026-07-29 · **Phase 28 Supabase 已交付**

---

## 一、当前状态（一句话）

世界能力扩展至 **Phase 28（Supabase 田野云同步）**；观察台可上传田野归档与 OBS 笔记至云端；**开放 GAP 2 条**。

---

## 二、观察台与 APK

| 项 | 值 |
|----|-----|
| Web 入口 | `index.html` + `src/main.js` |
| APK 工程 | `android/`（Capacitor 7） |
| 同步命令 | `npm run cap:sync` |
| 构建 debug APK | `npm run apk:debug`（需本机 Android SDK） |

---

## 三、阶段完成度

| 区块 | 阶段 | 状态 |
|------|------|------|
| 田野基线 | 0–10 | ✅ 结案 |
| 世界能力 | 11–20 | ✅ |
| 进化 / 种群 | 21–24 | ✅ |
| L4 筛选 | 26 | ✅ `[SEL]` |
| **APK 壳** | **27** | ✅ Capacitor 工程 |
| **云同步** | **28** | ✅ Supabase 田野归档 + OBS |
| **下一** | **29** | Realtime / 批处理入库（候选） |

---

## 四、技术路线（OUTLINE §八）

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0 | 最小内核 + 观察台 | ✅ |
| Phase 1 PWA | 离线壳 | ⚠️ 已撤销 |
| Phase 2 | APK | ✅ Phase 27 |
| Phase 3 | Supabase | ✅ Phase 28 |

---

*随 main 分支更新*
