# Phase 35 · 多细胞个体 / 延迟独立 / 种群区分

> **田野目标**：在 `harsh_combined` 下对照四类处理组，验证  
> 1) 延迟独立 + 通量转移（`[NUR]`）是否缓解 GAP-14 幼体独立失败  
> 2) **多细胞个体** vs **单细胞个体** vs **种群** 在电子狗世界的可观察区分  
> 3) 多细胞个体内 **子单元分工**（`[INTRA]`）

---

## 一、电子狗类比（仅 UI / 文档，不进 CODEX）

| 地球概念 | 电子狗操作定义 | 可观察通道 |
|----------|----------------|------------|
| **单细胞个体** | 1 `being` = 1 套 `cellBoundary`（4 通道代谢域） | `[ORG] unicell`、`[DRW]`、`[CEL]` |
| **多细胞个体** | 1 `being` = 多个 `subCell` 子域，**共享同一身份证**；一次 `[END]` 终止整 organism | `[ORG] multicell`、`[INTRA]` |
| **种群** | 多个独立 `being`（独立 ID、社会位 S0–S3、可 contest、各自 LINEAGE） | `[CMP]`、社会迹 `[SOC]` |
| **胞内分工** | `subCell` 轮值摄取；`draw` / `act` / `balance` 角色间通量再分配 | `[INTRA] sc0→sc1 …` |
| **哺乳类比** | 谱系幼体 **依赖期**：亲代 END 时寄存器种子 + 每 tick `[NUR]` 通量，达阈值后 `independent` | `[NUR] seed` / `tick` / `independent` |

**区分要点**：

- **多细胞 ≠ 种群**：多种群成员 = 多个 END 事件、多个 LINEAGE 链；多细胞 = 1 END 灭整 organism。  
- **多细胞 ≠ 单细胞**：单细胞只有 1 套边界；多细胞有 ≥3 `subCell`，摄取按子域轮值并记录胞内转移。

---

## 二、内核扩展

| 模块 | 职责 |
|------|------|
| `src/world/organism.js` | `unicell` / `multicell` 初始化；`runMetabolism`；`[INTRA]` 数据 |
| `src/world/nurture.js` | `instant` / `nursed`；`applyNurtureAtBirth`、`tickNurture` |
| `src/world/env-profile.js` | `PHASE35_TREATMENTS` 四处理组 |
| `src/kernel/engine.js` | 接入 NUR + 多细胞代谢 |
| `src/birth/ritual.js` | 诞生时 `[ORG]` 记录 |

---

## 三、田野设计

- **环境**：`harsh_combined`（Phase 34 已证幼体即时独立失败）  
- **个体**：四体（观察者 + 3）  
- **时长**：3000 tick × 4 种子  
- **处理组**：

| ID | organismMode | reproMode |
|----|--------------|-----------|
| `unicell_instant` | unicell | instant |
| `unicell_nursed` | unicell | nursed |
| `multicell_instant` | multicell | instant |
| `multicell_nursed` | multicell | nursed |

```bash
npm run field:phase35
npm run field:phase35:cloud   # 可选上传 Supabase
```

报告：`docs/field-phase35-report.json`  
叙述：`docs/REPORTS/2026-07-29-phase35-multicell.md`

---

## 四、假说（田野前）

| 编号 | 假说 | 指标 |
|------|------|------|
| H1 | `nursed` 降低幼体 80 tick 内 END 率 | `juvenileEndRate` ↓ |
| H2 | `nursed` 提高净谱系 / 存活谱系 | `netLineage`、`aliveLineage` ↑ |
| H3 | `multicell` 产生稳定 `[INTRA]` 分工迹 | `intraCount` > 0 且按 role 分布 |
| H4 | 种群个体数 > 多细胞 subCell 单元数（概念可区分） | `populationCount` vs `subCellUnitCount` |

---

## 五、与 GAP 关系

- **GAP-14**：Phase 34 证选择压；Phase 35 测 **nursed** 是否为可行替代路径  
- **GAP-15**（新）：多细胞个体 vs 单细胞 vs 种群 — 须有可观察定义与田野区分

---

*类比版 UI 可后续为 `[NUR]`/`[INTRA]`/`[ORG]` 增加映射；本阶段以田野与 JSON 报告为主。*
