# Phase 36 田野报告 · 富足分裂场

> **日期**：2026-07-29  
> **问题**：何种环境使 DNA 像地球生物那样有**旺盛分裂倾向**（亲代存活时复制）？  
> **脚本**：`npm run field:phase36`

---

## 1. 设计摘要

| 环境 | 基底 | 剧变 | 分裂门 `[FISS]` |
|------|------|------|-----------------|
| `baseline` | 默认 | 有 | 关 |
| **`fertile_field`** | 富足补给 + 托底 | **无** | **开**（DNA 偏置） |
| `fertile_inert` | 同富足 | 无 | **关**（对照） |
| `harsh_combined` | 耗竭 + 脉冲 | 有 | 关 |

分裂条件（富足场内）：场均值高、场压低、膜完整、无 `[LOW]`、DNA `bias` 调节冷却与概率；亲代寄存器代价 ×0.82/次。

---

## 2. 四种子均值

| 环境 | FISS | LINEAGE | 存活 | 增长 |
|------|------|---------|------|------|
| baseline | 0 | 121 | 4 | 0 |
| **fertile_field** | **32** | **0** | **36** | **+32** |
| fertile_inert | 0 | 0 | 4 | 0 |
| harsh_combined | 0 | 1145.5 | 4 | 0 |

---

## 3. 结论

### 旺盛分裂倾向 — **support**

在 `fertile_field` 下：

- 每个种子均达到分裂上限（`fissionMaxPop=36`），**32 次 `[FISS]`**（4 初体 → 36 存活）
- **零 `[LINEAGE]`** — 亲代不死亡也在复制 DNA 造新个体
- 分裂时基底场均 ≈ 0.54+（富足场托底生效）

### 对照 — 场 alone 不够

`fertile_inert` 与 baseline 同为 4 存活、0 FISS → **仅富足基底不自动分裂**，须 `fissionEnabled` + 门控。

### harsh — 死亡繁殖 ≠ 种群增长

`harsh_combined` LINEAGE 逾千次，但存活仍 4 → 与 Phase 34 一致：**周转高、净增长零**。

### 地球类比（观察用）

| 地球 | 电子狗 Phase 36 |
|------|-----------------|
| 植物分生组织在湿润肥沃土 | `substrateBoost` + `substrateFloor` |
| 动物体细胞在营养充足、低应激时分裂 | 低 `stress` + 无 `[LOW]` + `[FISS]` |
| 分裂程序由基因组调控 | `dnaFissionParams.bias` |
| 干旱/胁迫抑制分裂 | `harsh` 无 FISS；LINEAGE 主导但无效增长 |

---

## 4. GAP-16 状态

**部分结案**：存活分裂路径已建立并可田野复现；减数分裂、配子融合、分裂与多细胞耦合待后续。

---

*原始数据：`field-phase35-report.json` → `field-phase36-report.json` · 规划：[PHASE36_FISSION.md](../PHASE36_FISSION.md)*
