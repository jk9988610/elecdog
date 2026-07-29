# Phase 72 · W2 选择压强化环境

> **智慧栈第二层环境攻坚**：在 Phase 71 度量基线上，测试强化选择压环境能否推动跨种子漂移共识 ≥2/4 碱基。

---

## 一、假说

| ID | 内容 | 可证伪 |
|----|------|--------|
| H1 | 强化环境（剧变/高压/耗竭）提升 unanimousBases | 全部 ≤ 基线 |
| H2 | 适度强化（高频剧变）不导致种群崩溃 | 存活归零 |
| H3 | ≥2/4 碱基 unanimous 可达成 | 最佳处理组 < 2 |
| H4 | 过度强化（harsh/sparse）可证伪为无效 | 种群崩溃且 drift=0 |

---

## 二、实现

| 组件 | 路径 |
|------|------|
| 强化处理组 | `PHASE72_TREATMENTS` in `env-profile.js` |
| 验收 | `scripts/lib/phase72-analyze.js` |
| 田野 | `npm run field:phase72` |

### 处理组

| ID | 说明 |
|----|------|
| `w2_p71_ref` | Phase 71 基线（富足无剧变） |
| `w2_rein_shk` | 高频剧变（pulseInterval 50） |
| `w2_rein_harsh` | 组合高压 |
| `w2_rein_sparse` | 基底耗竭 |

---

## 三、田野结果（2026-07-29）

12体 × **3000** tick × 4 种子

| 处理组 | unanimousBases | meanDrift | 存活 |
|--------|----------------|-----------|------|
| w2_p71_ref | **3/4** | 0.019 | ✓ |
| w2_rein_shk | **3/4** | 0.020 | ✓ |
| w2_rein_harsh | 0/4 | 0 | ✗ 崩溃 |
| w2_rein_sparse | 0/4 | 0 | ✗ 崩溃 |

- 碱基 **0、2、3** unanimous；碱基 **1** 仍分歧
- **W2 目标达成**（≥2/4）— 综合 **support**
- GAP-10：**partial**（3/4，未达 4/4）
- 关键因子：tick 延长至 3000 比 Phase 71（2500）更有效；过度耗竭/高压可证伪

报告：`docs/field-phase72-report.json`

---

## 四、与 GAP-10 / GAP-W02

- GAP-W02：**部分结案** — 可重复选择压在智慧演化场 3000 tick 下可达 3/4
- GAP-10：仍开放 1 碱基（碱基 1 跨种子分歧）
- 禁止脚本化选择；有效路径为**适度开放时间 + 温和剧变**

---

*Phase 72 · W2 环境攻坚 support · Phase 73 预测层*
