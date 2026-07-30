# Phase 110 · GAP-13 留置链 × COOP/SOC 合作因果

> **一条主因果**：Phase 109 三环境留置链之上，在富足混合阶段叠加 `[COOP]` / `[SOC-ENC]`，度量留置 vs naive 的合作迹差异与相关结构。

---

## 留置链（混合阶段 = fertile_field）

```
harsh_combined × 640（塑形）
    → wisdom_evolution × 384（SEM 孵化）
    → fertile_field × 640（10 naive + 2 carry + COOP/SOC）
```

---

## 处理组

| ID | COOP | SOC |
|----|------|-----|
| `ev110_coop_off` | 关 | 关 |
| `ev110_coop_on` | 反馈开 | 关 |
| `ev110_coop_soc` | 反馈开 | 开 |

```bash
npm run field:phase110
```

---

## 因果度量

| 指标 | 含义 |
|------|------|
| `carryCoopAdvantage` | 留置组 COOP 跃迁 − naive 组 |
| `carryCrossRxAdvantage` | 留置组跨位 RX − naive 组 |
| `crossRxCoopCorr` | 存活个体跨位 RX ↔ COOP 跃迁 Pearson |
| `crossRxFissCorr` | 跨位 RX ↔ 分裂次数 Pearson |

---

## 假说

| # | 内容 |
|---|------|
| H1 | 链式导入留置（三处理组） |
| H2 | REN = 0 |
| H3 | COOP on 产生 `[COOP]` 跃迁 |
| H4 | SOC on 产生 `[SOC-ENC]` |
| H5 | 留置组合作迹 ≥ naive（因果方向信号） |
| H6 | MESH/RIVAL 模式可观测 |
| H7 | 跨位 RX 与 COOP 跃迁相关 |

---

## 观察台

- `carry-panel` 扩展：显示留置个体 `coopMode` 与链环境

---

*GAP-13 从「社会迹可记录」推进为「留置链田野上的合作因果可度量」。*
