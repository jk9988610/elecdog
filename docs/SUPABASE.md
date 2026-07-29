# Supabase 田野云同步（ElecDog Phase 28）

> 与 [Beat-Battle](https://github.com/jk9988610/Beat-Battle)、[Card-World](https://github.com/jk9988610/Card-World) **共用同一 Supabase 项目**（`yjqkotqmglxjhlrhynsu`）。

## 一、我们能用 Supabase 做什么？

| 能力 | 本项目用途 | 参考仓库 |
|------|-----------|----------|
| **Postgres 表** | 田野归档索引、OBS 笔记 | Beat-Battle `seasons` / `submissions` |
| **Storage 桶** | 全量运行日志 JSON | Beat-Battle `audio` 桶；Card-World `art` 桶 |
| **REST API** | 无打包器、Capacitor 内可用 | Beat-Battle `remote-rest.js` |
| **Realtime** | 多设备自动刷新归档/笔记列表 | ✅ Phase 31 |
| **多项目共库** | 同一 anon key，不同表/桶 | Card-World `art_shop_works` + HarmonyForge `published_works` |

### ElecDog 当前已接入（Phase 28–30）

1. **田野归档 `field_runs`** — 观察台手动上传 + 田野批处理自动入库
2. **田野笔记 `field_notes`** — 按 OBS 编号保存 L1 观察笔记
3. **Storage `elecdog-logs`** — `runs/` 观察台日志 · `field-reports/` 批处理报告
4. **观察台 UI** — 上传、云设置、归档列表、**预览**日志片段
5. **辞典 `codex_entries`** — L2 辞典云同步 + Realtime（Phase 64）

### 田野批处理上传（Phase 30）

```bash
# 跑 phase26 并自动上传
npm run field:phase26:cloud

# 或手动上传已有报告
npm run field:cloud-upload -- 26
```

环境变量：`FIELD_CLOUD=1` 或 `--cloud` 标志；可选 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 覆盖内置配置。

### 六层人格栈批量归档（Phase 56）

```bash
# 批量上传 Phase 48–55 + 生成全栈清单
npm run field:stack:full:cloud

# 四层栈归档（48–53 + Phase 54 清单）不变
npm run field:stack:cloud
```

详见 [PHASE56_PERSONA_STACK.md](PHASE56_PERSONA_STACK.md)。

### 四层栈批量归档（Phase 54）

```bash
# 批量上传 Phase 48–53 + 生成栈清单
npm run field:stack:cloud

# 范围补传
node scripts/field-cloud-upload.mjs 48-53
```

Phase 48–53 统计田野的 `aggregate` 格式会在 `field_runs.summary` 中写入处理组均值与头指标；观察台预览可直接阅读。

详见 [PHASE54_CLOUD_ARCHIVE.md](PHASE54_CLOUD_ARCHIVE.md)。

### 辞典云同步（Phase 64）

```bash
# 将 codex-data.js 全量发布到 Supabase
npm run codex:publish

# 验证本地合并逻辑（加 --cloud 可拉取云表）
npm run codex:verify
```

观察台辞典面板：打开时自动云合并；**刷新**按钮手动拉取；云条目显示「云」徽章。  
Realtime 推送 `codex_entries` 变更时自动刷新。

一次性配置：SQL Editor 执行 [`supabase/schema-codex.sql`](../supabase/schema-codex.sql) 与 [`supabase/schema-realtime-codex.sql`](../supabase/schema-realtime-codex.sql)。

详见 [PHASE64_CODEX_CLOUD.md](PHASE64_CODEX_CLOUD.md)。

### 意识线田野云归档（Phase 68）

```bash
# 校验本地报告
npm run field:consciousness:verify

# 批量上传 Phase 61–63、65–66 + 意识线清单
npm run field:consciousness:cloud
```

观察台云列表可预览 **意识线指标**（各 Phase H3% / 可持续等）。

详见 [PHASE68_CONSCIOUSNESS_CLOUD.md](PHASE68_CONSCIOUSNESS_CLOUD.md)。

### 多设备观察同步（Phase 31）

**不是**多台设备看同一个正在运行的世界 tick。  
**是**：任一设备上传归档或保存 OBS 笔记后，其他已打开观察台的设备通过 Supabase Realtime **自动刷新列表**并提示。

观察台显示 **「云 · 实时」** 表示订阅成功。

一次性配置：SQL Editor 执行 [`supabase/schema-realtime.sql`](../supabase/schema-realtime.sql)。

### 后续可扩展（未实现）

| 方向 | 说明 |
|------|------|
| 共享世界 tick 流 | 需引擎反序列化 + 状态广播，远期 |
| 世界快照恢复 | 从 Storage 日志回放/续跑（需引擎反序列化） |
| 田野批处理同步 | `scripts/field-batch-*.mjs` 结果自动入库 | ✅ Phase 30–54 |
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
3. [`supabase/schema-realtime.sql`](../supabase/schema-realtime.sql) — Realtime 发布（Phase 31）
4. [`supabase/schema-codex.sql`](../supabase/schema-codex.sql) — 辞典表（Phase 64）
5. [`supabase/schema-realtime-codex.sql`](../supabase/schema-realtime-codex.sql) — 辞典 Realtime（Phase 64）

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

### `codex_entries`（Phase 64）

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | text | 词条主键（与 codex-data.js 一致） |
| `title` | text | 标题 |
| `definition` | text | 定义 |
| `evidence` | text[] | OBS 依据列表 |
| `falsifiable` | text | 可证伪条件 |
| `established` | date | 立项日期 |
| `tag` | text | 可选标签（如 EHU） |
| `updated_at` | timestamptz | 最近同步时间 |

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
  codex-sync.js     # 辞典合并与拉取（Phase 64）
  field-sync.js     # 归档与笔记高层 API
  realtime.js       # 归档/笔记/辞典 Realtime
  supabase-error.js # 中文错误提示
```

模式对齐 Beat-Battle：`isCloudEnabled()` → REST → Storage；错误经 `formatSupabaseError` 展示。

---

## 五、生产注意

当前 RLS 为 `using (true)` 开放读写，适合个人田野与演示。  
上线多人环境前请改为基于 `auth.uid()` 的策略，并勿将 `service_role` key 写入客户端。
