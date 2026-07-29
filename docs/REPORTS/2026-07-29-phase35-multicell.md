# Phase 35 田野报告 · 多细胞 / 延迟独立 / 种群区分

> **日期**：2026-07-29  
> **环境**：`harsh_combined`（组合高压）  
> **设计**：四体 · 3000 tick · 4 种子 · 4 处理组  
> **脚本**：`npm run field:phase35`

---

## 1. 电子狗类比（观察用，非 CODEX）

| 概念 | 在电子狗里的意思 |
|------|------------------|
| **单细胞个体** | 1 个 `being`，1 套 4 通道 `cellBoundary`，独自摄取 `[DRW]` |
| **多细胞个体** | 1 个 `being`，内含 3 个 `subCell`（draw / act / balance），**同一身份证**；任一时刻只有轮值子域对外摄取，子域间有 `[INTRA]` 通量 |
| **种群** | 多个 `being`，各有独立 ID、社会位、可 `contest`、各自 `LINEAGE` |
| **胞内分工** | `[INTRA] sc0→sc1` 等记录；摄取侧记 `draw/act/balance` 角色 |
| **哺乳类比** | 谱系幼体 `nursed`：亲代 END 时寄存器种子 `[NUR] seed` + 依赖期每 tick `[NUR] tick`，满 80 tick 或储备耗尽后 `independent` |

**如何区分三者**：

- 单细胞 vs 多细胞：看 `[ORG] unicell` vs `[ORG] multicell`，以及是否存在 `[INTRA]`  
- 多细胞个体 vs 种群：存活 **4 个 being（种群）** 但多细胞时 **12 个子域单元（4×3）** 仍属 4 个 organism；每个 being 一次 `[END]` 灭整 organism，不会只灭一个 subCell

---

## 2. 处理组与均值（四种子）

| 处理组 | 幼体 END 率 | 净谱系 | 存活谱系 | INTRA | NUR |
|--------|-------------|--------|----------|-------|-----|
| unicell_instant | **1.00** | 4 | 4 | 0 | 0 |
| unicell_nursed | **1.00** | 4 | 4 | 0 | ~83157 |
| multicell_instant | **1.00** | 4 | 4 | ~33204 | 0 |
| multicell_nursed | **1.00** | 4 | 4 | ~33036 | ~80913 |

---

## 3. 结论

### GAP-15（多细胞 vs 单细胞 vs 种群）— **操作性区分成立**

- **单细胞组**：`intraCount = 0`，`orgUnicell` 有记录，`multicellAlive = 0`  
- **多细胞组**：`intraCount ≈ 3.3×10⁴`，`orgMulticell` 有记录；`intraByRole` 三等分（draw / act / balance 各约 1.1×10⁴）→ **胞内分工迹稳定可观察**  
- **种群 vs 多细胞个体**：例 seed0 `multicell_instant` — `populationCount=4`，`subCellUnitCount=12`，`multicellOrganismCount=4` → **4 个独立个体构成种群，每个个体内部 3 子域**

### GAP-14（延迟独立对照）— **本参数下 nursed 未改善存续**

- `unicell_nursed` vs `unicell_instant`：幼体 END 率均为 **100%**，净谱系 / 存活谱系无差异  
- `multicell_nursed` vs `multicell_instant`：同上  
- `[NUR]` 通道大量触发（~8×10⁴ 条），说明机制运行，但 **harsh_combined 下不足以降低幼体早期 END**  
- **解读**：选择压仍在；当前通量种子（35%）+ tick 授予（0.012）可能不足，或需**存活亲代**持续转移（非 END 后单亲种子）

### 假说判定

| 假说 | 结果 |
|------|------|
| H1 nursed 降低幼体 END 率 | **unsupport** |
| H2 nursed 提高净谱系 | **pending**（无差异） |
| H3 multicell 产生 INTRA 分工 | **support** |
| H4 种群 ID 数 vs subCell 单元可区分 | **support** |

---

## 4. 后续方向（不预制）

- 调高 `nurtureSeedFrac` / `nurtureTickGrant` 或延长依赖期再田野  
- 探索**亲代存活期**通量转移（需双亲或延迟 END 机制）  
- 多细胞在非 harsh 环境下是否改变谱系净增益（本批仅 harsh）

---

*原始数据：`field-phase35-report.json` · 规划：[PHASE35_MULTICELL.md](../PHASE35_MULTICELL.md)*
