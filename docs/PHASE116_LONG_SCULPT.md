# Phase 116 · 加长塑形 tick + 截止守卫

> 在 Phase 115 五环境链基底上，加长 harsh 塑形阶段 tick，同时强制 **墙钟截止** 与 **单段 tick 硬顶**。

---

## 截止规则

与 Phase 113 相同：

| 守卫 | 默认 | 行为 |
|------|------|------|
| `fieldRunDeadlineMs` | 180000（3 分钟） | tick 循环内轮询，超时立即终止 |
| `fieldMaxTicksPerPass` | 8192 | 单段请求 tick 硬顶 |

---

## 田野对照

基于 Phase 115 五环境链，仅改变塑形阶段 tick：

| 处理组 | sculptTicks |
|--------|-------------|
| `ev116_sculpt_std` | 640 |
| `ev116_sculpt_long` | 1920 |

```bash
npm run field:phase116
```

---

## 假说

| # | 内容 |
|---|------|
| H1 | 标准组无 deadlineHit |
| H2 | 加长组无 deadlineHit |
| H3 | 加长组塑形 tick 完成率 ≥ 95% |
| H4 | 两组均成功导入留置 |
| H5 | 加长组 meanGenCarry > 标准组 |
| H6 | REN = 0 |
| H7 | 加长组五环境链深度 ≥ 3 |

---

*加长塑形 tick 必须有截止，否则不立项。*
