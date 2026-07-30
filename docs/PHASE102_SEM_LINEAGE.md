# Phase 102 · WL2 [SEM-LIN] 谱系约定持久

> **一条主因果**：亲代载荷共现摘要 `semTrace` 经谱系/分裂/融合传递为 `[SEM-LIN]`，子代可核对残留；去掉持久机制后约定迹不跨代。  
> **前提**：WL0 support + WL1 weak。

---

## 机制

| 组件 | 说明 |
|------|------|
| `semLineageEnabled` | 开启谱系持久 |
| `semLocalPairs` | 个体级共现计数 |
| `semTrace` | 可继承 top-N 载荷对摘要 |
| `[SEM-LIN]` | 谱系/分裂/融合时的 evolution 日志 |
| `traceActHint` | 子代反馈层可调用亲代残留迹 |

实现：`src/world/sem-lineage.js`；挂钩 `lineage.js` / `fission.js` / `recombination.js`。

---

## 田野

```bash
npm run field:phase102
```

| ID | 说明 |
|----|------|
| `sem_lin_off` | SEM 反馈，无谱系持久 |
| `sem_lin_on` | SEM 反馈 + 谱系持久 |
| `sem_lin_dense` | 宽窗口 + 持久 |
| `sem_lin_sk` | 剧变 + 持久 |

### 结果（2026-07-30）

| 假说 | 结果 |
|------|------|
| H1 `[SEM-LIN]` 可观察 | ⚠️ 1/4 |
| H2 子代 trace 播种 | ⚠️ 1/4 |
| H3 条件概率持久放大 | ⚠️ 0/4 |
| H4 trace 权重更高 | ✅ 4/4 |
| H5 无失控对外率偏差 | ✅ 4/4 |
| **综合** | **weak** |

---

## 出口

| 项 | 状态 |
|----|------|
| WL2 内核 | ✅ |
| 田野 | ✅ weak |
| 下一步 | **WL3** 与 W4 社会知识正交对照 |

---

*谱系残留是统计摘要，不是文化词典。*
