# Phase 49 · 寄存器语义层 [REG]

> **统计田野**：12 体 × **960 tick** × 4 种子；  
> r0–r7 数值模式可运行时追踪，场耦合可反馈（非感受映射）。

---

## 一、内核扩展

| 机制 | 作用 |
|------|------|
| `computeRegisterMetrics` | gapMean、driftVel、variance、domReg/domSub |
| `resolveRegisterMode` | SYNC / LAG / SCATTER / LOCK |
| `registerCouplingAdjust` | 模式微调基底耦合系数（默认 0.02） |
| `processRegisterTick` | 模式跃迁时记录 `[REG]` |

**模式判定**（纯数值）：

| 模式 | 条件 |
|------|------|
| SCATTER | 寄存器方差 > 0.042 |
| LOCK | 漂移低 + gap 小 |
| LAG | gapMean > 0.22 |
| SYNC | 主导寄存器索引 = 主导基底索引 |

**耦合反馈**（`registerFeedback: true`）：

| 模式 | 耦合调整 |
|------|----------|
| SYNC | +0.006 |
| LAG | +0.010 |
| SCATTER | −0.005 |
| LOCK | −0.004 |

---

## 二、田野（960 tick × 4 种子 × 12 体）

| 处理组 | 说明 |
|--------|------|
| `fertile_no_reg` | 对照 |
| `fertile_reg_observe` | 仅观测模式，不反馈 |
| `fertile_reg_couple` | 观测 + 耦合反馈 |
| `harsh_reg_couple` | 组合高压 + 耦合反馈 |

运行：`npm run field:phase49`

---

## 三、假说

| 假说 | 内容 |
|------|------|
| H1 | 观测组产生 `[REG]` 跃迁 |
| H2 | LAG/SCATTER 等模式可观察 |
| H3 | 耦合反馈降低 mean gap |
| H4 | 耦合组模式跃迁更多 |
| H5 | 不立项感受映射 |
| H6–H7 | 高压环境下 REG 仍可观 |

---

## 四、观察台

环境：**富足场+寄存器耦合反馈** — `fertile_reg_couple`

---

## 五、GAP-02

Phase 24 已证 |r−e|↔stress 数值共现；Phase 49 将**运行时模式**与**可调制耦合**带入内核，仍禁止 r→感受映射表。

---

*数据：`field-phase49-report.json`*
