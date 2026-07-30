# Phase 119 · 8192 tick 长时稳健性（turbo 加速）

> 六环境+链混合阶段 8192 vs 960 tick；**fieldTurboMode** 空间换时间，截止守卫不变。

---

## 加速措施（不改变仿真逻辑）

| 措施 | 作用 |
|------|------|
| `fieldTurboMode` | 记录器仅聚合计数，不保留 entries |
| `tickChunk=16` | 8192 tick 每 16 步轮询一次截止（减少开销） |
| `fieldLiteLog` + `fieldStatMode` | 田野轻量日志（已有） |

---

## 田野对照

| 处理组 | mixedTicks | turbo |
|--------|------------|-------|
| `ev119_long_8192` | 8192 | ✅ |
| `ev119_std_960` | 960 | — |

```bash
npm run field:phase119
```

截止：`fieldRunDeadlineMs` 180s + `fieldMaxTicksPerPass` 8192

---

## 假说

| # | 内容 |
|---|------|
| H1 | 两组 4 种子链式导入 |
| H2 | 无 deadlineHit |
| H3 | 8192 组 tick 完成率 ≥ 95% |
| H4 | 链深度 ≥ 5 |
| H5 | 存活 ≥ 8 |
| H6 | 8192 组 maxGen > 960 组 |
| H7 | REN = 0 |

---

*加长 tick 必须有截止；turbo 仅减记录开销，不跳过 stepWorld。*
