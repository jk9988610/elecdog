# Phase 117 · 六环境+留置链

```
harsh × 640（塑形）
    → wisdom × 384（SEM 孵化）
    → fertile × 384（COOP 蓄积）
    → wisdom × 256（SEM 精炼）
    → harsh × 192（stress-echo）  ← 六环境+独有
    → wisdom × 256（SOC 通行）     ← 六环境+独有
    → wisdom × 640（混合）
```

| 处理组 | 中间通行 |
|--------|----------|
| `ev117_hexa_chain` | 孵化 + 蓄积 + 精炼 + stress-echo + SOC |
| `ev117_penta_ctrl` | 孵化 + 蓄积 + 精炼（五环境对照） |

```bash
npm run field:phase117
```

截止守卫：`fieldRunDeadlineMs` + `fieldMaxTicksPerPass`（与 Phase 113 同）。

---

*见 [GOAL_DISTANCE.md](GOAL_DISTANCE.md) 了解与最终目标距离。*
