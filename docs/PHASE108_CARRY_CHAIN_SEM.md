# Phase 108 · 多环境留置链 + SEM 跨环境载荷迹

> **一条主因果**：harsh 塑形 →（可选）SEM 孵化 → 与 0 代混编；留置个体携带 **semTrace** 跨环境进入混合田野。

---

## 留置链

```
harsh_combined × 640 tick（塑形，SEM off）
        ↓ top2 快照
wisdom_evolution × 384 tick（仅留置，SEM on）  ← chain_sem 独有
        ↓ 刷新 semTrace
wisdom_evolution × 640 tick（10 naive + 2 carry 混合）
```

---

## 处理组

| ID | 链 |
|----|-----|
| `ev108_chain_off` | 塑形 → 混合（无 SEM） |
| `ev108_chain_sem` | 塑形 → SEM 孵化 → 混合（WL3 SEM 栈） |

```bash
npm run field:phase108
```

---

## 假说

| # | 内容 |
|---|------|
| H1 | 链式导入留置 |
| H2 | REN = 0 |
| H3 | SEM 可观测（chain_sem） |
| H4 | 留置个体 semTrace > 0 |
| H5 | 留置迹权重 > naive |

---

*环境塑形躯体 + 跨环境载荷迹，不靠续行。*
