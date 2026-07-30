# Phase 109 · 三环境留置链

> **一条主因果**：harsh 塑形 → SEM 孵化 → **第三环境**混合；与 Phase 108 二环境链对照。

---

## 留置链

```
harsh_combined × 640 tick（塑形，SEM off）
        ↓ top2 快照
wisdom_evolution × 384 tick（仅留置，SEM on）
        ↓ 刷新 semTrace + provenance 链
第三环境 × 640 tick（10 naive + 2 carry 混合）
```

---

## 处理组

| ID | 混合环境 |
|----|----------|
| `ev109_triple_ctrl` | `wisdom_evolution`（与 Phase 108 混合阶段同环境） |
| `ev109_triple_fertile` | `fertile_field`（富足分裂场） |

```bash
npm run field:phase109
npm run observer:carry
```

---

## 假说

| # | 内容 |
|---|------|
| H1 | 两处理组均链式导入留置 |
| H2 | REN = 0 |
| H3 | SEM 可观测 |
| H4 | 留置个体 semTrace > 0 |
| H5 | provenance 链深 ≥ 1 |
| H6 | 富足混合 vs wisdom 对照在 FISS 上可区分 |

---

## 观察台

- `carry-panel.js`：留置个体 provenance 链 + trace 权重
- 挂载于观察台 SEM 栈面板下方

---

*环境塑形躯体 + 跨环境载荷迹 + 第三环境生态对照。*
