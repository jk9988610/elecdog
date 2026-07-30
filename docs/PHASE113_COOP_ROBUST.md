# Phase 113 · GAP-13 加长 tick + 截止守卫

> 加长混合阶段 tick，同时强制 **墙钟截止** 与 **单段 tick 硬顶**，防止无限循环。

---

## 截止规则

| 守卫 | 默认 | 行为 |
|------|------|------|
| `fieldRunDeadlineMs` | 180000（3 分钟） | tick 循环内轮询，超时立即终止 |
| `fieldMaxTicksPerPass` | 8192 | 单段请求 tick 硬顶 |
| `FIELD_RUN_MAX_MS` | 环境变量可覆盖 | 单次实验墙钟预算 |

实现：`scripts/lib/field-ticks.js` + `scripts/lib/field-budget.js`

---

## 田野对照

基于 Phase 110 留置链 × COOP+SOC，仅改变混合阶段 tick：

| 处理组 | mixedTicks |
|--------|------------|
| `ev113_coop_std` | 640 |
| `ev113_coop_long` | 1920 |

```bash
npm run field:phase113
npm run field:deadline
```

---

## 假说

| # | 内容 |
|---|------|
| H1 | 标准组无 deadlineHit |
| H2 | 加长组无 deadlineHit |
| H3 | 加长组 tick 完成率 ≥ 95% |
| H4 | 两组 crossRx↔COOP 相关可测 |
| H5 | 加长 vs 标准相关差 ≤ 0.25（稳健） |
| H6 | REN = 0 |
| H7 | 加长组 COOP ≥ 20 |

---

*加长 tick 必须有截止，否则不立项。*
