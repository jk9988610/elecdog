# Phase 115 · 五环境留置链

```
harsh × 640（塑形）
    → wisdom × 384（SEM 孵化）
    → fertile × 384（COOP 蓄积）
    → wisdom × 256（SEM 精炼 + 反馈）  ← 五环境链独有
    → wisdom × 640（混合）
```

| 处理组 | 中间通行 |
|--------|----------|
| `ev115_penta_chain` | 孵化 + 蓄积 + 精炼 |
| `ev115_quad_ctrl` | 孵化 + 蓄积（四环境对照） |

```bash
npm run field:phase115
```

截止守卫：`fieldRunDeadlineMs` + `fieldMaxTicksPerPass`（与 Phase 113 同）。

---

*见 [GOAL_DISTANCE.md](GOAL_DISTANCE.md) 了解与最终目标距离。*
