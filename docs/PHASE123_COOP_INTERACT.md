# Phase 123 · GAP-13 留置繁殖×SOC 继承交互假说

> Phase 118/121 以 `carryCoopAdvantage`（留置 COOP 跃迁 − naive）为定律核心，**960/8192 tick 均未立**（H4/H6 0/4 种子为正）。本阶段**换假说**：留置繁殖在 COOP+SOC 开启时触发可观测的 **SOC-LIN 继承**，以 `carryReproSocYield = socLinCount / carriedFiss` 度量。

---

## 假说切换

| | 旧假说（118/121） | 新假说（123） |
|---|------------------|---------------|
| 核心指标 | `carryCoopAdvantage` | `carryReproSocYield` |
| 比较对象 | carry vs naive 个体 COOP 跃迁 | 留置繁殖事件 × SOC 继承产量 |
| 机制叙事 | 留置个体更合作 | 留置繁殖触发社会知识继承链 |

---

## 田野对照

| 处理组 | mixedTicks | COOP/SOC | turbo |
|--------|------------|----------|-------|
| `ev123_coop_interact` | 8192 | 开 | ✅ |
| `ev123_coop_off_interact` | 8192 | 关 | ✅ |

```bash
npm run field:phase123
```

---

## 定律假说（9 项）

| # | 内容 |
|---|------|
| H1 | 两组均 ≥3 种子链式导入 |
| H2 | REN = 0 |
| H3 | COOP on 组每种子 socEncCount ≥ 1000 |
| H4 | **留置繁殖 SOC 产量定律**：≥3/4 种子 carryReproSocYield ≥ 8 |
| H5 | **SOC 负载定律**：≥3/4 种子 meanSocLoad ≥ 0.5 |
| H6 | on 组 mean carryReproSocYield > off 组且 ≥ 8 |
| H7 | 无 deadlineHit |
| H8 | 8192 tick 完成率 ≥ 95% |
| H9 | 链深度 ≥ 5 |

---

*换假说不改世界规则；仅更换可证伪的统计定律表述。*

---

## 田野结论

| 指标 | COOP on | COOP off |
|------|---------|----------|
| mean carryReproSocYield | **11.27** | 0 |
| mean socLoad | 0.96 | 0 |
| 批次结论 | **support 9/9** | — |

```bash
npm run field:phase123:verify
```
