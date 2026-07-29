# 田野观察报告 · Phase 30 · 2026-07-29

> **Supabase 田野闭环** — 批处理自动入库 + 云归档预览

---

## 一、交付

| 组件 | 说明 |
|------|------|
| `scripts/lib/field-cloud-upload.mjs` | Node 侧上传田野报告到 Supabase |
| `scripts/field-cloud-upload.mjs` | 手动上传已有 `field-phase{N}-report.json` |
| `field-batch-phase26.mjs` | 支持 `--cloud` / `FIELD_CLOUD=1` 跑完自动上传 |
| 观察台 | 云归档列表可「预览」日志片段 / 批处理报告 |
| npm 脚本 | `field:phase26:cloud` · `field:cloud-upload` |

---

## 二、工作流

```text
npm run field:phase26:cloud
  → 本地写 docs/field-phase26-report.json
  → 上传 field-reports/phase26-{uuid}.json
  → 写入 field_runs 索引行

观察台 → 云设置 → 最近归档 → 预览
```

手动补传：

```bash
node scripts/field-cloud-upload.mjs 26
```

---

## 三、与 Phase 28/29 的衔接

| 能力 | Phase |
|------|-------|
| 观察台手动上传归档 | 28 |
| OTA 分发观察台更新 | 29 |
| 田野脚本自动入库 + 预览 | **30** |

---

## 四、验收标准

| 项 | 状态 |
|----|------|
| `--cloud` 跑 phase26 可上传 | ✅ |
| Storage `field-reports/` 有 JSON | ✅ |
| `field_runs` 有批处理行 | ✅ |
| 观察台预览 UI | ✅ |

---

## 五、下一步（Phase 31 候选）

- Supabase Realtime 多观察者同步
- 更多 `field:phase*` 脚本接入 `--cloud`
- OUTLINE Phase 4 电子人 kickoff（需新 OBS）

---

*Phase 30 · 详见 [SUPABASE.md](../SUPABASE.md)*
