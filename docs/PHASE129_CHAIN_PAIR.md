# Phase 129 — 六环境链 × PAIR-0

> **GAP-CHAIN-PAIR**：塑形留置个体经六环境链后，与 0 代 PAIR 队列混编，在富足场进行体内合胞繁殖。

---

## 链路与混合

```
harsh × 640（塑形，选 top-2 留置）
  → wisdom(SEM) × 384
  → fertile(COOP) × 384
  → wisdom(refine) × 256
  → harsh(stress-echo) × 192
  → wisdom(SOC) × 256
  → fertile_field × 640（混合：4 PAIR naive + ≤2 留置）
```

留置在混合阶段指派 `pairMorph: A|B`，与 `buildPairCohort` 的 2A+2B 共存。

---

## 处理组

| ID | 链 | 混合繁殖 |
|----|-----|----------|
| `ev129_chain_pair` | 六环境链 | PAIR-0（关 FISS） |
| `ev129_chain_eco` | 六环境链 | 生态 FISS 对照 |
| `ev129_pair_only` | 无链 | PAIR-0 基线 |

```bash
npm run field:phase129
npm run field:phase129:verify
```

---

## Phase 130 — 链末 PAIR-2/3/4 全栈

在 Phase 129 六环境链基底上，混合阶段启用完整 PAIR 路径：

`[PRQ]`/`[PGR]` + `[FLD-CH]`/`[FLD-CH-IN]` + `[HRM]`

| 处理组 | 说明 |
|--------|------|
| `ev130_chain_pair_full` | 链 + PAIR 全栈 |
| `ev130_chain_pair0` | 链 + PAIR-0 对照 |
| `ev130_pair_full_only` | 无链 + PAIR 全栈基线 |

```bash
npm run field:phase130
npm run field:phase130:verify
```

---
