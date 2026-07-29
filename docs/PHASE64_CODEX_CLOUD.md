# Phase 64 · 辞典云同步

> **平台层**：观察台辞典可从 Supabase 拉取并 Realtime 刷新；  
> **不改变世界规则**：`codex-data.js` 仍为离线兜底。

---

## 一、交付

| 项 | 说明 |
|----|------|
| 表 `codex_entries` | 28 条辞典 JSON 字段 + `updated_at` |
| REST | `listCodexEntries` / `upsertCodexEntries` |
| 观察台 | 辞典面板云合并、刷新按钮、云徽章 |
| Realtime | `codex_entries` INSERT/UPDATE 自动刷新 |
| 维护脚本 | `npm run codex:publish` / `codex:verify` |

---

## 二、一次性配置

SQL Editor 依次执行：

1. [`supabase/schema-codex.sql`](../supabase/schema-codex.sql)
2. [`supabase/schema-realtime-codex.sql`](../supabase/schema-realtime-codex.sql)

发布本地辞典：

```bash
npm run codex:publish
```

验证合并逻辑（可选云拉取）：

```bash
npm run codex:verify
npm run codex:verify -- --cloud
```

---

## 三、合并策略

- **离线**：仅 `codex-data.js`
- **在线**：同 `id` 时**云条目覆盖**本地；云独有 id 追加
- **标记**：云来源条目显示「云」徽章
- **维护**：更新 `codex-data.js` 后运行 `codex:publish` 同步

---

## 四、与意识收敛的关系

辞典云同步属于 [CONSCIOUSNESS.md](CONSCIOUSNESS.md) 中期「平台」方向：  
多设备观察者共享同一套 L2 归纳，不引入分类或新 Being 类型。

---

*Phase 64 · 观察层扩展*
