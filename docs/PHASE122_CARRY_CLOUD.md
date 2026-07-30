# Phase 122 · 留置链谱系云归档

> **目标**：将 Phase 110–121 含 `carrySnapshots` 的田野报告批量上传 Supabase，并生成可预览的谱系清单。

---

## 一、范围

| Phase | 内容 | 本地报告 |
|-------|------|----------|
| 110 | GAP-13 COOP/SOC 因果 | `field-phase110-report.json` |
| 112 | 四环境留置链 | `field-phase112-report.json` |
| 113 | 加长混合 tick + 截止守卫 | `field-phase113-report.json` |
| 115 | 五环境链（SEM 精炼） | `field-phase115-report.json` |
| 116 | 加长塑形 tick | `field-phase116-report.json` |
| 117 | 六环境+链（stress-echo+SOC） | `field-phase117-report.json` |
| 118 | GAP-13 多批次因果 | `field-phase118-report.json` |
| 119 | 8192 tick 长时稳健性 | `field-phase119-report.json` |
| 121 | GAP-13 × 8192 复验 | `field-phase121-report.json` |

每份报告中的 `carrySnapshots[].provenance.chain` 构成跨环境谱系；云归档在 `field_runs.summary.carryLineage` 写入链深、快照数、阶段列表等摘要。

---

## 二、命令

```bash
# 本地校验（无需 Supabase）
npm run field:carry:verify

# 批量上传 + 生成 Phase 122 谱系清单
npm run field:carry:cloud

# 指定阶段
node scripts/field-carry-cloud.mjs --cloud --phases 117,119,121
```

---

## 三、观察台预览

云归档列表中：

- 单阶段报告标签 **批处理** / 世界名 `Phase N 留置链田野`
- 清单标签 **留置谱系**
- 预览面板显示 **留置链谱系**（各 Phase 链深 / COOP_adv 及汇总快照数）

---

## 四、验收

- [x] `field:carry:verify` 9/9 通过
- [ ] `field:carry:cloud` 上传清单至 Supabase（需网络）
- [x] 观察台云列表可预览留置谱系摘要

---

*Phase 122 · 留置链谱系云归档*
