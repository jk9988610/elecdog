# Phase 132 — WL-R2 链×PAIR 混编跨代繁殖载荷迹

> 在 WL-R1 域标记基座上，使 `[SEM-LIN]` 在 PAIR-EXP 外排时优先继承 CORE-R 繁殖域载荷对。

## 处理组

| ID | 说明 |
|----|------|
| `ev132_wlr_lin_full` | 链+PAIR全栈+繁殖域跨代迹 |
| `ev132_wlr_lin_off` | 链+PAIR全栈+谱系无繁殖域过滤 |
| `ev132_wlr_no_lin` | 链+PAIR全栈+无谱系对照 |

## 机制

- `semReproLineage` — 与 `semDomainTag` + `semLineageEnabled` 联动
- `semPairDomains` — 配对级域戳（`sem.js`）
- `applySemLineageEcho` — PAIR-EXP 时 CORE-R 优先合并；`[SEM-LIN] repro coreR…`
- `selectCarrySnapshots` — 链末刷新 `semTrace` 再快照

## 田野假说（7/7）

1. 链留置 ≥3 种子
2. 链深度 ≥5
3. full 组 PAIR-EXP 繁殖域 SEM-LIN ≥1（≥3 种子）
4. full 繁殖域迹 > lin_off
5. full 子代 repro 权重 > 0
6. full 组 ≥3 种子有 repro 迹子代
7. no_lin 组无 SEM-LIN

## 验证

```bash
npm run field:phase132
npm run field:phase132:verify
```

报告：`docs/field-phase132-report.json`
