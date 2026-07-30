# Phase 106 · GAP-EVO-CARRY 进化留置 + 生态分裂

> **一条主因果**：环境塑形田野选出留置个体 → 与 0 代混编 → 留置者**不走 REN 续行**，环境允许时 **FISS 生态分裂**；0 代与非 0 代均可 **MEI+FUS** 产生后代。

---

## 设计

| 概念 | 操作定义 |
|------|----------|
| 塑形 | `harsh_combined` × 640 tick → 选 top2 留置 |
| 混合队列 | 10 naive（0 代）+ ≤2 carry（非 0 代） |
| ecoRepro | 留置个体：`tryRplRenew` 跳过；`fissionGate` 可无视 RPL |
| MEI/FUS | 0 代与留置均可用（留置导入时 grant 2 RPL） |

**不设**：蚁后、角色名、地球繁殖隐喻 CODEX 条。

---

## 处理组

| ID | 说明 |
|----|------|
| `ev106_naive_only` | 全 0 代对照 |
| `ev106_mixed_eco` | 塑形 + 混合 + 生态分裂 |

```bash
npm run field:phase106
```

---

## 假说

| # | 内容 |
|---|------|
| H1 | 混合组成功导入留置 |
| H2 | 全体 REN = 0（无续行） |
| H3 | FISS / 生态 FISS 可观测 |
| H4 | 生态 FISS 可观测 |
| H5 | 后代数 > 导入留置数（繁殖延续） |

---

## 模块

| 路径 | 作用 |
|------|------|
| `src/carry/being-snapshot.js` | 快照导出 |
| `src/carry/select-carry.js` | 塑形末筛选 |
| `src/birth/spawn.js` | `spawnCarriedBeing` |
| `src/world/fission.js` | ecoFiss 绕过 RPL |
| `src/world/rpl-renew.js` | ecoRepro 跳过 REN |

---

*环境塑形躯体可留置，不靠续行配额复活，靠场允许时分裂。*
