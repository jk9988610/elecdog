# Phase 74 · W3 预测误差校正反馈

> **智慧栈第三层闭环**：`[PRD]` 误差 → `actBoost` / `thresholdDelta` 行为微调；高压期高误差 tick 可对照减少。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | 反馈组后期误差趋势 ≤ 记录组 | 趋势更差 |
| H2 | 反馈组对外率有可观察差异 | \|Δ\| < 0.001 |
| H3 | 反馈组高误差 tick 减少 | highErrorTicks 不降 |
| H4 | `[PRD]` 通道仍完整 | prdCount < 10 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 校正偏置 | `predictionActBias()` in `prediction.js` |
| 引擎合并 | `mergeActBias` + `predictionFeedbackEnabled` |
| 田野 | `npm run field:phase74` |

### 机制（最小）

- 瞬时/累积误差 → `actBoost` / `thresholdDelta`
- 后期分段（960–1440 / 1440–1920）追踪误差趋势
- **不预制**「知道」「学习」等地球语义

---

## 三、田野结果（2026-07-29）

12体 × 1920 tick × 4 种子

| 处理组 | PRD | lateErr | highTk | 对外率 |
|--------|-----|---------|--------|--------|
| w3_prd_record | 205 | 0.021 | 0.258 | 0.472 |
| w3_prd_feedback | 202 | **0.021** | **0.254** | 0.471 |

- H3 高误差减少：**3/4 support**
- H4 PRD 可观察：**4/4 support**
- 批次综合：**support**

报告：`docs/field-phase74-report.json`

---

## 四、与 GAP-W03 关系

- GAP-W03：**结案** — 记录（Phase 73）+ 校正（Phase 74）闭合
- 检查表 L4c 可标记 complete
- Phase 75 启动 W4 社会知识累积

---

*Phase 74 · W3 校正 support · W4 社会层*
