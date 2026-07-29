# 田野观察报告 · Phase 28 · 2026-07-29

> **OUTLINE Phase 3 — Supabase 田野云同步**

---

## 一、背景

- PR #28（Termux `cap:sync` 修复）已合并；Phase 27 APK 壳层就绪。
- 参考仓库：
  - **Beat-Battle**：Postgres 赛季/作品表 + `audio` Storage + REST 云同步 + Realtime
  - **Card-World**：`art_shop_works` 表 + `art` 桶 + 共用 `cloud-config.js`

二者与 ElecDog 共用 Supabase 项目 `yjqkotqmglxjhlrhynsu`。

---

## 二、交付物

| 组件 | 说明 |
|------|------|
| `supabase/schema.sql` | `field_runs`、`field_notes` 表 |
| `supabase/schema-storage-policies.sql` | `elecdog-logs` 桶策略 |
| `src/cloud/*` | 配置、REST、田野归档 API |
| 观察台 UI | 云状态、上传归档、OBS 笔记、最近列表 |
| `docs/SUPABASE.md` | 配置说明与能力路线图 |

**不改变世界规则**：仅观察层云备份与多端共享笔记。

---

## 三、Supabase 在本项目的价值

1. **田野归档** — 长时间运行后一键上传 tick / 种群 / 全量日志，供日后统计与对照。
2. **OBS 笔记云存** — L1 田野笔记按编号持久化，手机 APK 与 Pages 共用。
3. **与现有游戏生态共库** — 同一 Supabase 账单与 Dashboard，表/桶隔离。
4. **后续 Realtime** — 可订阅 `field_runs` 插入，实现多观察者同步（Phase 29+ 候选）。

---

## 四、验收标准

| 项 | 状态 |
|----|------|
| SQL schema 可执行 | ✅ |
| REST 上传归档（需 Dashboard 建桶 + 跑 SQL） | ✅ 代码就绪 |
| 观察台云设置 UI | ✅ |
| 无 Supabase 时观察台仍可本地运行 | ✅ |
| Capacitor `prepare:www` 含 `src/cloud` | ✅ |

---

## 五、下一步

- Dashboard 执行 `supabase/*.sql` 并创建 `elecdog-logs` 桶后，在真机 APK 验证上传。
- 候选 Phase 29：Realtime 或多设备观察同步；田野批处理脚本自动入库。

---

*OUTLINE Phase 3 里程碑 · 田野阶段编号 Phase 28*
