# Phase 118 · GAP-13 多批次合作因果定律

> 在 Phase 117 六环境+链基底上，混合阶段叠加 COOP+SOC，跨 **4 种子**复验因果度量是否满足「定律」级一致性。

---

## 田野设计

```
六环境+链（同 Phase 117）
    → wisdom × 960（混合 · COOP+SOC 因子对照）
```

| 处理组 | 混合阶段 COOP/SOC |
|--------|-------------------|
| `ev118_coop_hexa` | 开 |
| `ev118_coop_off` | 关 |

```bash
npm run field:phase118
```

---

## 因果度量（继承 Phase 110）

| 指标 | 含义 |
|------|------|
| `carryCoopAdvantage` | 留置 COOP 跃迁 − naive |
| `crossRxCoopCorr` | 跨位 RX ↔ COOP 跃迁 Pearson |

---

## 定律假说（多批次）

| # | 内容 |
|---|------|
| H1 | 两组均 4 种子链式导入 |
| H2 | REN = 0 |
| H3 | COOP on 组每种子 COOP ≥ 10 |
| H4 | **留置优势定律**：≥3/4 种子 carryCoopAdvantage > 0 |
| H5 | **相关符号定律**：≥3/4 种子 crossRxCoopCorr 同号 |
| H6 | on 组均值留置优势 > off 组 |
| H7 | 无 deadlineHit |

---

*机制可观察 ≠ 定律已立；本阶段检验跨种子一致性，非地球式「合作」定义。*
