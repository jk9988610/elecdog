# 田野观察报告 · Phase 31 · 2026-07-29

> **Supabase Realtime 多设备观察同步**

---

## 一、「多设备观察同步」指什么？

| 层级 | Phase 28–30（已有） | Phase 31（本次） | 更远期（未做） |
|------|---------------------|------------------|----------------|
| **归档同步** | 手动/批处理上传 → 存 Supabase | 同上 | — |
| **列表刷新** | 需点「刷新列表」 | **任一设备上传 → 其他设备自动刷新** | — |
| **世界实况** | 各设备本地独立跑世界 | 仍各跑各的 | 共享同一 tick 流（需引擎大改） |

**结论**：Realtime 同步的是**田野归档与 OBS 笔记的到达通知**，不是多台设备看同一个正在运行的世界。

---

## 二、交付

| 组件 | 说明 |
|------|------|
| `src/cloud/realtime.js` | 订阅 `field_runs` / `field_notes` INSERT |
| 观察台 | 状态显示「云 · 实时」；收到推送自动刷新列表 |
| `supabase/schema-realtime.sql` | 开启表 Realtime 发布 |
| `field-batch-phase24` | 支持 `--cloud` |

---

## 三、一次性配置

在 Supabase SQL Editor 执行（在 `schema.sql` 之后）：

```sql
-- 复制 supabase/schema-realtime.sql 内容执行
alter publication supabase_realtime add table field_runs;
alter publication supabase_realtime add table field_notes;
```

---

## 四、验收

1. 设备 A、B 均打开观察台 → 云设置 → 显示 **云 · 实时**
2. 设备 A 上传归档或保存笔记
3. 设备 B 列表自动刷新，底部提示「实时：…」

---

*Phase 31 · 详见 [SUPABASE.md](../SUPABASE.md)*
