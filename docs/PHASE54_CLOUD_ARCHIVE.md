# Phase 54 · 云田野归档（四层栈）

> **批量上传** Phase 48–53 统计田野报告至 Supabase，并生成 **Phase 54 栈清单**。

---

## 一、交付

| 组件 | 说明 |
|------|------|
| `scripts/lib/field-stack-summary.mjs` | 统计田野 `aggregate` 摘要（处理组均值 + 指标头） |
| `scripts/lib/field-cloud-upload.mjs` | 扩展 `summarizeBatchReport` 支持 48–53 格式 |
| `scripts/field-stack-cloud.mjs` | 批量上传 48–53 + 生成 Phase 54 清单 |
| `scripts/field-cloud-upload.mjs` | 支持 `48-53` 范围与多 phase 参数 |
| 观察台 | 云归档预览显示处理组表 / 四层栈指标 |
| npm | `field:stack:cloud` · `field:cloud-upload` |

---

## 二、工作流

```text
npm run field:stack:cloud
  → 读取 docs/field-phase48..53-report.json
  → 各 phase 上传 field-reports/phase{N}-{uuid}.json
  → 写入 field_runs 索引行（含 treatments 摘要）
  → 生成 Phase 54 栈清单并上传

观察台 → 云设置 → 最近归档 → 预览
```

单 phase 或范围补传：

```bash
node scripts/field-cloud-upload.mjs 48-53
node scripts/field-cloud-upload.mjs 52
```

指定子集：

```bash
node scripts/field-stack-cloud.mjs --phases 48,52,53 --cloud
```

---

## 三、摘要格式（Phase 48–53）

`summarizeBatchReport` 从 `aggregate` 提取：

| Phase | 反馈处理组 | 头指标 |
|-------|-----------|--------|
| 48 | `fertile_exp_feedback` | EXP |
| 49 | `fertile_reg_couple` | REG |
| 50 | `fertile_mtb_feedback` | MTB |
| 51 | `fertile_coop_feedback` | COOP |
| 52 | `fertile_stack_feedback` | LAY |
| 53 | `stack_rpr_observe` | RPR |

Phase 54 清单 `headlines` 汇总上述六条指标。

---

## 四、假说

| 假说 | 内容 |
|------|------|
| H1 | 48–53 报告可批量入库且摘要完整 |
| H2 | 观察台预览无需下载完整 JSON 即可读处理组 |
| H3 | 栈清单可跨 phase 检索四层演进 |

---

## 五、验收

| 项 | 状态 |
|----|------|
| `aggregate` 格式 alive/treatments 摘要 | ✅ |
| `field:stack:cloud` 脚本 | ✅ |
| 观察台栈归档预览 | ✅ |
| Phase 54 清单 JSON | ✅ |

---

*Phase 54 · 详见 [SUPABASE.md](SUPABASE.md)*
