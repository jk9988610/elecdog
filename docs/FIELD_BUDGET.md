# 田野实验时长预算

> **强制规则（Phase 65 起）**：每次田野实验必须计时；**单次**运行超过 **3 分钟**视为**不通过**。  
> 允许多次实验（多种子、多处理组、分批跑），但禁止某一次实验长时间挂起。

---

## 一、适用范围

凡通过 `scripts/lib/field-run.js` 的 `runFieldScenario()` 执行的统计田野，均强制执行本预算。

典型命令：

```bash
npm run field:phase65
npm run field:phase63
# … 其他 field:phase* 批处理
```

---

## 二、上限

| 项 | 值 |
|----|-----|
| 默认上限 | **180 秒（3 分钟）** |
| 计量单位 | **单次** `runFieldScenario`（一个处理组 × 一个种子） |
| 批处理合计 | 不限（但单次均须过关） |

覆盖环境变量（仅调试用）：

```bash
FIELD_RUN_MAX_MS=240000 npm run field:phase65
```

---

## 三、行为

1. `runFieldScenario` / `runFieldCarryScenario` 创建 **墙钟截止**（`createFieldDeadline`）
2. `runFieldTicks` **每 tick 轮询**截止；超时 → `deadlineHit: true` 并立即退出
3. 单段 tick 请求超过 `FIELD_MAX_TICKS_PER_PASS`（8192）→ 硬顶截断 + `tickCapHit`
4. 超过墙钟上限 → 抛出 `FieldRunBudgetError`，进程 `exit 1`

输出示例：

```
  cn_xv_quad_3840 seed0… ✓ 2.58s
…
时长：单次最慢 2.71s · 批处理合计 21.04s · 上限 180.00s/次
✓ 全部单次实验在预算内
```

---

## 四、设计意图

- 防止全量日志 + 暴力分析导致「假死」（Phase 65 已踩坑）
- 鼓励拆成多次可重复的小实验，而非一次超长运行
- 长时验证靠 tick 数设计 + `StatsRecorder`，不靠无限挂起

---

## 五、实现

- `scripts/lib/field-budget.js` — 墙钟预算、`createFieldDeadline`、`FIELD_MAX_TICKS_PER_PASS`
- `scripts/lib/field-ticks.js` — 带截止的 tick 循环
- `scripts/lib/field-run.js` / `field-carry-run.js` — 计时与强制检查

---

*田野预算 · 观察层工程约束*
