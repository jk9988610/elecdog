# Phase 73 · W3 预测误差记录 [PRD]

> **智慧栈第三层记录**：场态–寄存器 EMA 预测 vs 实际 → `[PRD]` 误差可观察；不预制「知道」。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | 启用 `predictionEnabled` 后 `[PRD]` 可观察 | on 组 prdCount = 0 |
| H2 | 累积预测误差非平凡（mean ≥ 0.02） | 误差 ≈ 0 |
| H3 | 仅记录、不反馈行为（对外率无系统偏差） | \|Δ对外率\| > 0.06 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 预测 EMA + 误差 | `src/world/prediction.js` |
| 引擎接入 | `src/kernel/engine.js`（register 之后） |
| 田野 | `npm run field:phase73` |
| 短跑 | `npm run wisdom:prd:verify` |

### 机制（最小）

- 场态通道 + 寄存器 EMA 预测（α=0.35）
- 每 tick 计算 mean abs error；超阈值记录 `[PRD]`
- **Phase 73 不反馈行为**（校正留给 Phase 74）

---

## 三、田野结果（2026-07-29）

12体 × 1920 tick × 4 种子

| 处理组 | PRD 均值 | meanError | 对外率 |
|--------|----------|-----------|--------|
| w3_prd_off | 0 | 0 | 0.472 |
| w3_prd_on | **189** | **0.021** | 0.471 |

- H1/H2/H3：**4/4 种子 support**
- 批次综合：**support**
- 对外率差 < 0.001（记录层不扰动行为）

报告：`docs/field-phase73-report.json`

---

## 四、与 Phase 74 关系

- Phase 73：**记录层** `[PRD]` 闭合
- Phase 74：预测误差 → `actBoost` / `thresholdDelta` 校正反馈
- GAP-W03：**部分结案**（记录 ✅；校正待 Phase 74）

---

*Phase 73 · W3 记录层 support · Phase 74 校正反馈*
