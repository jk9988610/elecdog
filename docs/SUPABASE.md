# Supabase 田野云同步（ElecDog Phase 28）

> 与 [Beat-Battle](https://github.com/jk9988610/Beat-Battle)、[Card-World](https://github.com/jk9988610/Card-World) **共用同一 Supabase 项目**（`yjqkotqmglxjhlrhynsu`）。

## 一、我们能用 Supabase 做什么？

| 能力 | 本项目用途 | 参考仓库 |
|------|-----------|----------|
| **Postgres 表** | 田野归档索引、OBS 笔记 | Beat-Battle `seasons` / `submissions` |
| **Storage 桶** | 全量运行日志 JSON | Beat-Battle `audio` 桶；Card-World `art` 桶 |
| **REST API** | 无打包器、Capacitor 内可用 | Beat-Battle `remote-rest.js` |
| **Realtime** | 多设备同步观察（后续） | Beat-Battle `subscribeSeasonChanges` |
| **多项目共库** | 同一 anon key，不同表/桶 | Card-World `art_shop_works` + HarmonyForge `published_works` |

### ElecDog 当前已接入（Phase 28）

1. **田野归档 `field_runs`** — 上传当前世界的 tick、存活数、仪表盘摘要；完整日志进 Storage。
2. **田野笔记 `field_notes`** — 按 OBS 编号保存 L1 观察笔记，可关联最近一次归档。
3. **观察台 UI** — 工具栏「上传田野归档」「云设置」面板；列表展示最近归档与笔记。

### 后续可扩展（未实现）

| 方向 | 说明 |
|------|------|
| Realtime 订阅 | 多观察者同时看同一世界 tick 流 |
| 世界快照恢复 | 从 Storage 日志回放/续跑（需引擎反序列化） |
| 田野批处理同步 | `scripts/field-batch-*.mjs` 结果自动入库 |
| 认证与 RLS | 替换开放策略，按观察者身份读写 |
| 与 elecat 联动 | 跨仓库共享观察数据 |

**不改变世界规则**：云同步仅为观察层扩展，内核 tick 逻辑不变。

---

## 二、一次性配置

### 1. Storage 桶

Dashboard → **Storage** → **New bucket**

- 名称：`elecdog-logs`
- **Public bucket**：ON

### 2. SQL

在 **SQL Editor** 依次执行：

1. [`supabase/schema.sql`](../supabase/schema.sql) — 表 `field_runs`、`field_notes` 与 RLS
2. [`supabase/schema-storage-policies.sql`](../supabase/schema-storage-policies.sql) — 桶 `elecdog-logs` 策略

### 3. 客户端

观察台已内置与 Beat-Battle / Card-World 相同的 URL 与 anon key。  
打开页面 → **云设置** → 确认连接 → **上传田野归档**。

自定义项目：在「云设置」中覆盖 URL / anon key（仅存本机 localStorage）。

---

## 三、数据模型

### `field_runs`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | uuid | 归档 ID |
| `place` | text | 地点代号 |
| `world_name` | text | 世界名 |
| `tick` | bigint | 归档时 tick |
| `alive_count` / `total_beings` | int | 种群 |
| `observer_label` | text | 观察者昵称 |
| `summary` | jsonb | 仪表盘摘要 |
| `log_path` | text | Storage 路径 `runs/{id}.json` |

### `field_notes`

| 列 | 类型 | 说明 |
|----|------|------|
| `obs_id` | text | 唯一 OBS 编号 |
| `content` | text | 笔记正文 |
| `related_run_id` | uuid | 可选，关联归档 |
| `author_label` | text | 观察者 |

### Storage `elecdog-logs`

```
runs/{uuid}.json   # 世界摘要 + recorder.entries 全量
```

---

## 四、代码结构

```
src/cloud/
  config.js         # URL / anon key / 观察者昵称
  rest.js           # fetch REST + Storage（无 CDN SDK）
  field-sync.js     # 归档与笔记高层 API
  supabase-error.js # 中文错误提示
```

模式对齐 Beat-Battle：`isCloudEnabled()` → REST → Storage；错误经 `formatSupabaseError` 展示。

---

## 五、生产注意

当前 RLS 为 `using (true)` 开放读写，适合个人田野与演示。  
上线多人环境前请改为基于 `auth.uid()` 的策略，并勿将 `service_role` key 写入客户端。
